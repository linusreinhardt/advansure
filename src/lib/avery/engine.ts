/*
  Avery-Dialog-Engine (FA-02).

  Ein deterministischer, scriptbasierter Zustandsautomat, der den geführten
  Schadendialog abbildet: Begrüßung → Schadenbeschreibung → Ursache → betroffene
  Räume → Bestätigung → Übergang zum Foto-Walk. Die dokumentierten
  Alternativabläufe (unklarer Intent, nicht abgedeckte Schadenart) sind enthalten.

  WICHTIG – Austauschbarkeit (Scope-Grenze AP6/TU-02):
  Die eigentliche KI-Anbindung (Google AI Studio / Gemini) ist ein eigenes
  Arbeitspaket. Diese Engine ist die clientseitige PoC-Logik mit identischem
  Ein-/Ausgabe-Vertrag. Sie wird über `lib/avery/avery-client.ts` aufgerufen;
  dort genügt es später, den lokalen Aufruf gegen `fetch("/api/dialog")` zu
  tauschen – die Chat-UI bleibt unverändert.
*/

import {
  CLAIM_TYPE_LABELS,
  emptyClaimDraft,
  type ChatMessage,
  type ClaimDraft,
  type ClaimRecognition,
  type ClaimType,
  type RoomDamage,
  type SeverityLevel,
} from "@/lib/claim/types";
import type { Persona } from "@/lib/personas";

export type AveryStep =
  | "awaiting_description"
  | "awaiting_cause"
  | "awaiting_rooms"
  | "ready_for_walk"
  | "awaiting_more_rooms"
  | "done";

export interface AveryState {
  step: AveryStep;
  draft: ClaimDraft;
}

export type AveryActionId =
  | "start_walk"
  | "continue_walk"
  | "finish"
  | "text_fallback";

export interface AveryAction {
  id: AveryActionId;
  label: string;
  variant?: "default" | "secondary" | "outline";
  icon?: "camera" | "check" | "plus" | "text";
}

/** Nachrichtenentwurf – id & createdAt vergibt der Chat-Store beim Anhängen. */
export type AveryMessageDraft = Pick<ChatMessage, "role" | "text" | "kind">;

export interface AveryReply {
  state: AveryState;
  messages: AveryMessageDraft[];
  quickReplies?: string[];
  actions?: AveryAction[];
}

// ---------------------------------------------------------------------------
// Intent-Erkennung (Heuristik als PoC-Ersatz für die LLM-Klassifikation)
// ---------------------------------------------------------------------------

const KEYWORDS: Record<ClaimType, string[]> = {
  leitungswasser: [
    "wasser",
    "leitungswasser",
    "rohr",
    "rohrbruch",
    "leck",
    "undicht",
    "tropf",
    "nass",
    "feucht",
    "überschwemmt",
    "waschmaschine",
    "spülmaschine",
    "heizung",
  ],
  feuer: [
    "feuer",
    "brand",
    "brennt",
    "gebrannt",
    "kerze",
    "ruß",
    "rauch",
    "angekohlt",
    "verschmort",
    "kabelbrand",
    "kurzschluss",
  ],
  einbruch: [
    "einbruch",
    "eingebrochen",
    "gestohlen",
    "dieb",
    "geklaut",
    "aufgebrochen",
    "einbrecher",
    "raub",
  ],
  sturm: ["sturm", "orkan", "hagel", "dachziegel", "umgestürzt", "windbruch"],
  elementar: [
    "hochwasser",
    "starkregen",
    "überschwemmung",
    "unwetter",
    "erdrutsch",
  ],
};

// Themen, die klar nicht zur Hausratversicherung gehören (FA-02 Alt. 2).
// `topic` steht im Dativ, da es hinter „Das klingt nach …" eingesetzt wird.
const NOT_COVERED: { keywords: string[]; topic: string }[] = [
  { keywords: ["auto", "kfz", "pkw", "wagen", "fahrzeug"], topic: "einem KFZ-Schaden" },
  { keywords: ["motorrad", "roller"], topic: "einem Fahrzeugschaden" },
  { keywords: ["gebäude", "mauer", "dachstuhl", "fundament"], topic: "einem Gebäudeschaden" },
  { keywords: ["körper", "verletzt", "arzt"], topic: "einem Personenschaden" },
];

