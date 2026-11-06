// Client-side chat helper (Phase 0 contract). Same-origin call — no CORS, no proxy.
import type { ChatRequest, ChatResponse, Message, School } from "./types";
import { redactOutgoing } from "./vault/egress.ts";
import { getAll } from "./vault/store.ts";

// The redacted form of each message already sent. Chat windows keep the original text and
// resend it as history, so this keeps it redacted after the vault is locked or changed.
const redactedForms = new WeakMap<Message, string>();

function redactMessages(messages: Message[]): Message[] {
  const values = getAll();
  return messages.map((message) => {
    const content = redactOutgoing(redactedForms.get(message) ?? message.content, values);
    redactedForms.set(message, content);
    return { role: message.role, content };
  });
}

/**
 * Send the conversation to the server route and return the assistant reply. Every message,
 * including resent history, has vault values replaced with tokens first.
 * Throws on network / non-2xx so callers can show an error state.
 */
export async function chat(messages: Message[], school?: School): Promise<string> {
  const body: ChatRequest = { messages: redactMessages(messages), school };

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Chat request failed (${res.status})`);
  }

  const data: ChatResponse = await res.json();
  return data.reply;
}
