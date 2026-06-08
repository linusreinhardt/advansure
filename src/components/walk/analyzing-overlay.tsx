import { AveryMark } from "@/components/avery/avery-mark";

/** Vollbild-Zwischenzustand, während die (KI-)Analyse läuft. */
export function AnalyzingOverlay() {
  return (
    <div className="safe-area-inset fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black text-white">
      <AveryMark size="xl" active />
      <div className="flex items-center gap-1.5" role="status" aria-label="Avery analysiert">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-2.5 animate-bounce rounded-full bg-white/70"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <p className="text-sm text-white/80">Avery wertet die Aufnahme aus…</p>
    </div>
  );
}