function normalize(input: string): string {
  return input.toLowerCase().trim();
}

export function classifyClaim(input: string): ClaimRecognition {
  const text = normalize(input);
  if (text.length === 0) return { kind: "unclear" };

  // Nicht abgedeckte Themen zuerst prüfen, damit „Auto im Carport" nicht als
  // Sturm/Wasser durchrutscht.
  for (const entry of NOT_COVERED) {
    if (entry.keywords.some((k) => text.includes(k))) {
      return { kind: "not_covered", topic: entry.topic };
    }
  }

  const scores = (Object.keys(KEYWORDS) as ClaimType[])
    .map((type) => ({
      type,
      score: KEYWORDS[type].filter((k) => text.includes(k)).length,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scores.length === 0) return { kind: "unclear" };
  return { kind: "covered", claimType: scores[0].type };
}

// ---------------------------------------------------------------------------
// Hilfen für Avery-Texte
// ---------------------------------------------------------------------------

function avery(text: string): AveryMessageDraft {
  return { role: "avery", text, kind: "text" };
}

function confirmation(text: string): AveryMessageDraft {
  return { role: "avery", text, kind: "confirmation" };
}

function system(text: string): AveryMessageDraft {
  return { role: "avery", text, kind: "system" };
}

/** Folgefrage nach der Ursache, abhängig von der erkannten Schadenart. */
function causeQuestion(type: ClaimType): string {
  switch (type) {
    case "leitungswasser":
      return "Verstanden. Weißt du, woher das Wasser kommt?";
    case "feuer":
      return "Das tut mir leid. Weißt du, wodurch das Feuer entstanden ist?";
    case "einbruch":
      return "Das ist ärgerlich. Wie sind die Täter reingekommen?";
    case "sturm":
      return "Verstanden. Was genau hat der Sturm beschädigt?";
    case "elementar":
      return "Verstanden. Was genau ist durch das Unwetter passiert?";
  }
}

const START_WALK_ACTION: AveryAction = {
  id: "start_walk",
  label: "Foto-Walk starten",
  variant: "default",
  icon: "camera",
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

/** Initialer Begrüßungsschritt von Avery (FA-02 Normalablauf, Schritt 1). */
export function startConversation(persona: Persona): AveryReply {
  return {
    state: { step: "awaiting_description", draft: emptyClaimDraft() },
    messages: [
      avery(
        `Hallo ${persona.firstName}, ich bin Avery. Ich helfe dir, deinen Schaden schnell zu melden. Was ist passiert?`,
      ),
    ],
    quickReplies: ["Wasserschaden", "Brand", "Einbruch", "Sturmschaden"],
  };
}

/** Verarbeitet eine Nutzereingabe und liefert Averys Antwort + Folgezustand. */
export function respond(state: AveryState, userInput: string): AveryReply {
  switch (state.step) {
    case "awaiting_description":
      return handleDescription(state, userInput);
    case "awaiting_cause":
      return handleCause(state, userInput);
    case "awaiting_rooms":
      return handleRooms(state, userInput);
    case "ready_for_walk":
      return nudgeToWalk(state);
    case "awaiting_more_rooms":
      return handleMoreRoomsText(state, userInput);
    default:
      return { state, messages: [] };
  }
}

function handleDescription(state: AveryState, userInput: string): AveryReply {
  const recognition = classifyClaim(userInput);

  if (recognition.kind === "unclear") {
    return {
      state,
      messages: [
        avery(
          "Das habe ich noch nicht ganz verstanden. Kannst du es kurz beschreiben? Zum Beispiel: Wasser, Feuer, Einbruch oder Sturm.",
        ),
      ],
      quickReplies: ["Wasserschaden", "Brand", "Einbruch", "Sturmschaden"],
    };
  }

  if (recognition.kind === "not_covered") {
    return {
      state,
      messages: [
        avery(
          `Das klingt nach ${recognition.topic}. Das lässt sich leider nicht über deine Hausratversicherung melden – ich bin nur für Schäden an deinem Hausrat da. Ist sonst noch etwas in deiner Wohnung betroffen?`,
        ),
      ],
    };
  }

  const claimType = recognition.claimType;
  const label = CLAIM_TYPE_LABELS[claimType];
  return {
    state: {
      step: "awaiting_cause",
      draft: { ...state.draft, claimType, claimTypeLabel: label },
    },
    messages: [avery(causeQuestion(claimType))],
  };
}

function handleCause(state: AveryState, userInput: string): AveryReply {
  const cause = userInput.trim();
  return {
    state: {
      step: "awaiting_rooms",
      draft: { ...state.draft, cause: cause.length > 0 ? cause : null },
    },
    messages: [avery("Danke. Welche Räume sind betroffen?")],
    quickReplies: ["Wohnzimmer", "Küche", "Bad", "Mehrere Räume"],
  };
}

function handleRooms(state: AveryState, _userInput: string): AveryReply {
  const label = state.draft.claimTypeLabel ?? "Schaden";
  return {
    state: { ...state, step: "ready_for_walk" },
    messages: [
      confirmation(`${label} erkannt`),
      avery(
        "Danke dir. Damit ich den Umfang einschätzen kann, machen wir jetzt einen kurzen Video-Walk durch die betroffenen Räume. Das dauert nur etwa 15 Sekunden pro Raum.",
      ),
    ],
    actions: [START_WALK_ACTION],
  };
}

function nudgeToWalk(state: AveryState): AveryReply {
  return {
    state,
    messages: [
      avery(
        "Sobald du bereit bist, starte den Foto-Walk – ich führe dich Schritt für Schritt durch die Aufnahme.",
      ),
    ],
    actions: [START_WALK_ACTION],
  };
}

// ---------------------------------------------------------------------------
// Foto-Walk-Übergänge (von der Flow-Steuerung aufgerufen)
// ---------------------------------------------------------------------------

const SEVERITY_WORD: Record<SeverityLevel, string> = {
  leicht: "leichtem",
  mittel: "mittlerem",
  schwer: "schwerem",
  total: "sehr schwerem",
};

/** Ein Raum wurde von der KI bestätigt – Avery quittiert und fragt nach weiteren. */
export function acknowledgeRoom(
  state: AveryState,
  room: RoomDamage,
): AveryReply {
  return {
    state: { ...state, step: "awaiting_more_rooms" },
    messages: [
      avery(
        `Erkannt: ${room.roomLabel} mit ${SEVERITY_WORD[room.severity]} ${room.damageType}. Ist noch ein weiterer Raum betroffen?`,
      ),
    ],
    quickReplies: ["Ja, weiterer Raum", "Nein, das war's"],
    actions: [
      { id: "continue_walk", label: "Weiteren Raum aufnehmen", variant: "secondary", icon: "plus" },
      { id: "finish", label: "Zusammenfassung ansehen", variant: "default", icon: "check" },
    ],
  };
}

/** Textantwort im Schritt „weitere Räume?" (für Nutzer, die tippen statt klicken). */
function handleMoreRoomsText(state: AveryState, userInput: string): AveryReply {
  const text = normalize(userInput);
  const wantsMore =
    text.includes("ja") || text.includes("weiter") || text.includes("noch");
  if (wantsMore) {
    return {
      state,
      messages: [avery("Alles klar, nimm den nächsten Raum auf.")],
      actions: [
        { id: "continue_walk", label: "Weiteren Raum aufnehmen", variant: "default", icon: "plus" },
      ],
    };
  }
  return {
    state: { ...state, step: "done" },
    messages: [avery("Super, dann fasse ich alles für dich zusammen.")],
    actions: [
      { id: "finish", label: "Zusammenfassung ansehen", variant: "default", icon: "check" },
    ],
  };
}

/** Foto-Walk wurde abgebrochen (FA-05) – Avery beruhigt und bietet Neustart an. */
export function acknowledgeWalkCancelled(state: AveryState): AveryReply {
  return {
    state: { ...state, step: "ready_for_walk" },
    messages: [system("Foto-Walk abgebrochen. Du kannst jederzeit neu starten.")],
    actions: [START_WALK_ACTION],
  };
}
