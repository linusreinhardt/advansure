/*
  Transport-Schicht für den Avery-Dialog (Client-Seite).

  Ruft `POST /api/dialog` auf. Der Endpunkt antwortet mit Gemini (wenn ein
  API-Key gesetzt ist) oder mit der lokalen Engine – in beiden Fällen im selben
  `AveryReply`-Format. Schlägt der Request fehl (z. B. offline), fällt diese
  Funktion zusätzlich auf die clientseitige Engine zurück, damit der Chat nie
  blockiert. Eine Mindest-„Denkzeit" hält den Verlauf natürlich.
*/

import { respond, type AveryReply, type AveryState } from "@/lib/avery/engine";
import type { ChatMessage } from "@/lib/claim/types";

const MIN_THINKING_MS = 500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function askAvery(
  state: AveryState,
  userInput: string,
  history: ChatMessage[] = [],
): Promise<AveryReply> {
  const startedAt = Date.now();
  try {
    const res = await fetch("/api/dialog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userInput, state, history }),
    });
    if (!res.ok) throw new Error(`/api/dialog ${res.status}`);
    const reply = (await res.json()) as AveryReply;
    await ensureMinThinking(startedAt);
    return reply;
  } catch {
    // Offline/Netzwerkfehler → lokale Engine.
    await ensureMinThinking(startedAt);
    return respond(state, userInput);
  }
}

async function ensureMinThinking(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_THINKING_MS) await sleep(MIN_THINKING_MS - elapsed);
}
