# Advansure

Dialoggeführte, KI-gestützte Schadenmeldung für die Hausratversicherung
(Projektsemester UIB · TH Mannheim × Convista).

Installierbare, offline-fähige Next.js-14-PWA mit der Ordnerstruktur der
3-Schichten-Architektur aus dem Konzept. Aufbauend auf dem Grundgerüst und dem
Design-System sind die **Avery Chat-UI & das Onboarding (AP4)**, die
**Kamera & Video-Capture (AP5)** sowie die **KI-Integration des Foto-Walk-Loops
(AP6, Google AI Studio / Gemini)** umgesetzt – ein durchgängiger Schadenflow von
der Beschreibung über den KI-gestützten Foto-Walk bis zur Vorgangsnummer.

> Details zu diesen Features: **[`docs/AVERY_FOTOWALK.md`](docs/AVERY_FOTOWALK.md)**.

## Funktionen

- **Onboarding** – kurze Vorstellung von Avery beim ersten Start (`/onboarding`).
- **Avery-Chat (FA-02)** – Schaden in eigenen Worten beschreiben; Avery erkennt
  den Typ, fragt nach Ursache und Räumen, behandelt unklare und nicht abgedeckte
  Eingaben. Verlauf bleibt nach Reload erhalten.
- **Foto-Walk (FA-03–FA-06)** – geführte Videoaufnahme pro Raum über die
  MediaRecorder-API (Auto-Stop nach 15 s), Iteration bei zu kurzer Aufnahme,
  Abbruch mit Bestätigung und Text-Fallback bei verweigerter Kamera.
- **KI-Integration (AP6, TU-02/TU-04)** – Gemini steuert den Avery-Dialog und
  analysiert das Foto-Walk-Video (Schadensgrad, „ausreichend?"). Aktiv, sobald
  `GOOGLE_AI_STUDIO_API_KEY` gesetzt ist; ohne Key/offline greift ein sauberer
  Fallback (lokale Engine bzw. Mock), die App bleibt immer lauffähig.
- **Zusammenfassung & Bestätigung (FA-07)** – vorläufige Schadenshöhe nach
  Pauschalmethode und lokale Vorgangsnummer `ADV-JJJJ-XXXX`.

Die Video-Persistenz in Supabase Storage (TU-03) und die serverseitige
Vorgangsnummer (TU-06) folgen mit dem Supabase-Backend-Paket.

## Stack

| Bereich        | Technologie                                   |
| -------------- | --------------------------------------------- |
| Framework      | Next.js 14 (App Router) · TypeScript          |
| Styling        | Tailwind CSS · shadcn/ui-Basis                |
| PWA            | Serwist (Service Worker, Manifest, Offline)   |
| Validierung    | Zod                                           |
| Hosting        | Vercel                                        |
| Geplant        | Supabase (DB/Storage/Auth) · Google AI Studio |

## Schnellstart

```bash
npm install
cp .env.example .env.local   # Werte eintragen, sobald Supabase/Gemini angebunden werden
npm run dev                  # http://localhost:3000
```

> Der Service Worker ist im Dev-Modus bewusst deaktiviert. PWA-Verhalten
> (Installieren, Offline) zeigt sich erst im Production-Build:

```bash
npm run build && npm run start
```

Skripte: `dev`, `build`, `start`, `lint`, `typecheck`.

## Projektstruktur

```
src/
├── app/
│   ├── layout.tsx            PWA-Metadaten, Viewport, Theme-Color
│   ├── page.tsx              Personalisierter Startscreen (FA-01)
│   ├── onboarding/           Avery-Onboarding (AP4)
│   ├── claim/                Schadenflow (Chat + Foto-Walk + Abschluss)
│   ├── globals.css           Design-Tokens (Dark Theme, severity/status)
│   ├── manifest.ts           Web-App-Manifest
│   ├── sw.ts                 Serwist Service Worker
│   ├── ~offline/             Offline-Fallback-Seite
│   └── api/                  Schicht 2 – Route Handler (Gateway + Services)
│       ├── health/           Lebenszeichen
│       ├── dialog/           Avery-Dialog (TU-02, PoC-Stub)
│       └── walk/             Video-Upload & Foto-Walk-Analyse (TU-04)
├── components/
│   ├── ui/                   Bausteine (button, card, badge, textarea)
│   ├── avery/                Chat-UI (AP4)
│   ├── walk/                 Kamera & Video-Capture (AP5)
│   ├── claim/                Flow-Orchestrierung, Zusammenfassung, Bestätigung
│   ├── onboarding/ · home/   Onboarding & Start-Einstieg
│   ├── advansure/            Domänen-Badges (severity)
│   └── pwa/                  OnlineStatus, InstallPrompt
└── lib/
    ├── env.ts · utils.ts     Env-Validierung, cn()-Helper
    ├── personas.ts           Demo-Personas (FA-01)
    ├── claim/                Domänen-Typen, Vorgangsnummer
    ├── avery/                Dialog-Engine (Fallback) + /api/dialog-Client (TU-02)
    ├── walk/                 MediaRecorder-Hook, /api/walk-Client, Mock (TU-03/04)
    ├── ai/                   Gemini-Anbindung: Client, Prompts, Schemas (AP6)
    ├── valuation/            Pauschalmethode/Sätze (TU-05)
    └── db/                   Supabase/Drizzle (folgt)
```

## Deployment (Vercel)

1. Repository auf GitHub pushen.
2. In Vercel als neues Projekt importieren (Framework wird automatisch erkannt).
3. Umgebungsvariablen aus `.env.example` in den Projekt-Settings hinterlegen
   (sobald Supabase/Gemini angebunden sind).

## Nächste Schritte im Projektstrukturplan

1. **Supabase-Backend (TU-01, TU-03, TU-06)**: Tabellen `claims`, `rooms`,
   `conversations`, `audit_logs` + Storage-Bucket, Seed-Daten (Leon, Robert,
   Julia); Video dauerhaft ablegen und Vorgangsnummer serverseitig vergeben.
2. **Mehrraum-Dokumentation (AP7)**: Raumkorrektur und Detailbearbeitung auf
   Basis der Result-/Summary-Ansicht.
3. **Feinschliff KI**: Prompt-Tuning, Persistenz des Dialogverlaufs in
   `conversations`, Audit-Logging der KI-Aufrufe.
