// Shared contracts (Phase 0). All agents import from here; no agent edits this file.

export type Role = "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

export type School = "cornell" | "stanford" | "berkeley";

export const SCHOOLS: { id: School; name: string }[] = [
  { id: "cornell", name: "Cornell University" },
  { id: "stanford", name: "Stanford University" },
  { id: "berkeley", name: "UC Berkeley" },
];

/** Request body for POST /api/chat (client -> server). */
export interface ChatRequest {
  messages: Message[];
  school?: School;
}

/** Response body from POST /api/chat (server -> client). */
export interface ChatResponse {
  reply: string;
}

// ----- Data shapes consumed by Agents B & C (static data files) -----

export interface Hotline {
  name: string;
  /** How to reach them — drives the tel:/sms: anchor rendering. */
  kind: "call" | "text";
  /** E.164-ish phone for `tel:` or the short code for `sms:`. */
  contact: string;
  /** For text lines: the keyword to send (e.g. "HOME"). */
  smsBody?: string;
  description: string;
  available?: string; // e.g. "24/7"
}

export interface LegalAidOrg {
  name: string;
  url: string;
  description: string;
  phone?: string;
}

export interface ConsultationPrompt {
  category: string;
  questions: string[];
}
