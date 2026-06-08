import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-7 text-[13px]",
  md: "size-9 text-sm",
  lg: "size-12 text-lg",
  xl: "size-16 text-2xl",
} as const;

export interface AveryMarkProps {
  size?: keyof typeof SIZES;
  /** Sanfter Glow-Ring, z. B. während Avery „nachdenkt". */
  active?: boolean;
  className?: string;
}

/**
 * Averys Avatar – die gleiche Markengrafik wie das App-Logo (Amber→Smaragd),
 * als runder Chat-Avatar. Konsistent über Startscreen, Chat und Onboarding.
 */
export function AveryMark({ size = "md", active = false, className }: AveryMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary via-accent to-foreground/70 font-bold text-background",
        SIZES[size],
        className,
      )}
    >
      {active && (
        <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" />
      )}
      <span className="relative">A</span>
    </span>
  );
}
