"use client";

import { Camera, Check, PenLine, Plus } from "lucide-react";

import type { ChatMessage } from "@/lib/claim/types";
import type { AveryAction, AveryActionId } from "@/lib/avery/engine";
import { Button } from "@/components/ui/button";
import { MessageList } from "@/components/avery/message-list";
import { QuickReplies } from "@/components/avery/quick-replies";
import { Composer } from "@/components/avery/composer";

const ACTION_ICON = {
  camera: Camera,
  check: Check,
  plus: Plus,
  text: PenLine,
} as const;

interface AveryChatProps {
  messages: ChatMessage[];
  isTyping: boolean;
  quickReplies?: string[];
  actions?: AveryAction[];
  onSend: (text: string) => void;
  onAction: (id: AveryActionId) => void;
  inputDisabled?: boolean;
}

export function AveryChat({
  messages,
  isTyping,
  quickReplies = [],
  actions = [],
  onSend,
  onAction,
  inputDisabled = false,
}: AveryChatProps) {
  const showQuickReplies = !isTyping && quickReplies.length > 0;
  const showActions = !isTyping && actions.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageList messages={messages} isTyping={isTyping} />

      {showActions && (
        <div className="flex flex-col gap-2 px-4 pb-2">
          {actions.map((action) => {
            const Icon = action.icon ? ACTION_ICON[action.icon] : undefined;
            return (
              <Button
                key={action.id}
                variant={action.variant ?? "default"}
                size="lg"
                className="w-full"
                onClick={() => onAction(action.id as AveryActionId)}
              >
                {Icon && <Icon />}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}

      {showQuickReplies && (
        <QuickReplies options={quickReplies} onSelect={onSend} disabled={inputDisabled} />
      )}

      <Composer onSend={onSend} disabled={inputDisabled} />
    </div>
  );
}
