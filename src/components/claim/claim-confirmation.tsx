import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ClaimConfirmationProps {
  caseNumber: string;
  onDone: () => void;
}

/**
 * Bestätigung nach dem Absenden (vgl. Deck Schritt 7).
 * Die eigentliche Persistenz & Statusverfolgung (TU-06 / FA-08) folgen als
 * eigene Arbeitspakete; hier wird die lokale Vorgangsnummer angezeigt.
 */
export function ClaimConfirmation({ caseNumber, onDone }: ClaimConfirmationProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="grid size-20 place-items-center rounded-full bg-success/15">
        <div className="grid size-14 place-items-center rounded-full bg-success text-success-foreground">
          <Check className="size-8" strokeWidth={3} />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="font-display text-2xl font-medium">Schaden eingegangen</h1>
        <p className="mx-auto max-w-[32ch] text-sm leading-relaxed text-muted-foreground">
          Danke! Deine Schadenmeldung ist bei uns eingegangen. Du bekommst eine
          E-Mail mit allen Details.
        </p>
      </div>

      <div className="w-full max-w-xs rounded-2xl border border-border bg-card px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Vorgangsnummer</p>
        <p className="mt-1 font-display text-2xl font-medium tabular-nums">{caseNumber}</p>
      </div>

      <Button size="lg" className="w-full max-w-xs" onClick={onDone}>
        Fertig
      </Button>
    </div>
  );
}
