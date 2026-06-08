"use client";

import { useEffect, useRef } from "react";

import type { ChatMessage } from "@/lib/claim/types";
import { MessageBubble } from "@/components/avery/message-bubble";
import { TypingDots } from "@/components/avery/typing-dots";

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

export function MessageList({ messages, isTyping }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Bei neuer Nachricht oder beginnendem Tippen ans Ende scrollen.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  return (
    <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-5">
      {messages.map((message, index) => {
        const prev = messages[index - 1];
        const showAvatar =
          message.role === "avery" && (!prev || prev.role !== "avery");
        return (
          <MessageBubble
            key={message.id}
            message={message}
            showAvatar={showAvatar}
          />
        );
      })}
      {isTyping && <TypingDots />}
      <div ref={endRef} />
    </div>
  );
}
