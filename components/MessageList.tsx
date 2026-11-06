"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { Message } from "@/lib/types";
import { containsVaultValue } from "@/lib/vault/egress";
import { fillForDisplay } from "@/lib/vault/placeholders";
import { getAll, getVersion, subscribe } from "@/lib/vault/store";

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
};

/** Shows the model's **bold** as bold. Everything else stays plain, escaped text. */
function renderBold(content: string) {
  return content
    .split(/\*\*(.+?)\*\*/g)
    .map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part));
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Re-render when vault values change, so filled-in text stays current.
  useSyncExternalStore(subscribe, getVersion, () => 0);
  const vaultValues = getAll();

  // Scroll only this panel, so the rest of the page stays where the reader left it.
  useEffect(() => {
    const container = containerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, isLoading]);

  return (
    <div
      ref={containerRef}
      role="log"
      aria-live="polite"
      aria-label="Conversation"
      tabIndex={0}
      className="max-h-[28rem] min-h-40 space-y-4 overflow-y-auto p-4"
    >
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        return (
          <div key={index} className={isUser ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 ${
                isUser ? "bg-primary text-primary-contrast" : "bg-surface-muted text-foreground"
              }`}
            >
              <span className="sr-only">{isUser ? "You said: " : "The assistant said: "}</span>
              {isUser
                ? message.content
                : renderBold(fillForDisplay(message.content, vaultValues))}
              {isUser && containsVaultValue(message.content, vaultValues) && (
                <p className="mt-2 border-t border-current/30 pt-2 text-sm">
                  We kept your details on this device and sent placeholders instead.
                </p>
              )}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex justify-start">
          <p className="rounded-2xl bg-surface-muted px-4 py-3">Writing a reply…</p>
        </div>
      )}
    </div>
  );
}
