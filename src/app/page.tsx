import Link from "next/link";

import { getPersona, formatEur } from "@/lib/personas";
import { AveryMark } from "@/components/avery/avery-mark";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { StartClaimButton } from "@/components/home/start-claim-button";

export default function Home() {
  // PoC: personalisierter Startscreen über Mock-User-ID (FA-01). Später aus der Session (TU-01).
  const persona = getPersona();

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* atmosphärische Glows im Markenton */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-[-20%] h-72 w-72 rounded-full bg-accent/15 blur-[110px]"
      />

      {/* Kopfzeile */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-primary via-accent to-foreground/70 text-[13px] font-bold text-background">
            A
          </span>
          advansure
        </span>
        <div className="flex items-center gap-3">
          <InstallPrompt />
          <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold text-foreground">
            {persona.firstName[0]}
          </span>
        </div>
      </header>

      <section className="relative z-10 flex flex-1 flex-col px-6 pt-10">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Deine Hausrat
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium leading-[1.05] text-foreground">
          {persona.address}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {persona.livingSpaceSqm} m² · {persona.itemsInsured} Gegenstände versichert
        </p>

        {/* Versichert-bis-Karte mit Smaragd-Akzent */}
        <div className="relative mt-7 overflow-hidden rounded-2xl border border-border bg-card p-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-accent/15 blur-2xl"
          />
          <p className="text-xs font-medium uppercase tracking-wider text-accent">
            Versichert bis
          </p>
          <p className="mt-1 font-display text-4xl font-medium tabular-nums">
            {formatEur(persona.sumInsuredEur)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Voll wertgesichert · {formatEur(persona.monthlyPremiumEur, true)}/Monat
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3">
          <StartClaimButton />
          <div className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <AveryMark size="sm" />
            Avery hilft dir – sprich, tippe oder filme.
          </div>
        </div>

        <Link
          href="/onboarding"
          className="mt-6 text-center text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          So funktioniert Advansure
        </Link>
      </section>

      <footer className="relative z-10 px-6 pb-8 pt-10">
        <div className="rounded-2xl border border-border bg-card/50 px-4 py-3 text-xs text-muted-foreground">
          PoC · Avery-Chat &amp; Foto-Walk sind aktiv. Die KI-Analyse (Gemini) und die
          Persistenz (Supabase) werden in den nächsten Schritten angebunden.
        </div>
      </footer>
    </main>
  );
}
