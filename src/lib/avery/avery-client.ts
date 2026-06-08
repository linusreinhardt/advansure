/*
  Transport-Schicht für den Avery-Dialog – die einzige Stelle, die beim
  Anbinden des echten KI-Backends (AP6 / TU-02) angepasst werden muss.

  Heute: ruft die lokale Engine (lib/avery/engine.ts) mit einer simulierten
  „Avery tippt…"-Latenz auf, damit sich der Chat natürlich anfühlt und auch
  offline läuft.

  Später: Body an `POST /api/dialog` senden (Verlauf + neue Nachricht) und die
  strukturierte Antwort des Dialog-Endpunkts in eine `AveryReply` übersetzen.
  Die Chat-UI ruft ausschließlich `askAvery` auf und bleibt dadurch unverändert.
*/

import { respond, type AveryReply, type AveryState } from "@/lib/avery/engine";

/** Bandbreite der simulierten Antwortlatenz (ms). */
const THINKING_MIN_MS = 450;
const THINKING_MAX_MS = 1000;

function thinkingDelay(): number {
  return THINKING_MIN_MS + Math.random() * (THINKING_MAX_MS - THINKING_MIN_MS);
}

export async function askAvery(
  state: AveryState,
  userInput: string,
): Promise<AveryReply> {
  // --- PoC: lokale Engine mit simulierter Denkzeit ---
  await new Promise((resolve) => setTimeout(resolve, thinkingDelay()));
  return respond(state, userInput);

  // --- Später (TU-02), statt obigem Block:
  // const res = await fetch("/api/dialog", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ state, message: userInput }),
  // });
  // if (!res.ok) throw new Error(`Dialog-Endpoint ${res.status}`);
  // return (await res.json()) as AveryReply;
}
