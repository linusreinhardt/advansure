import { AveryMark } from "@/components/avery/avery-mark";

/** „Avery tippt…" – drei pulsierende Punkte in einer Avery-Blase. */
export function TypingDots() {
  return (
    <div className="flex items-end gap-2">
      <AveryMark size="sm" />
      <div
        className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-secondary px-4 py-3"
        role="status"
        aria-label="Avery schreibt"
      >
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-2 animate-bounce rounded-full bg-muted-foreground/70"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
