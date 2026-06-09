/*
  Avery-Dialog über Gemini (TU-02), serverseitig.

  Übersetzt die strukturierte Gemini-Antwort in eine `AveryReply` – exakt das
  Format, das die Chat-UI ohnehin konsumiert. Wirft bei Fehler/ungültigem JSON;
  der Route-Handler fängt das ab und fällt auf die lokale Engine zurück.
*/

import { CLAIM_TYPE_LABELS, type ClaimDraft } from "@/lib/claim/types";
import type {
  AveryAction,
  AveryMessageDraft,
  AveryReply,
  AveryState,
  AveryStep,
} from "@/lib/avery/engine";
import { generateJson } from "@/lib/ai/gemini";
import {
  AVERY_DIALOG_SYSTEM,
  buildDialogContents,
  type DialogTurn,
} from "@/lib/ai/prompt-builder";
import { DIALOG_RESPONSE_SCHEMA, dialogResultSchema } from "@/lib/ai/schemas";

const START_WALK_ACTION: AveryAction = {
  id: "start_walk",
  label: "Foto-Walk starten",
  variant: "default",
  icon: "camera",
};

export async function runDialog(
  state: AveryState,
  history: DialogTurn[],
  message: string,
): Promise<AveryReply> {
  const raw = await generateJson({
    systemInstruction: AVERY_DIALOG_SYSTEM,
    contents: buildDialogContents(history, message),
    responseSchema: DIALOG_RESPONSE_SCHEMA,
  });

  const result = dialogResultSchema.parse(JSON.parse(raw));

  const claimType = result.claim_type === "none" ? null : result.claim_type;
  const label = claimType ? CLAIM_TYPE_LABELS[claimType] : null;
  const readyForWalk = result.ready_for_walk && Boolean(claimType);

  const messages: AveryMessageDraft[] = [
    { role: "avery", text: result.reply, kind: "text" },
  ];
  // Bestätigungs-Chip direkt über dem Foto-Walk-CTA.
  if (readyForWalk && label) {
    messages.push({ role: "avery", text: `${label} erkannt`, kind: "confirmation" });
  }

  const draft: ClaimDraft = {
    claimType,
    claimTypeLabel: label,
    cause: result.cause.trim() || state.draft.cause,
    rooms: state.draft.rooms,
  };
  const step: AveryStep = readyForWalk ? "ready_for_walk" : "awaiting_description";

  return {
    state: { step, draft },
    messages,
    quickReplies: readyForWalk ? [] : result.quick_replies,
    actions: readyForWalk ? [START_WALK_ACTION] : [],
  };
}
