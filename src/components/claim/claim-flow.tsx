"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, RotateCcw } from "lucide-react";

import {
  DAMAGE_TYPE_BY_CLAIM,
  ROOM_LABELS,
  type ChatMessage,
  type ClaimType,
  type RoomCapture,
  type RoomDamage,
  type RoomType,
  type SeverityLevel,
} from "@/lib/claim/types";
import {
  acknowledgeRoom,
  acknowledgeWalkCancelled,
  startConversation,
  type AveryAction,
  type AveryActionId,
  type AveryMessageDraft,
  type AveryReply,
  type AveryState,
} from "@/lib/avery/engine";
import { askAvery } from "@/lib/avery/avery-client";
import { analyzeCapture } from "@/lib/walk/analyze";
import { generateCaseNumber } from "@/lib/claim/case-number";
import { getPersona, type Persona } from "@/lib/personas";

import { AveryMark } from "@/components/avery/avery-mark";
import { AveryChat } from "@/components/avery/avery-chat";
import { Button } from "@/components/ui/button";
import { VideoCapture, type CaptureResult } from "@/components/walk/video-capture";
import { AnalyzingOverlay } from "@/components/walk/analyzing-overlay";
import { RoomResultCard } from "@/components/walk/room-result-card";
import { ClaimSummary } from "@/components/claim/claim-summary";
import { ClaimConfirmation } from "@/components/claim/claim-confirmation";

type Phase =
  | "chat"
  | "walk"
  | "analyzing"
  | "result"
  | "summary"
  | "confirmation"
  | "text-room" // FA-06 Text-Fallback: Raum erfragen
  | "text-severity"; // FA-06 Text-Fallback: Schadensgrad erfragen

