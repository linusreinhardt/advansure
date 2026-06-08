/*
  Foto-Walk-Analyse – Seam zur KI-Vision (AP6 / TU-04).

  WICHTIG – Scope-Grenze: Die echte Video-Analyse durch Gemini ist ein eigenes
  Arbeitspaket. Diese Datei liefert einen plausiblen PoC-Mock mit exakt dem im
  Konzept definierten JSON-Vertrag (satisfied / user_message / damage_assessment
  / next_request). Sobald `POST /api/walk` an Gemini angebunden ist (TU-04),
  wird hier nur der Mock gegen den Fetch-Aufruf getauscht.

  Der Mock bildet den Iterations-Loop (FA-04) ab: sehr kurze Clips gelten als
  „nicht ausreichend" und lösen eine gezielte Folgeaufforderung aus.
*/

import {
  DAMAGE_TYPE_BY_CLAIM,
  ROOM_LABELS,
  type ClaimType,
  type DamageAssessment,
  type RoomType,
  type SeverityLevel,
} from "@/lib/claim/types";

export interface AnalyzeInput {
  claimType: ClaimType;
  /** Anzahl bereits abgeschlossener Räume – steuert Raumtyp & Schadensgrad im Mock. */
  roomIndex: number;
  /** Iteration innerhalb des aktuellen Raums (1-basiert), für FA-04. */
  iteration: number;
  /** Länge der Aufnahme in ms. */
  durationMs: number;
}

// Reihenfolge & Schweregrade angelehnt an das Happy-Path-Beispiel im Pitch-Deck
// (Wohnzimmer schwer · Flur mittel · Küche leicht …).
const ROOM_SEQUENCE: { room: RoomType; severity: SeverityLevel }[] = [
  { room: "wohnzimmer", severity: "schwer" },
  { room: "flur", severity: "mittel" },
  { room: "kueche", severity: "leicht" },
  { room: "bad", severity: "mittel" },
  { room: "schlafzimmer", severity: "leicht" },
];

/** Unter dieser Aufnahmelänge fordert die (Mock-)KI eine Wiederholung an. */
const INSUFFICIENT_BELOW_MS = 4000;

const SIMULATED_LATENCY_MS = 1400;

export async function analyzeCapture(
  input: AnalyzeInput,
): Promise<DamageAssessment> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

  // FA-04: zu wenig Material → gezielte Folgeaufforderung, noch kein Ergebnis.
  if (input.durationMs < INSUFFICIENT_BELOW_MS && input.iteration < 5) {
    return {
      satisfied: false,
      user_message:
        "Das ging mir etwas zu schnell. Kannst du den Raum noch einmal langsam und etwas näher am Schaden filmen?",
      damage_assessment: null,
      next_request: "Bitte langsamer schwenken und näher an die beschädigte Stelle.",
    };
  }

  const pick = ROOM_SEQUENCE[input.roomIndex % ROOM_SEQUENCE.length];
  const damageType = DAMAGE_TYPE_BY_CLAIM[input.claimType];

  return {
    satisfied: true,
    user_message: "Perfekt, das reicht mir. Ich habe den Raum erfasst.",
    damage_assessment: {
      roomType: pick.room,
      roomLabel: ROOM_LABELS[pick.room],
      severity: pick.severity,
      damageType,
    },
  };
}

// --- Später (TU-04), statt des Mock-Bodys:
// const form = new FormData();
// form.append("video", blob, `${input.iteration}.webm`);
// form.append("claimType", input.claimType);
// form.append("iteration", String(input.iteration));
// const res = await fetch("/api/walk", { method: "POST", body: form });
// return (await res.json()) as DamageAssessment;
