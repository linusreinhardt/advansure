/*
  Foto-Walk-Video-Analyse über Gemini (TU-04), serverseitig.

  Sendet das Inline-Video + Kontext an Gemini und übersetzt die strukturierte
  Antwort in das `DamageAssessment`, das der Foto-Walk-Loop erwartet. Wirft bei
  Fehler; der Route-Handler fällt dann auf die Mock-Einschätzung zurück.
*/

import {
  ROOM_LABELS,
  type DamageAssessment,
  type RoomType,
  type SeverityLevel,
} from "@/lib/claim/types";
import { generateJson } from "@/lib/ai/gemini";
import { buildVisionContents, VISION_SYSTEM, type VisionContext } from "@/lib/ai/prompt-builder";
import { VISION_RESPONSE_SCHEMA, visionResultSchema } from "@/lib/ai/schemas";

export async function analyzeWalkVideo(
  ctx: VisionContext,
  videoBase64: string,
  mimeType: string,
): Promise<DamageAssessment> {
  const raw = await generateJson({
    systemInstruction: VISION_SYSTEM,
    contents: buildVisionContents(ctx, videoBase64, mimeType),
    responseSchema: VISION_RESPONSE_SCHEMA,
    temperature: 0.2,
  });

  const result = visionResultSchema.parse(JSON.parse(raw));

  const hasRoom = result.room_type !== "unbekannt" && result.severity !== "none";
  const satisfied = result.satisfied && hasRoom;

  return {
    satisfied,
    user_message: result.user_message,
    damage_assessment: satisfied
      ? {
          roomType: result.room_type as RoomType,
          roomLabel: result.room_label || ROOM_LABELS[result.room_type as RoomType],
          severity: result.severity as SeverityLevel,
          damageType: result.damage_type || "Schaden",
        }
      : null,
    next_request: result.next_request || undefined,
  };
}
