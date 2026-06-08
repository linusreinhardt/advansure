import { Check, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CaptureReviewProps {
  previewUrl: string;
  durationMs: number;
  onUse: () => void;
  onRetake: () => void;
}

/** Vorschau der aufgenommenen Sequenz mit „Verwenden" / „Neu aufnehmen". */
export function CaptureReview({
  previewUrl,
  durationMs,
  onUse,
  onRetake,
}: CaptureReviewProps) {
  const seconds = Math.round(durationMs / 1000);

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex-1 bg-black">
        <video
          src={previewUrl}
          controls
          autoPlay
          playsInline
          loop
          className="absolute inset-0 size-full object-contain"
        />
        <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          Aufnahme · {seconds}s
        </span>
      </div>

      <div className="flex flex-col gap-3 px-5 py-5">
        <p className="text-center text-sm text-muted-foreground">
          Passt die Aufnahme? Du kannst sie verwenden oder neu aufnehmen.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="flex-1" onClick={onRetake}>
            <RotateCcw />
            Neu aufnehmen
          </Button>
          <Button size="lg" className="flex-1" onClick={onUse}>
            <Check />
            Verwenden
          </Button>
        </div>
      </div>
    </div>
  );
}
