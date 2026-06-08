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
| `avery/engine.ts` | Scriptbasierte Dialog-Engine + Intent-Heuristik (FA-02) |
| `avery/avery-client.ts` | Transport-Seam → tauscht später gegen `POST /api/dialog` (TU-02) |
| `walk/use-media-recorder.ts` | MediaRecorder-Hook: Berechtigung, Aufnahme, Auto-Stop (TU-03) |
| `walk/analyze.ts` | Foto-Walk-Analyse (Mock) → tauscht später gegen `POST /api/walk` (TU-04) |
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
| TU-03 Videoaufnahme | MediaRecorder (WebM/VP8/VP9 → MP4-Fallback), Auto-Stop 15 s, Verwerfen < 2 s |

## Scope-Grenzen / Integrations-Seams

Klar markierte Andockpunkte für die Folgepakete – nichts davon erfordert
UI-Änderungen:

- **KI-Dialog (AP6 / TU-02):** `lib/avery/avery-client.ts` → `POST /api/dialog`
  (Stub vorhanden, nutzt aktuell dieselbe Engine).
- **Video-Analyse (AP6 / TU-04):** `lib/walk/analyze.ts` → `POST /api/walk`
  (Stub vorhanden, liefert Mock-`DamageAssessment`).
- **Video-Upload (TU-03):** in `claim-flow.tsx` (`handleCaptured`) ist der
  aufgenommene Blob referenziert; hier folgt der Supabase-Storage-Upload
  (`walks/{walk_id}/{iteration}.webm`).
- **Persistenz/Vorgangsnummer (TU-06):** `case-number.ts` ist clientseitig;
  später ersetzt durch die atomare Postgres-Sequenz.
- **Mehrraum-Dokumentation (AP7):** Korrektur/Detailbearbeitung pro Raum baut auf
  der Result-/Summary-Ansicht auf.

Der Schadensgrad und die erkannten Räume sind im PoC **gemockt** (deterministisch,
am Pitch-Deck orientiert) und im UI als KI-Einschätzung gekennzeichnet.

## Demo & Test

```bash
npm run dev        # http://localhost:3000
```

1. Startscreen → „Schaden melden" → Onboarding → Chat.
2. „Wasserschaden im Wohnzimmer" eingeben → Avery fragt Ursache & Räume → bestätigt.
3. „Foto-Walk starten" → Kamera-Berechtigung erlauben → ca. 15 s filmen → „Verwenden".
4. Avery zeigt den erkannten Raum (Schadensgrad + vorläufige Höhe) → „Übernehmen".
5. „Zusammenfassung ansehen" → „Schaden absenden" → Vorgangsnummer.

**Hinweis Kamera:** `getUserMedia` benötigt einen sicheren Kontext
(`localhost` oder HTTPS). Tipp für die FA-04-Iteration: sehr kurz (< 4 s) filmen,
dann fordert Avery eine erneute Aufnahme an.
```bash
npm run build && npm run start   # inkl. PWA / Service Worker
```
