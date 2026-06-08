import { cn } from "@/lib/utils";
import { SEVERITY_LABELS, type SeverityLevel } from "@/lib/claim/types";
import { rateForSeverity } from "@/lib/valuation/rates";

/*
  Schadensgrad-Badge der Pauschalmethode. Nutzt die severity-Farb-Tokens
  (modus-unabhängig). Auf dunklem Grund: farbiger Punkt + farbiger Text auf
  dezentem Tint, damit die vier Stufen klar unterscheidbar bleiben.
*/

const STYLES: Record<SeverityLevel, { dot: string; text: string; tint: string }> = {
  leicht: { dot: "bg-severity-leicht", text: "text-severity-leicht", tint: "bg-severity-leicht/15" },
  mittel: { dot: "bg-severity-mittel", text: "text-severity-mittel", tint: "bg-severity-mittel/15" },
  schwer: { dot: "bg-severity-schwer", text: "text-severity-schwer", tint: "bg-severity-schwer/15" },
  total: { dot: "bg-severity-total", text: "text-severity-total", tint: "bg-severity-total/20" },
};

export interface SeverityBadgeProps {
  level: SeverityLevel;
  /** Pauschalsatz (z. B. „450 €/m²") mit anzeigen. */
  showRate?: boolean;
  className?: string;
}

export function SeverityBadge({ level, showRate = false, className }: SeverityBadgeProps) {
  const s = STYLES[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        s.tint,
        s.text,
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", s.dot)} aria-hidden />
      {SEVERITY_LABELS[level]}
      {showRate && (
        <span className="font-normal opacity-80">· {rateForSeverity(level)} €/m²</span>
      )}
    </span>
  );
}
