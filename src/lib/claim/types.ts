/*
  Zentrale Domänen-Typen der Schadenmeldung.

  Gemeinsam genutzt von Avery-Chat (FA-02), Foto-Walk (FA-03 ff.) und der
  Pauschalmethode (TU-05). Bewusst an die Hausrat-Domäne und an die im Konzept
  definierten KI-Strukturfelder (satisfied / user_message / damage_assessment)
  angelehnt, damit das Backend (TU-02 / TU-04) später ohne UI-Umbau andocken kann.
*/

/** Von einer Hausratversicherung abgedeckte Schadenarten. */
export type ClaimType =
  | "leitungswasser"
  | "feuer"
  | "einbruch"
  | "sturm"
  | "elementar";

/** Ergebnis der Intent-Erkennung im Avery-Dialog. */
export type ClaimRecognition =
  | { kind: "covered"; claimType: ClaimType }
  // erkannt, aber nicht über Hausrat abgedeckt (z. B. KFZ) – FA-02 Alt. 2
  | { kind: "not_covered"; topic: string }
  // Intent nicht eindeutig – FA-02 Alt. 1 (Rückfrage)
  | { kind: "unclear" };

/** Schadensgrad-Stufen der Pauschalmethode (vgl. severity-Tokens). */
export type SeverityLevel = "leicht" | "mittel" | "schwer" | "total";

/** Raumtypen, die der Foto-Walk pro Aufnahme erkennt. */
export type RoomType =
  | "wohnzimmer"
  | "kueche"
  | "schlafzimmer"
  | "bad"
  | "flur"
  | "kinderzimmer"
  | "arbeitszimmer"
  | "keller"
  | "sonstiger";

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  leitungswasser: "Leitungswasserschaden",
  feuer: "Brand-/Feuerschaden",
  einbruch: "Einbruchdiebstahl",
  sturm: "Sturmschaden",
  elementar: "Elementarschaden",
};

export const ROOM_LABELS: Record<RoomType, string> = {
  wohnzimmer: "Wohnzimmer",
  kueche: "Küche",
  schlafzimmer: "Schlafzimmer",
  bad: "Bad",
  flur: "Flur",
  kinderzimmer: "Kinderzimmer",
  arbeitszimmer: "Arbeitszimmer",
  keller: "Keller",
  sonstiger: "Raum",
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  leicht: "Leicht",
  mittel: "Mittel",
  schwer: "Schwer",
  total: "Totalschaden",
};

/** Klartext-Schadensart je Schadenart (für KI-Mock & Text-Fallback). */
export const DAMAGE_TYPE_BY_CLAIM: Record<ClaimType, string> = {
  leitungswasser: "Wasserschaden",
  feuer: "Brandschaden",
  einbruch: "Einbruchschaden",
  sturm: "Sturmschaden",
  elementar: "Wasserschaden",
};

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export type ChatRole = "avery" | "user";

export type ChatMessageKind =
  // normale Konversationsblase
  | "text"
  // grüner „✓ … erkannt"-Chip (Intent bestätigt)
  | "confirmation"
  // dezenter System-/Statushinweis (z. B. „Foto-Walk abgebrochen")
  | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  kind: ChatMessageKind;
  /** Epoch-ms; für Reihenfolge und Persistenz nach Reload (FA-02). */
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Foto-Walk & KI-Einschätzung
// ---------------------------------------------------------------------------

/** Pro-Raum-Einschätzung der KI-Vision (Teil von DamageAssessment). */
export interface RoomDamage {
  roomType: RoomType;
  roomLabel: string;
  severity: SeverityLevel;
  /** Klartext der Schadensart, z. B. „Wasserschaden". */
  damageType: string;
}

/**
 * Strukturierte KI-Antwort einer Foto-Walk-Iteration (TU-04).
 * Entspricht dem im Konzept definierten JSON-Vertrag.
 */
export interface DamageAssessment {
  /** true = Dokumentation reicht aus, Loop endet (XOR-Gateway „Videomaterial genügt?"). */
  satisfied: boolean;
  /** Averys Nachricht an den Nutzer (Bestätigung oder Rückfrage). */
  user_message: string;
  /** Erkannte Raum-Einschätzung; null, solange noch nicht genug erkannt wurde. */
  damage_assessment: RoomDamage | null;
  /** Konkrete Folgeaufforderung bei satisfied=false, z. B. „Zeig mir den Boden näher." */
  next_request?: string;
}

/** Ein im Walk abgeschlossener (von der KI bestätigter) Raum. */
export interface RoomCapture {
  id: string;
  damage: RoomDamage;
  /** Anzahl benötigter Aufnahme-Iterationen (FA-04). */
  iterations: number;
  /** Dauer der finalen Aufnahme in ms. */
  durationMs: number;
}

export interface ClaimDraft {
  claimType: ClaimType | null;
  claimTypeLabel: string | null;
  /** Mutmaßliche Ursache in den Worten des Nutzers. */
  cause: string | null;
  rooms: RoomCapture[];
}

export function emptyClaimDraft(): ClaimDraft {
  return { claimType: null, claimTypeLabel: null, cause: null, rooms: [] };
}
