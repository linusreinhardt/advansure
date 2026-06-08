import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/claim/types";
import { AveryMark } from "@/components/avery/avery-mark";

interface MessageBubbleProps {
  message: ChatMessage;
  /** Avatar nur bei der ersten Avery-Nachricht einer Gruppe zeigen. */
  showAvatar: boolean;
}

export function MessageBubble({ message, showAvatar }: MessageBubbleProps) {
  // Dezenter, zentrierter Systemhinweis (z. B. „Foto-Walk abgebrochen").
  if (message.kind === "system") {
    return (
      <div className="my-1 flex justify-center">
        <span className="rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
          {message.text}
        </span>
      </div>
    );
  }

  // Grüner Bestätigungs-Chip: „✓ Leitungswasserschaden erkannt".
  if (message.kind === "confirmation") {
    return (
      <div className="flex items-center gap-2 pl-9">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success">
          <CheckCircle2 className="size-4" />
          {message.text}
        </span>
      </div>
    );
  }

  const isAvery = message.role === "avery";

  return (
    <div
      className={cn(
        "flex items-end gap-2 animate-message-in",
        isAvery ? "justify-start" : "justify-end",
      )}
    >
      {isAvery &&
        (showAvatar ? (
          <AveryMark size="sm" />
        ) : (
          // Platzhalter, damit gruppierte Blasen bündig untereinander stehen.
          <span className="w-7 shrink-0" aria-hidden />
        ))}

      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap break-words px-4 py-2.5 text-[15px] leading-relaxed",
          isAvery
            ? "rounded-2xl rounded-tl-sm bg-secondary text-foreground"
            : "rounded-2xl rounded-tr-sm bg-foreground text-background",
        )}
      >
        {message.text}
      </div>
    </div>
  );
}
