/*
  Laufzeit-Konfiguration der KI-Anbindung (Google AI Studio / Gemini).

  Bewusst „weich": Fehlt der API-Key, läuft die App im PoC-Modus weiter und
  nutzt die deterministischen Fallbacks (lokale Dialog-Engine bzw. Mock-Analyse).
  Sobald GOOGLE_AI_STUDIO_API_KEY gesetzt ist, schaltet sich die echte KI ein –
  ohne Code-Änderung. Nur serverseitig verwenden (kein NEXT_PUBLIC).
*/

export function geminiApiKey(): string | undefined {
  const key = process.env.GOOGLE_AI_STUDIO_API_KEY?.trim();
  return key ? key : undefined;
}

/** Multimodales Modell für Dialog (TU-02) und Video-Analyse (TU-04). */
export function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export function isGeminiEnabled(): boolean {
  return Boolean(geminiApiKey());
}

/**
 * Loggt einmalig pro Prozess, ob die KI aktiv ist – hilft beim Einrichten
 * (sichtbar in der `npm run dev`-Konsole), ohne jede Anfrage zuzuspammen.
 */
let statusLogged = false;
export function logGeminiStatusOnce(): void {
  if (statusLogged) return;
  statusLogged = true;
  if (isGeminiEnabled()) {
    console.info(`[ai] Gemini aktiv (Modell: ${geminiModel()})`);
  } else {
    console.warn(
      "[ai] GOOGLE_AI_STUDIO_API_KEY nicht gesetzt – lokale Fallbacks (Engine/Mock) aktiv.",
    );
  }
}
