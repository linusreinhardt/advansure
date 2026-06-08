import {
  Baby,
  Bath,
  BedDouble,
  Briefcase,
  DoorOpen,
  Home,
  Sofa,
  Utensils,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { RoomDamage, RoomType } from "@/lib/claim/types";
import { formatEur } from "@/lib/personas";
import { defaultRoomSize, estimateRoomAmount } from "@/lib/valuation/rates";
import { SeverityBadge } from "@/components/advansure/severity-badge";

const ROOM_ICONS: Record<RoomType, LucideIcon> = {
  wohnzimmer: Sofa,
  kueche: Utensils,
  schlafzimmer: BedDouble,
  bad: Bath,
  flur: DoorOpen,
  kinderzimmer: Baby,
  arbeitszimmer: Briefcase,
  keller: Warehouse,
  sonstiger: Home,
};

interface RoomResultCardProps {
  room: RoomDamage;
  /** Vorläufige Schadenshöhe mit anzeigen (Transparenz, vgl. Deck Schritt 5). */
  showEstimate?: boolean;
  className?: string;
}

export function RoomResultCard({ room, showEstimate = false, className }: RoomResultCardProps) {
  const Icon = ROOM_ICONS[room.roomType];
  const sqm = defaultRoomSize(room.roomType);
  const amount = estimateRoomAmount(room.roomType, room.severity);

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-border bg-card p-4",
        className,
      )}
    >
      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary">
        <Icon className="size-6 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold text-foreground">{room.roomLabel}</p>
          <SeverityBadge level={room.severity} />
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {room.damageType}
          {showEstimate && (
            <>
              {" · "}
              <span className="tabular-nums">{sqm} m²</span>
              {" · "}
              <span className="font-medium text-foreground">{formatEur(amount)}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
