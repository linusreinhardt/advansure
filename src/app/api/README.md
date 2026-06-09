# app/api — API Gateway & Services (Schicht 2)

Next.js Route Handler, serverless auf Vercel. Geplante Endpunkte:

| Route                    | Use Case | Zweck                                    |
|--------------------------|----------|------------------------------------------|
| `health/`                | —        | Lebenszeichen (vorhanden)                |
| `dialog/`                | TU-02    | Avery-Dialog (Gemini, Engine-Fallback) — vorhanden |
| `walk/`                  | TU-03/04 | Video-Upload & KI-Analyse (Gemini, Mock-Fallback) — vorhanden |
| `session/`               | TU-01    | Session erzeugen, Stammdaten ausliefern (folgt) |
| `claims/`                | TU-06    | Schadenmeldung persistieren, Vorgangsnr. (folgt) |
