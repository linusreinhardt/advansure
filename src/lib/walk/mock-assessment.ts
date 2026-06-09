/*
  Deterministische PoC-Einschätzung für den Foto-Walk – Fallback, wenn keine
  KI konfiguriert ist (Server ohne API-Key) oder der KI-Aufruf scheitert
  (Client offline). Reine Funktion ohne Netzwerk/Latenz; an das Happy-Path-
  Beispiel des Pitch-Decks angelehnt (Wohnzimmer schwer · Flur mittel · …).
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
  /** Anzahl bereits abgeschlossener Räume – steuert Raumtyp & Schadensgrad. */
  roomIndex: number;
  /** Iteration innerhalb des aktuellen Raums (1-basiert), für FA-04. */
  iteration: number;
  /** Länge der Aufnahme in ms. */
  durationMs: number;
  /** Labels bereits erfasster Räume (Kontext für die KI). */
  capturedRoomLabels: string[];
}

const ROOM_SEQUENCE: { room: RoomType; severity: SeverityLevel }[] = [
  { room: "wohnzimmer", severity: "schwer" },
  { room: "flur", severity: "mittel" },
  { room: "kueche", severity: "leicht" },
  { room: "bad", severity: "mittel" },
  { room: "schlafzimmer", severity: "leicht" },
];

/** Unter dieser Aufnahmelänge gilt das Material als unzureichend (FA-04). */
export const INSUFFICIENT_BELOW_MS = 4000;

export function mockAssessment(input: AnalyzeInput): DamageAssessment {
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
  return {
    satisfied: true,
    user_message: "Perfekt, das reicht mir. Ich habe den Raum erfasst.",
    damage_assessment: {
      roomType: pick.room,
      roomLabel: ROOM_LABELS[pick.room],
      severity: pick.severity,
      damageType: DAMAGE_TYPE_BY_CLAIM[input.claimType],
    },
  };
}
