"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MessagesSquare, ShieldCheck, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AveryMark } from "@/components/avery/avery-mark";

export const ONBOARDING_FLAG = "advansure:onboarded";

interface Step {
  icon: typeof MessagesSquare;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: MessagesSquare,
    title: "Erzähl mir, was passiert ist",
    body: "Kein Formular, keine 24 Felder. Beschreib deinen Schaden einfach in eigenen Worten – ich erkenne den Rest.",
  },
  {
    icon: Video,
    title: "Ein kurzes Video genügt",
    body: "Ich führe dich durch eine etwa 15-sekündige Aufnahme pro Raum. So wird der Schaden vollständig dokumentiert – ohne lästiges Foto-Sammeln.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent bis zur Auszahlung",
    body: "Du siehst sofort, welche Räume erfasst sind und mit welcher Summe du rechnen kannst. Klar und nachvollziehbar.",
  },
];

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const finish = () => {
    try {
      window.localStorage.setItem(ONBOARDING_FLAG, "1");
    } catch {
      /* localStorage nicht verfügbar – Onboarding wird ggf. erneut gezeigt */
    }
    router.push("/claim");
  };

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <main className="fixed inset-0 flex flex-col bg-background safe-area-inset">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]"
      />

      <div className="flex justify-end px-5 pt-5">
        <button
          type="button"
          onClick={finish}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Überspringen
        </button>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-8 flex flex-col items-center gap-4">
          <AveryMark size="xl" active={step === 0} />
          {step === 0 && (
            <p className="text-sm font-medium text-muted-foreground">
              Hallo, ich bin Avery.
            </p>
          )}
        </div>

        <div key={step} className="flex flex-col items-center animate-fade-up">
          <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-secondary">
            <Icon className="size-7 text-primary" />
          </div>
          <h1 className="max-w-[18ch] font-display text-3xl font-medium leading-tight">
            {current.title}
          </h1>
          <p className="mt-4 max-w-[34ch] text-base leading-relaxed text-muted-foreground">
            {current.body}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-5 px-8 pb-10">
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-primary" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>
        <Button size="lg" className="w-full" onClick={() => (isLast ? finish() : setStep(step + 1))}>
          {isLast ? "Los geht's" : "Weiter"}
          {!isLast && <ArrowRight />}
        </Button>
      </div>
    </main>
  );
}
