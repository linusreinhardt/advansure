"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMediaRecorder } from "@/lib/walk/use-media-recorder";
import { RecordingIndicator } from "@/components/walk/recording-indicator";
import { CaptureReview } from "@/components/walk/capture-review";
import { CameraPermissionDenied } from "@/components/walk/camera-permission-denied";

export interface CaptureResult {
  blob: Blob;
  durationMs: number;
}

interface VideoCaptureProps {
  /** Averys Anweisung für diesen Raum, z. B. „Schwenk langsam durchs Wohnzimmer". */
  instruction: string;
  /** Position im Walk (1-basiert), für die „Raum N"-Anzeige. */
  roomNumber: number;
  onCaptured: (result: CaptureResult) => void;
  onCancel: () => void;
  onTextFallback: () => void;
}

const PERMISSION_STATES = ["denied", "no-camera", "unsupported", "error"];

export function VideoCapture({
  instruction,
  roomNumber,
  onCaptured,
  onCancel,
  onTextFallback,
}: VideoCaptureProps) {
  const recorder = useMediaRecorder({
    maxDurationMs: 15_000,
    minDurationMs: 2_000,
    facingMode: "environment",
  });
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { stream } = recorder;

  // Kamera beim Öffnen anfragen (FA-03 Schritt 2).
  useEffect(() => {
    recorder.requestCamera();
    // einmalig beim Mount – die Hook-Funktion ist stabil (useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
    Callback-Ref bindet den Stream zuverlässig – auch wenn das <video> nach
    „Neu aufnehmen" neu gemountet wird (der Stream selbst bleibt dabei gleich,
    ein Effect mit [stream]-Dependency würde dann nicht erneut feuern).
  */
  const bindVideo = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && stream) node.srcObject = stream;
    },
    [stream],
  );

  const { status } = recorder;
  const isRecording = status === "recording";
  const canRecord = status === "ready" || status === "too-short";
  const progress = Math.min(recorder.elapsedMs / recorder.maxDurationMs, 1);

  const shell = (children: React.ReactNode) => (
    <div className="safe-area-inset fixed inset-0 z-50 flex flex-col bg-black text-white">
      {children}
    </div>
  );

  // FA-06: Berechtigung verweigert / kein Gerät / nicht unterstützt.
  if (PERMISSION_STATES.includes(status)) {
    return shell(
      <>
        <TopClose onClose={onCancel} />
        <CameraPermissionDenied
          status={status}
          onRetry={recorder.requestCamera}
          onTextFallback={onTextFallback}
        />
      </>,
    );
  }

  // Aufnahme liegt vor → Vorschau & Bestätigung.
  if (status === "recorded" && recorder.previewUrl) {
    return shell(
      <CaptureReview
        previewUrl={recorder.previewUrl}
        durationMs={recorder.durationMs}
        onRetake={recorder.reset}
        onUse={() => {
          if (recorder.blob) {
            onCaptured({ blob: recorder.blob, durationMs: recorder.durationMs });
          }
        }}
      />,
    );
  }

  // Kamera wird noch angefragt/gestartet.
  if (status === "idle" || status === "requesting") {
    return shell(
      <>
        <TopClose onClose={onCancel} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white/80">
          <Loader2 className="size-7 animate-spin" />
          <p className="text-sm">Kamera wird gestartet…</p>
        </div>
      </>,
    );
  }

  // Live-Kamera (ready / recording / too-short).
  return shell(
    <div className="relative flex-1 overflow-hidden">
      <video
        ref={bindVideo}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 size-full object-cover"
      />

      {/* Kopfbereich: Abbrechen + REC-Indikator + Raumzähler */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent px-4 pb-10 pt-4">
        {isRecording ? (
          <span className="size-9" aria-hidden />
        ) : (
          <button
            type="button"
            aria-label="Foto-Walk abbrechen"
            onClick={() => setConfirmCancel(true)}
            className="grid size-9 place-items-center rounded-full bg-black/40 backdrop-blur"
          >
            <X className="size-5" />
          </button>
        )}
        {isRecording ? (
          <RecordingIndicator elapsedMs={recorder.elapsedMs} maxMs={recorder.maxDurationMs} />
        ) : (
          <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium backdrop-blur">
            Raum {roomNumber}
          </span>
        )}
        <span className="size-9" aria-hidden />
      </div>

      {/* Averys Anweisung, mittig gut lesbar */}
      <div className="pointer-events-none absolute inset-x-0 top-[18%] flex justify-center px-8">
        <p className="max-w-[28ch] text-balance rounded-2xl bg-black/45 px-4 py-2.5 text-center text-base font-medium leading-snug backdrop-blur">
          {instruction}
        </p>
      </div>

      {/* Steuerbereich unten */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/75 to-transparent px-6 pb-9 pt-12">
        {status === "too-short" && (
          <span className="rounded-full bg-warning/90 px-3 py-1 text-xs font-semibold text-warning-foreground">
            Zu kurz – bitte mindestens 2 Sekunden filmen
          </span>
        )}
        <RecordButton
          recording={isRecording}
          progress={progress}
          disabled={!canRecord && !isRecording}
          onStart={recorder.start}
          onStop={recorder.stop}
        />
        <p className="text-center text-xs text-white/70">
          {isRecording
            ? "Tippe zum Stoppen · endet automatisch nach 15s"
            : "Tippe zum Aufnehmen · ca. 15 Sekunden"}
        </p>
      </div>

      {/* FA-05: Abbruch bestätigen */}
      {confirmCancel && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/70 px-8">
          <div className="w-full max-w-xs rounded-2xl bg-card p-5 text-center text-card-foreground">
            <p className="font-semibold">Foto-Walk wirklich abbrechen?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Deine bisherige Aufnahme wird nicht gespeichert.
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmCancel(false)}
              >
                Nein, weiter
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  recorder.stopCamera();
                  onCancel();
                }}
              >
                Ja, abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>,
  );
}

function TopClose({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center px-4 pt-4">
      <button
        type="button"
        aria-label="Schließen"
        onClick={onClose}
        className="grid size-9 place-items-center rounded-full bg-white/10"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

interface RecordButtonProps {
  recording: boolean;
  progress: number;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

/** Aufnahme-Button im Kamera-Stil mit Fortschrittsring während der Aufnahme. */
function RecordButton({ recording, progress, disabled, onStart, onStop }: RecordButtonProps) {
  const size = 76;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <button
      type="button"
      aria-label={recording ? "Aufnahme stoppen" : "Aufnahme starten"}
      disabled={disabled}
      onClick={recording ? onStop : onStart}
      className="relative grid place-items-center disabled:opacity-50"
      style={{ width: size, height: size }}
    >
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={stroke}
        />
        {recording && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="white"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
          />
        )}
      </svg>
      <span
        className={cn(
          "bg-destructive transition-all",
          recording ? "size-7 rounded-md" : "size-[58px] rounded-full",
        )}
      />
    </button>
  );
}