interface PersistedSession {
  messages: ChatMessage[];
  averyState: AveryState;
  quickReplies: string[];
  actions: AveryAction[];
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function instructionForRoom(index: number): string {
  return index === 0
    ? "Filme zuerst den Raum mit dem größten Schaden. Schwenk langsam und gleichmäßig."
    : "Schwenk langsam durch den nächsten betroffenen Raum.";
}

const ROOM_BY_LABEL: { needle: string; type: RoomType }[] = [
  { needle: "wohnzimmer", type: "wohnzimmer" },
  { needle: "küche", type: "kueche" },
  { needle: "kueche", type: "kueche" },
  { needle: "schlafzimmer", type: "schlafzimmer" },
  { needle: "kinderzimmer", type: "kinderzimmer" },
  { needle: "arbeitszimmer", type: "arbeitszimmer" },
  { needle: "bad", type: "bad" },
  { needle: "flur", type: "flur" },
  { needle: "keller", type: "keller" },
];

function roomTypeFromLabel(label: string): RoomType {
  const text = label.toLowerCase();
  return ROOM_BY_LABEL.find((entry) => text.includes(entry.needle))?.type ?? "sonstiger";
}

function severityFromLabel(label: string): SeverityLevel {
  const text = label.toLowerCase();
  if (text.includes("total")) return "total";
  if (text.includes("schwer")) return "schwer";
  if (text.includes("leicht")) return "leicht";
  return "mittel";
}

interface ClaimFlowProps {
  persona?: Persona;
}

export function ClaimFlow({ persona = getPersona() }: ClaimFlowProps) {
  const router = useRouter();
  const storageKey = `advansure:claim:${persona.id}`;

  const [hydrated, setHydrated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [averyState, setAveryState] = useState<AveryState>({
    step: "awaiting_description",
    draft: { claimType: null, claimTypeLabel: null, cause: null, rooms: [] },
  });
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [actions, setActions] = useState<AveryAction[]>([]);

  const [phase, setPhase] = useState<Phase>("chat");
  const [instruction, setInstruction] = useState(instructionForRoom(0));
  const [roomIteration, setRoomIteration] = useState(0);
  const [lastDuration, setLastDuration] = useState(0);
  const [pendingRoom, setPendingRoom] = useState<RoomDamage | null>(null);
  const [textRoom, setTextRoom] = useState<RoomType | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);

  // Aufgenommene Clips – im PoC nur referenziert; hier würde der Upload nach
  // Supabase Storage andocken (TU-03), bevor die Analyse läuft.
  const capturedBlobs = useRef<Blob[]>([]);
  // Verhindert doppelte Initialisierung (z. B. React StrictMode im Dev).
  const initRef = useRef(false);

  const appendDrafts = useCallback((drafts: AveryMessageDraft[]) => {
    const now = Date.now();
    setMessages((prev) => [
      ...prev,
      ...drafts.map((draft, i) => ({
        ...draft,
        id: createId(),
        createdAt: now + i,
      })),
    ]);
  }, []);

  /** Spielt eine Avery-Antwort ab: Tippen → Nachrichten gestaffelt → Quick-Replies/Aktionen. */
  const deliver = useCallback(
    async (input: AveryReply | Promise<AveryReply>, thinkMs = 600) => {
      setIsTyping(true);
      setQuickReplies([]);
      setActions([]);
      if (thinkMs > 0) await delay(thinkMs);
      const reply = await Promise.resolve(input);
      setIsTyping(false);
      for (let i = 0; i < reply.messages.length; i += 1) {
        appendDrafts([reply.messages[i]]);
        if (i < reply.messages.length - 1) await delay(420);
      }
      setAveryState(reply.state);
      setQuickReplies(reply.quickReplies ?? []);
      setActions(reply.actions ?? []);
    },
    [appendDrafts],
  );

  /** Einzelne, scriptbasierte Avery-Nachricht (Text-Fallback ohne Engine). */
  const say = useCallback(
    async (text: string, replies: string[] = []) => {
      setIsTyping(true);
      setQuickReplies([]);
      setActions([]);
      await delay(600);
      setIsTyping(false);
      appendDrafts([{ role: "avery", text, kind: "text" }]);
      setQuickReplies(replies);
    },
    [appendDrafts],
  );

  // ---- Session laden / starten (FA-01/FA-02 Persistenz) ----
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const raw =
      typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    if (raw) {
      try {
        const data = JSON.parse(raw) as PersistedSession;
        setMessages(data.messages ?? []);
        setAveryState(data.averyState);
        setQuickReplies(data.quickReplies ?? []);
        setActions(data.actions ?? []);
        setHydrated(true);
        return;
      } catch {
        /* defekter Eintrag → frischer Start */
      }
    }
    setHydrated(true);
    void deliver(startConversation(persona), 500);
    // nur beim Mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Session persistieren ----
  useEffect(() => {
    if (!hydrated) return;
    const data: PersistedSession = { messages, averyState, quickReplies, actions };
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [hydrated, messages, averyState, quickReplies, actions, storageKey]);

  // -------------------------------------------------------------------------
  // Chat-Eingaben
  // -------------------------------------------------------------------------

  const handleSend = useCallback(
    async (text: string) => {
      appendDrafts([{ role: "user", text, kind: "text" }]);

      // FA-06 Text-Fallback: Raum wählen
      if (phase === "text-room") {
        setTextRoom(roomTypeFromLabel(text));
        setPhase("text-severity");
        await say("Verstanden. Wie schwer ist der Schaden dort etwa?", [
          "Leicht",
          "Mittel",
          "Schwer",
          "Totalschaden",
        ]);
        return;
      }

      // FA-06 Text-Fallback: Schadensgrad wählen → Raum übernehmen
      if (phase === "text-severity") {
        const type = textRoom ?? "sonstiger";
        const claimType: ClaimType = averyState.draft.claimType ?? "leitungswasser";
        const room: RoomDamage = {
          roomType: type,
          roomLabel: ROOM_LABELS[type],
          severity: severityFromLabel(text),
          damageType: DAMAGE_TYPE_BY_CLAIM[claimType],
        };
        commitRoom(room, 0, 0);
        setTextRoom(null);
        setPhase("chat");
        return;
      }

      // Normaler Dialog – askAvery übernimmt KI-Aufruf/Fallback inkl. Denkzeit.
      await deliver(askAvery(averyState, text, messages), 0);
    },
    // commitRoom unten via useCallback referenziert
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appendDrafts, deliver, say, phase, textRoom, averyState, messages],
  );

  const handleAction = useCallback(
    (id: AveryActionId) => {
      switch (id) {
        case "start_walk":
        case "continue_walk":
          setInstruction(instructionForRoom(averyState.draft.rooms.length));
          setRoomIteration(0);
          setPhase("walk");
          break;
        case "finish":
          setPhase("summary");
          break;
        case "text_fallback":
          void beginTextFallback();
          break;
      }
    },
    // beginTextFallback below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [averyState],
  );

  // -------------------------------------------------------------------------
  // Foto-Walk
  // -------------------------------------------------------------------------

  const commitRoom = useCallback(
    (room: RoomDamage, iterations: number, durationMs: number) => {
      const capture: RoomCapture = { id: createId(), damage: room, iterations, durationMs };
      const nextState: AveryState = {
        ...averyState,
        draft: { ...averyState.draft, rooms: [...averyState.draft.rooms, capture] },
      };
      setRoomIteration(0);
      void deliver(acknowledgeRoom(nextState, room));
    },
    [averyState, deliver],
  );

  const handleCaptured = useCallback(
    async ({ blob, durationMs }: CaptureResult) => {
      capturedBlobs.current.push(blob); // TU-03: hier würde der Storage-Upload erfolgen
      setLastDuration(durationMs);
      setPhase("analyzing");

      const iteration = roomIteration + 1;
      setRoomIteration(iteration);

      const assessment = await analyzeCapture(
        {
          claimType: averyState.draft.claimType ?? "leitungswasser",
          roomIndex: averyState.draft.rooms.length,
          iteration,
          durationMs,
          capturedRoomLabels: averyState.draft.rooms.map((r) => r.damage.roomLabel),
        },
        blob,
      );

      // FA-04: Dokumentation reicht nicht → gezielte Folgeaufforderung, neue Iteration.
      if (!assessment.satisfied || !assessment.damage_assessment) {
        appendDrafts([{ role: "avery", text: assessment.user_message, kind: "text" }]);
        setInstruction(assessment.next_request ?? instruction);
        setPhase("walk");
        return;
      }

      setPendingRoom(assessment.damage_assessment);
      setPhase("result");
    },
    [appendDrafts, averyState, instruction, roomIteration],
  );

  const handleResultConfirm = useCallback(() => {
    if (!pendingRoom) return;
    commitRoom(pendingRoom, roomIteration, lastDuration);
    setPendingRoom(null);
    setPhase("chat");
  }, [commitRoom, lastDuration, pendingRoom, roomIteration]);

  const handleResultRetake = useCallback(() => {
    setPendingRoom(null);
    setPhase("walk");
  }, []);

  const handleCancelWalk = useCallback(() => {
    setRoomIteration(0);
    setPhase("chat");
    void deliver(acknowledgeWalkCancelled(averyState));
  }, [averyState, deliver]);

  const beginTextFallback = useCallback(async () => {
    setPhase("text-room");
    await say(
      "Kein Problem, dann machen wir das im Chat. Welcher Raum ist betroffen?",
      ["Wohnzimmer", "Küche", "Bad", "Schlafzimmer", "Flur"],
    );
  }, [say]);

  // -------------------------------------------------------------------------
  // Abschluss & Steuerung
  // -------------------------------------------------------------------------

  const handleSubmit = useCallback(() => {
    setCaseNumber(generateCaseNumber());
    setPhase("confirmation");
  }, []);

  const resetSession = useCallback(() => {
    window.localStorage.removeItem(storageKey);
    capturedBlobs.current = [];
    setMessages([]);
    setQuickReplies([]);
    setActions([]);
    setPendingRoom(null);
    setCaseNumber(null);
    setRoomIteration(0);
    setPhase("chat");
    setAveryState({
      step: "awaiting_description",
      draft: { claimType: null, claimTypeLabel: null, cause: null, rooms: [] },
    });
    void deliver(startConversation(persona), 300);
  }, [deliver, persona, storageKey]);

  const goHome = useCallback(() => router.push("/"), [router]);

  const chatInteractive =
    phase === "chat" || phase === "text-room" || phase === "text-severity";

  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-background safe-area-inset">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button
            type="button"
            aria-label="Zurück zum Start"
            onClick={goHome}
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="size-5" />
          </button>
          <AveryMark size="sm" active={isTyping} />
          <div className="flex-1">
            <p className="text-sm font-semibold leading-none">Avery</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" />
              {isTyping ? "schreibt…" : `Online · hilft ${persona.firstName}`}
            </p>
          </div>
          <button
            type="button"
            aria-label="Meldung neu starten"
            onClick={resetSession}
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <RotateCcw className="size-[18px]" />
          </button>
        </header>

        {hydrated ? (
          <AveryChat
            messages={messages}
            isTyping={isTyping}
            quickReplies={quickReplies}
            actions={actions}
            onSend={handleSend}
            onAction={handleAction}
            inputDisabled={isTyping || !chatInteractive}
          />
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {phase === "walk" && (
        <VideoCapture
          instruction={instruction}
          roomNumber={averyState.draft.rooms.length + 1}
          onCaptured={handleCaptured}
          onCancel={handleCancelWalk}
          onTextFallback={() => {
            setPhase("chat");
            void beginTextFallback();
          }}
        />
      )}

      {phase === "analyzing" && <AnalyzingOverlay />}

      {phase === "result" && pendingRoom && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background safe-area-inset">
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <AveryMark size="sm" />
            <div>
              <p className="text-sm font-semibold leading-none">Schaden erkannt</p>
              <p className="mt-1 text-xs text-muted-foreground">Bitte kurz bestätigen</p>
            </div>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
            <p className="text-sm text-muted-foreground">
              Das habe ich in diesem Raum erkannt. Stimmt das so?
            </p>
            <RoomResultCard room={pendingRoom} showEstimate />
            <p className="text-xs text-muted-foreground">
              Schadensgrad und vorläufige Höhe basieren auf der KI-Einschätzung und der
              Pauschalmethode. Du kannst die Aufnahme bei Bedarf wiederholen.
            </p>
          </div>
          <div className="space-y-2 border-t border-border px-5 py-4">
            <Button size="lg" className="w-full" onClick={handleResultConfirm}>
              Übernehmen
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={handleResultRetake}
            >
              Neu aufnehmen
            </Button>
          </div>
        </div>
      )}

      {phase === "summary" && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background safe-area-inset">
          <ClaimSummary
            draft={averyState.draft}
            onSubmit={handleSubmit}
            onAddRoom={() => {
              setInstruction(instructionForRoom(averyState.draft.rooms.length));
              setRoomIteration(0);
              setPhase("walk");
            }}
            onBack={() => setPhase("chat")}
          />
        </div>
      )}

      {phase === "confirmation" && caseNumber && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background safe-area-inset">
          <ClaimConfirmation
            caseNumber={caseNumber}
            onDone={() => {
              resetSession();
              goHome();
            }}
          />
        </div>
      )}
    </>
  );
}
