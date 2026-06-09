import { NextResponse } from "next/server";
import { z } from "zod";

import { respond, type AveryState } from "@/lib/avery/engine";
import { isGeminiEnabled } from "@/lib/ai/config";
import { runDialog } from "@/lib/ai/dialog";
import type { DialogTurn } from "@/lib/ai/prompt-builder";

/*
  TU-02 – Avery-Dialog-Endpunkt.

  Mit gesetztem GOOGLE_AI_STUDIO_API_KEY beantwortet Gemini den Dialog (System-
  Prompt + Verlauf + neue Nachricht) und liefert eine strukturierte `AveryReply`.
  Ohne Key – oder bei KI-Fehler (TU-02 Alternativablauf 1/2) – antwortet die
  deterministische lokale Engine. Die Chat-UI konsumiert in beiden Fällen
  dasselbe Format und bleibt unverändert.
*/

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const messageSchema = z
  .object({
    role: z.enum(["avery", "user"]),
    text: z.string(),
    kind: z.string(),
  })
  .passthrough();

const bodySchema = z.object({
  message: z.string().min(1),
  state: z.object({ step: z.string(), draft: z.unknown() }),
  history: z.array(messageSchema).optional(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const state = parsed.data.state as AveryState;
  const history = (parsed.data.history ?? []) as DialogTurn[];
  const message = parsed.data.message;

  if (isGeminiEnabled()) {
    try {
      const reply = await runDialog(state, history, message);
      return NextResponse.json(reply);
    } catch {
      // TU-02: KI nicht erreichbar/Antwort nicht parsbar → lokale Engine.
      return NextResponse.json(respond(state, message));
    }
  }

  return NextResponse.json(respond(state, message));
}
