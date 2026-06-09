/*
  Foto-Walk-Analyse (Client-Seite, AP6 / TU-04).

  Lädt das aufgenommene Video an `POST /api/walk` und gibt die strukturierte
  `DamageAssessment` zurück. Der Endpunkt nutzt Gemini-Vision, wenn ein API-Key
  gesetzt ist, sonst die deterministische Mock-Einschätzung. Schlägt der Aufruf
  fehl (z. B. offline), greift hier zusätzlich der lokale Mock, damit der
  Foto-Walk-Loop nie blockiert.
*/

import type { DamageAssessment } from "@/lib/claim/types";
import { mockAssessment, type AnalyzeInput } from "@/lib/walk/mock-assessment";

export type { AnalyzeInput } from "@/lib/walk/mock-assessment";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function analyzeCapture(
  input: AnalyzeInput,
  blob: Blob,
): Promise<DamageAssessment> {
  try {
    const form = new FormData();
    form.append("video", blob, `iteration-${input.iteration}.webm`);
    form.append("claimType", input.claimType);
    form.append("roomIndex", String(input.roomIndex));
    form.append("iteration", String(input.iteration));
    form.append("durationMs", String(input.durationMs));
    form.append("capturedRoomLabels", JSON.stringify(input.capturedRoomLabels));

    const res = await fetch("/api/walk", { method: "POST", body: form });
    if (!res.ok) throw new Error(`/api/walk ${res.status}`);
    return (await res.json()) as DamageAssessment;
  } catch {
    // Offline/Netzwerkfehler → lokaler Fallback, kurze Denkpause für die UX.
    await sleep(900);
    return mockAssessment(input);
  }
}
