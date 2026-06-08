import { Camera, Send } from "lucide-react";

import type { ClaimDraft } from "@/lib/claim/types";
import { formatEur } from "@/lib/personas";
import { estimateRoomAmount } from "@/lib/valuation/rates";
import { Button } from "@/components/ui/button";
import { RoomResultCard } from "@/components/walk/room-result-card";

interface ClaimSummaryProps {
  draft: ClaimDraft;
  onSubmit: () => void;
  onAddRoom: () => void;
  onBack: () => void;
}

/**
 * Prüf-Zusammenfassung vor dem Absenden (vgl. Deck Schritt 6).
 * Hinweis: Die endgültige Bewertung (TU-05) und Persistenz (TU-06) sind eigene
 * Arbeitspakete – die Summe ist hier eine transparente, vorläufige Schätzung.
 */
export function ClaimSummary({ draft, onSubmit, onAddRoom, onBack }: ClaimSummaryProps) {
  const total = draft.rooms.reduce(
    (sum, room) => sum + estimateRoomAmount(room.damage.roomType, room.damage.severity),
    0,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-5 py-6">
        <div>
          <h1 className="font-display text-2xl font-medium">Zusammenfassung</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {draft.claimTypeLabel ?? "Schaden"}
            {draft.rooms.length > 0 &&
              ` · ${draft.rooms.length} ${draft.rooms.length === 1 ? "Raum" : "Räume"} erfasst`}
          </p>
        </div>

        {draft.rooms.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Noch kein Raum erfasst. Nimm zuerst einen Raum auf.
          </p>
        ) : (
          <div className="space-y-3">
            {draft.rooms.map((room) => (
              <RoomResultCard key={room.id} room={room.damage} showEstimate />
            ))}
          </div>
        )}

        {draft.rooms.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Voraussichtliche Schadenshöhe</p>
            <p className="mt-1 font-display text-3xl font-medium tabular-nums">
              {formatEur(total)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Vorläufige Schätzung nach Pauschalmethode (Wohnfläche × Pauschalsatz je
              Schadensgrad). Die verbindliche Bewertung erfolgt durch die Versicherung.
            </p>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={onAddRoom}>
          <Camera />
          Weiteren Raum aufnehmen
        </Button>
      </div>

      <div className="space-y-2 border-t border-border px-5 py-4">
        <Button
          size="lg"
          className="w-full"
          disabled={draft.rooms.length === 0}
          onClick={onSubmit}
        >
          <Send />
          Schaden absenden
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="w-full py-1 text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Zurück zum Chat
        </button>
      </div>
    </div>
  );
}
