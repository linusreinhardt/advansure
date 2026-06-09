# Avery Chat-UI & Foto-Walk

Dokumentation der Arbeitspakete **AP4 – Avery Chat-UI & Onboarding** und
**AP5 – Kamera & Video-Capture**. Beide bauen auf dem PWA-Grundgerüst und dem
Design-System auf und sind so geschnitten, dass die KI-Integration (AP6) und die
Mehrraum-Dokumentation (AP7) ohne UI-Umbau andocken können.

## Design-Entscheidung

Es gab zwei Design-Richtungen: das dunkle Premium-Theme des Grundgerüsts
(Amber-CTA, Smaragd-Akzent, Serif-Display – Slide 10 „unser bisheriges Design")
und die helle Navy-Variante des Design-Systems (schematische Mockups auf Slide 7).

Maßgeblich ist das **dunkle Theme**, weil es der real eingecheckte App-Stand ist
(globals.css, Manifest/Theme-Color, Startscreen). Aus dem Design-System
übernommen wurden die Domänenkonzepte: die Schadensgrad-Skala (`severity`-Tokens)
und die semantischen Status-Töne (`success`/`warning`/`info`), ergänzt in
`globals.css` und `tailwind.config.ts`.

## Ablauf (State Machine)

```
 Start (/)  ──►  Onboarding (/onboarding, einmalig)  ──►  Schaden melden (/claim)
                                                              │
                          ┌───────────────────────────────────┘
                          ▼
   ┌─────────────────────────────  ClaimFlow  ─────────────────────────────┐
   │  chat ──(Foto-Walk starten)──► walk ──(Aufnahme)──► analyzing          │
   │   ▲                              │  ▲                   │              │
   │   │                        (Abbruch FA-05)        satisfied?           │
   │   │                              │  │             ├─ nein → walk (FA-04)│
   │   │◄── acknowledgeRoom ──────────┘  │             └─ ja → result        │
   │   │                                 │                   │  (Übernehmen) │
   │   │                       (FA-06: Text-Fallback)        ▼              │
   │  text-room → text-severity ───────────────────────►  chat              │
   │   │                                                                     │
   │   └──(weitere Räume? → finish)──► summary ──(absenden)──► confirmation  │
   └─────────────────────────────────────────────────────────────────────────┘
```

Orchestriert von `src/components/claim/claim-flow.tsx`. Der Dialogverlauf wird in
`localStorage` (`advansure:claim:<persona>`) gehalten und nach Reload
wiederhergestellt (FA-02 „Dialog-Persistenz").

## Dateien

**Logik (`src/lib`)**

| Datei | Zweck |
|---|---|
| `claim/types.ts` | Domänen-Typen (ClaimType, SeverityLevel, RoomDamage, DamageAssessment …) |
| `claim/case-number.ts` | Lokale Vorgangsnummer `ADV-JJJJ-XXXX` (FA-07) |
| `avery/engine.ts` | Lokale Dialog-Engine + Intent-Heuristik (Fallback, FA-02) |
| `avery/avery-client.ts` | Ruft `POST /api/dialog`; Offline-Fallback auf die lokale Engine |
| `walk/use-media-recorder.ts` | MediaRecorder-Hook: Berechtigung, Aufnahme, Auto-Stop (TU-03) |
| `walk/analyze.ts` | Lädt Video an `POST /api/walk`; Offline-Fallback auf Mock |
| `walk/mock-assessment.ts` | Deterministische PoC-Einschätzung (Fallback ohne KI) |
| `ai/config.ts` | Weiche KI-Konfiguration (Key optional, Modellwahl) |
| `ai/gemini.ts` | Gemini-Client-Wrapper: Timeout + Retry/Backoff |
| `ai/prompt-builder.ts` | System-Prompts + Content-/Video-Assembly |
| `ai/schemas.ts` | Zod- + responseSchema-Definitionen der KI-Antworten |
| `ai/dialog.ts` | Gemini-Dialog (TU-02) → `AveryReply` |
| `ai/vision.ts` | Gemini-Video-Analyse (TU-04) → `DamageAssessment` |
| `valuation/rates.ts` | Pauschalsätze & Default-Raumgrößen (TU-05) |
| `personas.ts` | Demo-Personas Leon/Robert/Julia (FA-01) |

**Komponenten (`src/components`)**

| Bereich | Komponenten |
|---|---|
| `avery/` | `avery-chat`, `message-list`, `message-bubble`, `typing-dots`, `quick-replies`, `composer`, `avery-mark` |
| `walk/` | `video-capture`, `recording-indicator`, `capture-review`, `camera-permission-denied`, `analyzing-overlay`, `room-result-card` |
| `claim/` | `claim-flow`, `claim-summary`, `claim-confirmation` |
| `onboarding/` | `onboarding` |
| `home/` | `start-claim-button` |
| `advansure/` | `severity-badge` |
| `ui/` | `card`, `badge`, `textarea` (+ vorhandener `button`) |

## Use-Case-Abdeckung

| Use Case | Umsetzung |
|---|---|
| FA-01 App-Start & Session | Personalisierter Startscreen über Mock-Persona |
| FA-02 Avery-Dialog | Chat mit Intent-Erkennung, Rückfrage (unklar) & höfliche Ablehnung (nicht abgedeckt), Verlaufs-Persistenz |
| FA-03 Foto-Walk (Happy Path) | Geführte Aufnahme, Anweisung, Erkennung pro Raum |
| FA-04 Iteration | Zu kurze Aufnahme → gezielte Folgeaufforderung (max. 5) |
| FA-05 Abbruch | Bestätigungsdialog, Rückkehr in den Chat |
| FA-06 Berechtigung verweigert | Verständliche Erklärung + „neu anfragen" / „im Chat beschreiben" |
| FA-07 Absenden & Vorgangsnummer | Zusammenfassung → lokale Vorgangsnummer + Bestätigung |
| TU-02 KI-Dialog | Gemini beantwortet den Dialog strukturiert; Engine als Fallback |
| TU-03 Videoaufnahme | MediaRecorder (WebM/VP8/VP9 → MP4-Fallback), Auto-Stop 15 s, Verwerfen < 2 s |
| TU-04 Video-Analyse | Gemini-Vision analysiert das Inline-Video; Mock als Fallback |

## KI-Integration (AP6)

Der Foto-Walk-Loop und der Avery-Dialog laufen über **Google AI Studio (Gemini)**:

- Ist `GOOGLE_AI_STUDIO_API_KEY` gesetzt, übernimmt Gemini den Dialog (TU-02) und
  die Video-Analyse (TU-04). Modell konfigurierbar über `GEMINI_MODEL`
  (Default `gemini-2.5-flash`).
- **Graceful Degradation:** Ohne Key – oder bei KI-Fehler/Offline – fällt jede
  Ebene sauber zurück: Route → lokale Engine bzw. Mock; Client → lokaler Fallback
  (TU-02 Alternativabläufe 1/2). Die App bleibt dadurch immer lauffähig.
- Der **Foto-Walk-Loop** (FA-03/FA-04) wird so von der echten KI gesteuert:
  Gemini liefert `satisfied` / `next_request`; bei unzureichendem Material fragt
  Avery gezielt nach, sonst wird der Raum übernommen.
- Das Video wird als **Inline-Daten** an Gemini übergeben (geeignet für kurze
  Clips ≤ ~15 s). Der API-Key bleibt serverseitig.

## Offene Folgepakete

- **Video-Persistenz (TU-03/Supabase-Backend):** In `api/walk` wird das Video
  aktuell inline analysiert; die dauerhafte Ablage in Supabase Storage
  (`walks/{walk_id}/{iteration}.webm`) gehört zum Supabase-Backend-Paket.
- **Persistenz/Vorgangsnummer (TU-06):** `case-number.ts` ist clientseitig;
  später ersetzt durch die atomare Postgres-Sequenz.
- **Mehrraum-Dokumentation (AP7):** Korrektur/Detailbearbeitung pro Raum baut auf
  der Result-/Summary-Ansicht auf.

## Demo & Test

```bash
npm run dev        # http://localhost:3000
```

1. Startscreen → „Schaden melden" → Onboarding → Chat.
2. „Wasserschaden im Wohnzimmer" eingeben → Avery fragt Ursache & Räume → bestätigt.
3. „Foto-Walk starten" → Kamera-Berechtigung erlauben → ca. 15 s filmen → „Verwenden".
4. Avery zeigt den erkannten Raum (Schadensgrad + vorläufige Höhe) → „Übernehmen".
5. „Zusammenfassung ansehen" → „Schaden absenden" → Vorgangsnummer.

**KI aktivieren:** `GOOGLE_AI_STUDIO_API_KEY` in `.env.local` setzen → Gemini
steuert Dialog & Analyse. Ohne Key läuft der identische Flow mit Engine/Mock.

**Hinweis Kamera:** `getUserMedia` benötigt einen sicheren Kontext
(`localhost` oder HTTPS). Tipp für die FA-04-Iteration: sehr kurz (< 4 s) filmen,
dann fordert die KI/der Mock eine erneute Aufnahme an.
```bash
npm run build && npm run start   # inkl. PWA / Service Worker
```
