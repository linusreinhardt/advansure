import { CameraOff, PenLine, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RecorderStatus } from "@/lib/walk/use-media-recorder";

interface CameraPermissionDeniedProps {
  status: RecorderStatus;
  onRetry: () => void;
  onTextFallback: () => void;
}

const COPY: Record<string, { title: string; body: string }> = {
  denied: {
    title: "Kein Kamera-Zugriff",
    body: "Ohne Kamera-Zugriff kann ich keinen Foto-Walk durchführen. Du kannst die Berechtigung neu anfragen oder den Schaden stattdessen im Chat beschreiben.",
  },
  "no-camera": {
    title: "Keine Kamera gefunden",
    body: "Ich konnte keine Kamera auf diesem Gerät finden. Du kannst es erneut versuchen oder den Schaden stattdessen im Chat beschreiben.",
  },
  unsupported: {
    title: "Aufnahme nicht möglich",
    body: "Dieser Browser unterstützt die Videoaufnahme nicht. Beschreibe deinen Schaden stattdessen im Chat – das funktioniert genauso.",
  },
  error: {
    title: "Etwas ist schiefgelaufen",
    body: "Die Kamera ließ sich nicht starten. Versuch es noch einmal oder beschreibe den Schaden im Chat.",
  },
};

/**
 * FA-06: Kamera-Berechtigung verweigert / kein Gerät / nicht unterstützt.
 * Bietet die beiden dokumentierten Auswege: neu anfragen oder Text-Fallback.
 */
export function CameraPermissionDenied({
  status,
  onRetry,
  onTextFallback,
}: CameraPermissionDeniedProps) {
  const copy = COPY[status] ?? COPY.error;
  const canRetry = status !== "unsupported";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-secondary">
        <CameraOff className="size-7 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">{copy.title}</h2>
        <p className="mx-auto max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
          {copy.body}
        </p>
      </div>
      <div className="mt-2 flex w-full max-w-xs flex-col gap-3">
        {canRetry && (
          <Button size="lg" className="w-full" onClick={onRetry}>
            <RefreshCw />
            Berechtigung neu anfragen
          </Button>
        )}
        <Button
          size="lg"
          variant={canRetry ? "outline" : "default"}
          className="w-full"
          onClick={onTextFallback}
        >
          <PenLine />
          Schaden im Chat beschreiben
        </Button>
      </div>
    </div>
  );
}
