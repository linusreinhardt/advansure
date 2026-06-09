/*
  Strukturierte KI-Antworten (TU-02 / TU-04).

  Doppelte Absicherung:
  • `*_RESPONSE_SCHEMA` zwingt Gemini per responseSchema in das JSON-Format.
  • Die Zod-Schemas validieren die Antwort defensiv (TU-02 Alternativablauf 2:
    nicht parsbare Antwort → kontrollierter Fallback statt Absturz).
*/

import { Type, type Schema } from "@google/genai";
import { z } from "zod";

const CLAIM_TYPES = [
  "leitungswasser",
  "feuer",
  "einbruch",
  "sturm",
  "elementar",
  "none",
] as const;

const ROOM_TYPES = [
  "wohnzimmer",
  "kueche",
  "schlafzimmer",
  "bad",
  "flur",
  "kinderzimmer",
  "arbeitszimmer",
  "keller",
  "sonstiger",
  "unbekannt",
] as const;

const SEVERITIES = ["leicht", "mittel", "schwer", "total", "none"] as const;

// --- Dialog (TU-02) ---------------------------------------------------------

export const dialogResultSchema = z.object({
  reply: z.string(),
  claim_type: z.enum(CLAIM_TYPES),
  covered: z.boolean(),
  cause: z.string(),
  affected_rooms: z.array(z.string()),
  ready_for_walk: z.boolean(),
  quick_replies: z.array(z.string()).max(4),
});

export type DialogResult = z.infer<typeof dialogResultSchema>;

export const DIALOG_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING },
    claim_type: { type: Type.STRING, enum: [...CLAIM_TYPES] },
    covered: { type: Type.BOOLEAN },
    cause: { type: Type.STRING },
    affected_rooms: { type: Type.ARRAY, items: { type: Type.STRING } },
    ready_for_walk: { type: Type.BOOLEAN },
    quick_replies: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "reply",
    "claim_type",
    "covered",
    "cause",
    "affected_rooms",
    "ready_for_walk",
    "quick_replies",
  ],
  propertyOrdering: [
    "reply",
    "claim_type",
    "covered",
    "cause",
    "affected_rooms",
    "ready_for_walk",
    "quick_replies",
  ],
};

// --- Video-Analyse (TU-04) --------------------------------------------------

export const visionResultSchema = z.object({
  satisfied: z.boolean(),
  user_message: z.string(),
  room_type: z.enum(ROOM_TYPES),
  room_label: z.string(),
  severity: z.enum(SEVERITIES),
  damage_type: z.string(),
  next_request: z.string(),
});

export type VisionResult = z.infer<typeof visionResultSchema>;

export const VISION_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    satisfied: { type: Type.BOOLEAN },
    user_message: { type: Type.STRING },
    room_type: { type: Type.STRING, enum: [...ROOM_TYPES] },
    room_label: { type: Type.STRING },
    severity: { type: Type.STRING, enum: [...SEVERITIES] },
    damage_type: { type: Type.STRING },
    next_request: { type: Type.STRING },
  },
  required: [
    "satisfied",
    "user_message",
    "room_type",
    "room_label",
    "severity",
    "damage_type",
    "next_request",
  ],
  propertyOrdering: [
    "satisfied",
    "user_message",
    "room_type",
    "room_label",
    "severity",
    "damage_type",
    "next_request",
  ],
};
