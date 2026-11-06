"use client";

import { useState } from "react";
import Link from "next/link";
import { chat } from "@/lib/api";
import type { Message } from "@/lib/types";
import Composer from "./Composer";
import MessageList from "./MessageList";

const STARTER_QUESTIONS = [
  "What is Title IX?",
  "What are supportive measures?",
  "Can I have an advisor with me in a school process?",
  "What are my options after an assault?",
];

// /api/chat rejects longer requests, which would leave a long conversation stuck on errors.
const MAX_MESSAGES_SENT = 40;

/** The most recent messages the route will accept, starting on a user turn. */
function recentHistory(conversation: Message[]): Message[] {
  const recent = conversation.slice(-MAX_MESSAGES_SENT);
  return recent[0]?.role === "assistant" ? recent.slice(1) : recent;
}

/** The conversation lives only in this component's state, never in browser storage. */
export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function requestReply(conversation: Message[]) {
    setIsLoading(true);
    setHasError(false);
    try {
      const reply = await chat(recentHistory(conversation));
      setMessages([...conversation, { role: "assistant", content: reply }]);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSend(text: string) {
    if (isLoading) return;
    const conversation: Message[] = [...messages, { role: "user", content: text }];
    setMessages(conversation);
    void requestReply(conversation);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      {messages.length === 0 ? (
        <div className="p-4">
          <p>Ask a general question about your rights. You can stop or skip anything at any time.</p>
          <p className="mt-3 text-sm font-medium text-muted">Some places to start:</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {STARTER_QUESTIONS.map((question) => (
              <li key={question}>
                <button
                  type="button"
                  onClick={() => handleSend(question)}
                  className="min-h-11 rounded-full border border-primary px-4 py-2 text-left text-sm text-foreground hover:bg-primary-soft"
                >
                  {question}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <MessageList messages={messages} isLoading={isLoading} />
      )}

      {hasError && (
        // While the chat is down it can't point anyone to crisis support, so this message does.
        <div role="alert" className="mx-4 mb-4 rounded-lg border border-border bg-surface-muted p-4">
          <p className="font-medium">We couldn’t get a reply. Your question wasn’t answered.</p>
          <button
            type="button"
            onClick={() => void requestReply(messages)}
            className="mt-2 min-h-11 rounded-lg bg-primary px-4 py-2 font-medium text-primary-contrast hover:bg-primary-hover"
          >
            Try again
          </button>
          <p className="mt-3 text-sm">
            If you need someone to talk to now, you can call or text{" "}
            <a href="tel:988" className="font-medium underline">
              988
            </a>{" "}
            or see the{" "}
            <Link href="/crisis" className="font-medium underline">
              crisis support lines
            </Link>
            .
          </p>
        </div>
      )}

      <Composer onSend={handleSend} isSending={isLoading} />
    </div>
  );
}
