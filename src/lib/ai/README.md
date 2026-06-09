# lib/ai — KI-Anbindung (Schicht 3)

Google AI Studio (Gemini, multimodal) für Dialog (TU-02) und Video-Analyse (TU-04).
Umgesetzt (AP6):

- `config.ts` — weiche Konfiguration (API-Key optional, Modellwahl)
- `gemini.ts` — SDK-Client und Aufruf-Wrapper inkl. Retry/Timeout
- `prompt-builder.ts` — Multimodal-Assembly: System-Prompt + Verlauf + Video
- `schemas.ts` — Zod- und `responseSchema`-Definitionen der KI-Antworten
- `dialog.ts` — Gemini-Dialog → `AveryReply` (TU-02)
- `vision.ts` — Gemini-Video-Analyse → `DamageAssessment`
  (`satisfied`, `user_message`, `damage_assessment`, `next_request`) (TU-04)

Aktiv, sobald `GOOGLE_AI_STUDIO_API_KEY` gesetzt ist; sonst greifen die
deterministischen Fallbacks (lokale Engine bzw. Mock). Aufgerufen über die
Route-Handler `app/api/dialog` und `app/api/walk`.

Bezug: PSP „KI-Services anbinden", TU-02 / TU-04.
