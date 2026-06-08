import { NextResponse } from "next/server";

import { analyzeCapture } from "@/lib/walk/analyze";
import type { ClaimType } from "@/lib/claim/types";

/*
  TU-03 / TU-04 – Video-Upload & Foto-Walk-Analyse (PoC-Stub).

  Erwartet multipart/form-data mit dem Video plus Kontextfeldern. Heute liefert
  der Stub eine Mock-Einschätzung über denselben Analyzer wie der Client. Beim
  Anbinden (AP6) wird hier das Video in den Supabase Storage geladen
  (walks/{walk_id}/{iteration}.webm), an Gemini-Vision übergeben und das Ergebnis
  in der Tabelle `rooms` persistiert. Antwortvertrag: DamageAssessment.
*/

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  const video = form.get("video");
  if (!(video instanceof Blob)) {
    return NextResponse.json({ error: "missing_video" }, { status: 422 });
  }

  const claimType = (form.get("claimType")?.toString() ?? "leitungswasser") as ClaimType;
  const iteration = Number(form.get("iteration") ?? 1);
  const roomIndex = Number(form.get("roomIndex") ?? 0);
  const durationMs = Number(form.get("durationMs") ?? 8_000);

  const assessment = await analyzeCapture({ claimType, iteration, roomIndex, durationMs });
  return NextResponse.json(assessment);
}
