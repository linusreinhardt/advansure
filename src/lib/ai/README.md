# lib/ai — KI-Anbindung (Schicht 3)

Google AI Studio (Gemini, multimodal) für Dialog (TU-02) und Video-Analyse (TU-04).
Hier entstehen in den nächsten Schritten:

- `gemini.ts` — SDK-Client und Aufruf-Wrapper inkl. Retry/Timeout
- `prompt-builder.ts` — Multimodal-Assembly: System-Prompt + History + Video
- `schemas.ts` — Zod-Schemas für strukturierte KI-Antworten
  (`satisfied`, `user_message`, `damage_assessment`)

Bezug: PSP „KI-Services anbinden", TU-02 / TU-04.
