// Client-side chat helper (Phase 0 contract). Same-origin call — no CORS, no proxy.
import type { ChatRequest, ChatResponse, Message, School } from "./types";

/**
 * Send the conversation to the server route and return the assistant reply.
 * Throws on network / non-2xx so callers can show an error state.
 */
export async function chat(messages: Message[], school?: School): Promise<string> {
  const body: ChatRequest = { messages, school };

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
