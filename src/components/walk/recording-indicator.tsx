function formatClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

interface RecordingIndicatorProps {
  elapsedMs: number;
  maxMs: number;
}

/** „● REC 0:08 / 0:15" – roter Pulspunkt mit Zeitstand. */
export function RecordingIndicator({ elapsedMs, maxMs }: RecordingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
      <span className="size-2.5 animate-rec-pulse rounded-full bg-destructive" />
      <span className="tracking-wide">REC</span>
      <span className="tabular-nums text-white/80">
        {formatClock(elapsedMs)} / {formatClock(maxMs)}
      </span>
    </div>
  );
}
