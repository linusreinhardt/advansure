import { NextResponse } from "next/server";

import { isGeminiEnabled } from "@/lib/ai/config";
import { analyzeWalkVideo } from "@/lib/ai/vision";
import { mockAssessment, type AnalyzeInput } from "@/lib/walk/mock-assessment";
import type { ClaimType } from "@/lib/claim/types";

/*
  TU-03 / TU-04 – Video-Upload & Foto-Walk-Analyse.

  Nimmt das aufgenommene Video (multipart/form-data) entgegen und liefert eine
  `DamageAssessment` zurück. Mit gesetztem GOOGLE_AI_STUDIO_API_KEY analysiert
  Gemini-Vision das Inline-Video (TU-04); ohne Key – oder bei KI-Fehler – greift
  die deterministische Mock-Einschätzung, damit der Loop nie blockiert.

  Hinweis: Inline-Video ist für kurze Clips (≤ ~15 s) ausgelegt. Die persistente
  Ablage in Supabase Storage (walks/{walk_id}/{iteration}.webm) gehört zum
  Supabase-Backend-Arbeitspaket (TU-01/TU-03).
*/

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  let capturedRoomLabels: string[] = [];
  const rawLabels = form.get("capturedRoomLabels");
  if (typeof rawLabels === "string") {
    try {
      const parsed = JSON.parse(rawLabels);
      if (Array.isArray(parsed)) capturedRoomLabels = parsed.map(String);
    } catch {
      /* ignorieren – ohne Raumkontext weiterarbeiten */
    }
  }

  const input: AnalyzeInput = {
    claimType,
    iteration,
    roomIndex,
    durationMs,
    capturedRoomLabels,
  };

  if (isGeminiEnabled()) {
    try {
      const base64 = Buffer.from(await video.arrayBuffer()).toString("base64");
      const mimeType = video.type || "video/webm";
      const assessment = await analyzeWalkVideo(
        { claimType, iteration, capturedRoomLabels, durationMs },
        base64,
        mimeType,
      );
      return NextResponse.json(assessment);
    } catch {
      // TU-04: KI nicht erreichbar/ungültig → Mock, damit der Loop weiterläuft.
      return NextResponse.json(mockAssessment(input));
    }
  }

  return NextResponse.json(mockAssessment(input));
}
