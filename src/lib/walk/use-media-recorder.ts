"use client";

/*
  useMediaRecorder – Kamera & Video-Capture (AP5 / TU-03).

  Kapselt getUserMedia + die MediaRecorder-API zu einem kleinen Zustandsautomaten:
  Berechtigung anfragen → Live-Vorschau → Aufnahme (Auto-Stop bei 15 s) → Blob.

  Berücksichtigte Konzept-Vorgaben:
  • WebM/VP8/VP9 mit Fallback auf MP4 (Safari).            (TU-03 Umsetzung)
  • Auto-Stop bei maxDurationMs (Standard 15 s).            (Foto-Walk-Vorgabe)
  • Aufnahmen < minDurationMs werden verworfen.             (TU-03 Alternativablauf 2)
  • Fehler-Mapping: NotAllowedError → "denied".             (FA-06)
*/

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus =
  | "idle" // Kamera noch nicht angefragt
  | "requesting" // Berechtigungsdialog offen
  | "ready" // Stream läuft, bereit zur Aufnahme
  | "recording" // nimmt auf
  | "recorded" // gültige Aufnahme liegt vor
  | "too-short" // Aufnahme verworfen (< minDurationMs)
  | "denied" // Berechtigung verweigert (FA-06)
  | "no-camera" // kein Kamerazugriff / kein Gerät
  | "unsupported" // Browser kann MediaRecorder nicht
  | "error";

export interface UseMediaRecorderOptions {
  maxDurationMs?: number;
  minDurationMs?: number;
  facingMode?: "user" | "environment";
}

export interface MediaRecorderController {
  status: RecorderStatus;
  stream: MediaStream | null;
  /** Verstrichene Zeit der laufenden Aufnahme in ms. */
  elapsedMs: number;
  /** Länge der zuletzt abgeschlossenen Aufnahme in ms. */
  durationMs: number;
  blob: Blob | null;
  previewUrl: string | null;
  maxDurationMs: number;
  minDurationMs: number;
  requestCamera: () => Promise<void>;
  start: () => void;
  stop: () => void;
  /** Aufnahme verwerfen, Kamera aber aktiv lassen (für „Neu aufnehmen"). */
  reset: () => void;
  /** Kamera vollständig freigeben (Tracks stoppen). */
  stopCamera: () => void;
}

const DEFAULT_MAX_MS = 15_000;
const DEFAULT_MIN_MS = 2_000;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find(
    (type) =>
      typeof MediaRecorder.isTypeSupported === "function" &&
      MediaRecorder.isTypeSupported(type),
  );
}

export function useMediaRecorder(
  options: UseMediaRecorderOptions = {},
): MediaRecorderController {
  const maxDurationMs = options.maxDurationMs ?? DEFAULT_MAX_MS;
  const minDurationMs = options.minDurationMs ?? DEFAULT_MIN_MS;
  const facingMode = options.facingMode ?? "environment";

  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTsRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  }, []);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const requestCamera = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true,
      });
      streamRef.current = media;
      setStream(media);
      setStatus("ready");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setStatus("denied");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setStatus("no-camera");
      } else {
        setStatus("error");
      }
    }
  }, [facingMode]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    clearTimers();
  }, [clearTimers]);

  const start = useCallback(() => {
    const media = streamRef.current;
    if (!media || status === "recording") return;

    revokePreview();
    setPreviewUrl(null);
    setBlob(null);
    setDurationMs(0);
    setElapsedMs(0);
    chunksRef.current = [];

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(
        media,
        mimeType ? { mimeType } : undefined,
      );
    } catch {
      setStatus("error");
      return;
    }
    recorderRef.current = recorder;

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      clearTimers();
      const recordedMs = performance.now() - startTsRef.current;
      setDurationMs(Math.round(recordedMs));
      setElapsedMs(0);

      // TU-03 Alternativablauf 2: zu kurze Aufnahme verwerfen.
      if (recordedMs < minDurationMs) {
        chunksRef.current = [];
        setStatus("too-short");
        return;
      }

      const type = recorder.mimeType || mimeType || "video/webm";
      const recordedBlob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      const url = URL.createObjectURL(recordedBlob);
      previewUrlRef.current = url;
      setBlob(recordedBlob);
      setPreviewUrl(url);
      setStatus("recorded");
    };

    startTsRef.current = performance.now();
    // Zeitscheibe sorgt für regelmäßige dataavailable-Events (robuster auf iOS).
    recorder.start(250);
    setStatus("recording");

    tickRef.current = setInterval(() => {
      setElapsedMs(performance.now() - startTsRef.current);
    }, 100);

    // Auto-Stop bei Erreichen der Maximaldauer.
    autoStopRef.current = setTimeout(stop, maxDurationMs);
  }, [status, maxDurationMs, minDurationMs, revokePreview, stop, clearTimers]);

  const reset = useCallback(() => {
    revokePreview();
    setPreviewUrl(null);
    setBlob(null);
    setDurationMs(0);
    setElapsedMs(0);
    chunksRef.current = [];
    setStatus(streamRef.current ? "ready" : "idle");
  }, [revokePreview]);

  const stopCamera = useCallback(() => {
    clearTimers();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        /* bereits gestoppt */
      }
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    revokePreview();
    setPreviewUrl(null);
    setBlob(null);
    setElapsedMs(0);
    setStatus("idle");
  }, [clearTimers, revokePreview]);

  // Aufräumen bei Unmount: Tracks stoppen, Timer & ObjectURL freigeben.
  useEffect(() => {
    return () => {
      clearTimers();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [clearTimers]);

  return {
    status,
    stream,
    elapsedMs,
    durationMs,
    blob,
    previewUrl,
    maxDurationMs,
    minDurationMs,
    requestCamera,
    start,
    stop,
    reset,
    stopCamera,
  };
}
