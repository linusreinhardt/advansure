/*
  Prompt-Assembly für Gemini (TU-02 Dialog, TU-04 Video-Analyse).

  Die System-Prompts sind deutsch im Du-Format und an Averys Rolle als
  empathische Schadenassistentin der Hausratversicherung angelehnt. Die
  Ausgabeformate korrespondieren mit den Zod-/responseSchemas in schemas.ts.
*/

import type { Content } from "@google/genai";

import {
  CLAIM_TYPE_LABELS,
  type ChatRole,
  type ClaimType,
} from "@/lib/claim/types";

/** Minimaler Verlaufseintrag für den Prompt (entspricht ChatMessage-Teilmenge). */
export interface DialogTurn {
  role: ChatRole;
  text: string;
  kind: string;
}

export const AVERY_DIALOG_SYSTEM = `Du bist Avery, die freundliche KI-Assistentin der Hausratversicherung „Advansure".
Du hilfst Versicherungsnehmern, einen Schaden schnell und ohne Formular zu melden.

Stil: warmherzig, knapp, klares Deutsch im Du-Format, kein Fachjargon, höchstens 2 Sätze pro Antwort.

Deine Aufgabe im Dialog:
1. Erkenne die Schadenart aus den Worten des Nutzers. Mögliche, von der Hausratversicherung abgedeckte Arten:
   leitungswasser, feuer, einbruch, sturm, elementar.
2. Ist die Beschreibung unklar, stelle GENAU EINE gezielte Rückfrage (claim_type="none", ready_for_walk=false).
3. Betrifft es klar keinen Hausrat (z. B. KFZ, Gebäudesubstanz, Personen), setze covered=false und erkläre höflich,
   dass das nicht über die Hausratversicherung läuft (claim_type="none", ready_for_walk=false).
4. Ist die Schadenart erkannt, frage knapp nach Ursache und betroffenen Räumen.
5. Sobald Schadenart klar ist und du eine grobe Vorstellung von Ursache/Räumen hast, setze ready_for_walk=true und
   kündige den kurzen Video-Walk an (etwa 15 Sekunden pro Raum).

Fülle immer alle Felder:
- reply: deine sichtbare Nachricht an den Nutzer.
- claim_type: erkannte Art oder "none".
- covered: false nur bei klar nicht abgedeckten Themen, sonst true.
- cause: erkannte Ursache in Stichworten, sonst "".
- affected_rooms: genannte Räume (Klartext), sonst leer.
- ready_for_walk: true erst, wenn der Video-Walk sinnvoll starten kann.
- quick_replies: bis zu 4 kurze, hilfreiche Antwortvorschläge für den Nutzer (oder leer).`;

export const VISION_SYSTEM = `Du bist die Vision-Komponente von Avery (Hausratversicherung). Du erhältst ein kurzes Video eines Raums
aus einer Schadenmeldung und schätzt den Schaden strukturiert ein.

Bestimme:
- room_type: Raumtyp (wohnzimmer, kueche, schlafzimmer, bad, flur, kinderzimmer, arbeitszimmer, keller, sonstiger)
  oder "unbekannt", wenn nicht erkennbar.
- room_label: Klartext-Name des Raums (z. B. "Wohnzimmer").
- damage_type: Schadensart in Klartext (z. B. "Wasserschaden", "Brandschaden").
- severity: Schadensgrad nach Pauschalmethode:
    leicht  = kleiner, oberflächlicher Schaden
    mittel  = deutlich betroffener Bereich
    schwer  = großflächiger/struktureller Schaden
    total   = Raum praktisch unbrauchbar (Totalschaden)
  oder "none", wenn (noch) nicht beurteilbar.
- satisfied: true, wenn das Material für eine Einschätzung ausreicht; sonst false.
- next_request: bei satisfied=false eine konkrete, freundliche Folgeanweisung
  (z. B. "Bitte film den Boden näher und langsamer"); bei satisfied=true "".
- user_message: kurze, freundliche Nachricht an den Nutzer (Bestätigung bzw. Folgeanweisung).

Ist das Video sehr kurz, verwackelt oder zeigt es keinen klaren Schaden, setze satisfied=false.
Berücksichtige die bereits erfassten Räume und doppele sie nicht.`;

/** Wandelt den bisherigen Chatverlauf + neue Nachricht in Gemini-Contents. */
export function buildDialogContents(
  history: DialogTurn[],
  message: string,
): Content[] {
  const contents: Content[] = [];
  for (const m of history) {
    if (m.kind !== "text") continue; // Chips/Systemhinweise nicht als Turn senden
    contents.push({
      role: m.role === "avery" ? "model" : "user",
      parts: [{ text: m.text }],
    });
  }
  contents.push({ role: "user", parts: [{ text: message }] });
  return contents;
}

export interface VisionContext {
  claimType: ClaimType;
  iteration: number;
  capturedRoomLabels: string[];
  durationMs: number;
}

/** Baut die Vision-Contents: Kontexttext + Inline-Video. */
export function buildVisionContents(
  ctx: VisionContext,
  videoBase64: string,
  mimeType: string,
): Content[] {
  const captured =
    ctx.capturedRoomLabels.length > 0
      ? ctx.capturedRoomLabels.join(", ")
      : "noch keine";
  const contextText = `Kontext zur Schadenmeldung:
- Gemeldete Schadenart: ${CLAIM_TYPE_LABELS[ctx.claimType]}
- Bereits erfasste Räume: ${captured}
- Iteration für diesen Raum: ${ctx.iteration}
- Länge der Aufnahme: ${Math.round(ctx.durationMs / 1000)} Sekunden

Analysiere das folgende Raumvideo und antworte ausschließlich im vorgegebenen JSON-Format.`;

  return [
    {
      role: "user",
      parts: [
        { text: contextText },
        { inlineData: { mimeType, data: videoBase64 } },
      ],
    },
  ];
}
