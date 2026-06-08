import { NextResponse } from "next/server";
import { z } from "zod";

import { respond, type AveryState } from "@/lib/avery/engine";

/*
  TU-02 – Avery-Dialog-Endpunkt (PoC-Stub).

  Definiert bereits den Request/Response-Vertrag der Chat-UI. Heute beantwortet
  ihn dieselbe deterministische Engine wie der Client. Beim Anbinden des
  Google AI Studio (AP6) wird hier statt `respond(...)` der Verlauf an Gemini
  gesendet, die Antwort geparst und in der Tabelle `conversations` persistiert
  (siehe FA-02 / TU-02). Die UI ruft den Endpunkt über lib/avery/avery-client.ts.
*/

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  message: z.string().min(1),
  state: z.object({
    step: z.string(),
    draft: z.unknown(),
  }),
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

  const reply = respond(parsed.data.state as AveryState, parsed.data.message);
  return NextResponse.json(reply);
}
