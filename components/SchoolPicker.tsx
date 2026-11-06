"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Composer from "@/components/Composer";
import MessageList from "@/components/MessageList";
import { chat } from "@/lib/api";
import { SCHOOLS, type Message, type School } from "@/lib/types";

const STARTER_QUESTIONS = [
  "What can I do if I don't want to file a formal complaint?",
  "What supportive measures can I ask for?",
  "Who can I talk to confidentially?",
  "Can I bring an advisor to a hearing?",
];

// Matches /api/chat's MAX_MESSAGES so a long conversation doesn't get stuck on errors
// (same approach as Agent C's ChatWindow).
const MAX_MESSAGES_SENT = 40;

function recentHistory(conversation: Message[]): Message[] {
  const recent = conversation.slice(-MAX_MESSAGES_SENT);
  return recent[0]?.role === "assistant" ? recent.slice(1) : recent;
}

/**
 * School-scoped Q&A. Conversation lives only in this component's state; the parent
 * remounts it (via `key`) when the school changes, which clears it.
 * Reuses Agent C's MessageList + Composer so chat looks and behaves the same app-wide.
 */
function SchoolQA({ school, schoolName }: { school: School; schoolName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function requestReply(conversation: Message[]) {
    setIsLoading(true);
    setHasError(false);
    try {
      const reply = await chat(recentHistory(conversation), school);
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

  const headingId = `qa-heading-${school}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div>
        <h2 id={headingId} className="text-2xl font-semibold text-foreground">
          Ask about {schoolName}&apos;s process
        </h2>
        <p className="mt-1 text-muted">
          General information, not legal advice. Your messages are sent to an AI service to
          write a reply. Nothing is saved, and nothing is shared with your school. Switching
          schools or leaving the page clears this conversation.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        {messages.length === 0 ? (
          <div className="p-4">
            <p>Ask a general question about how things work at {schoolName}.</p>
            <p className="mt-3 text-sm font-medium text-muted">Some places to start:</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {STARTER_QUESTIONS.map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    onClick={() => handleSend(question)}
                    disabled={isLoading}
                    className="min-h-11 rounded-full border border-primary px-4 py-2 text-left text-sm text-foreground hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
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
          <div role="alert" className="mx-4 mb-4 rounded-lg border border-border bg-surface-muted p-4">
            <p className="font-medium">
              We couldn&apos;t get a reply right now. Your question wasn&apos;t answered.
            </p>
            <p className="mt-1 text-sm">The summary above is still here for you to read.</p>
            <button
              type="button"
              onClick={() => void requestReply(messages)}
              disabled={isLoading}
              className="mt-2 min-h-11 rounded-lg bg-primary px-4 py-2 font-medium text-primary-contrast hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
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
    </section>
  );
}

/**
 * School navigator: native radio group (arrow keys move + select, Tab leaves the
 * group), the selected school's pre-rendered policy panel, and a school-scoped Q&A.
 * `panels` are server-rendered PolicyView elements, so markdown never ships as JS.
 */
export default function SchoolPicker({ panels }: { panels: Record<School, ReactNode> }) {
  const [school, setSchool] = useState<School | null>(null);
  const schoolName = SCHOOLS.find((s) => s.id === school)?.name ?? "";

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-2 text-lg font-semibold text-foreground">Choose a school</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {SCHOOLS.map((s) => (
            <label
              key={s.id}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-foreground transition-colors hover:border-primary has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
            >
              <input
                type="radio"
                name="school"
                value={s.id}
                checked={school === s.id}
                onChange={() => setSchool(s.id)}
                className="size-5 shrink-0 accent-primary focus-visible:outline-none"
              />
              <span className="font-medium">{s.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {!school && (
        <p className="text-muted">
          Pick a school to see a plain-language summary of its Title IX options and
          supports.
        </p>
      )}

      {/* All panels are server-rendered; only the selected one is shown. */}
      {SCHOOLS.map((s) => (
        <div key={s.id} hidden={school !== s.id}>
          {panels[s.id]}
        </div>
      ))}

      {/* key remounts the Q&A, clearing the conversation whenever the school changes. */}
      {school && <SchoolQA key={school} school={school} schoolName={schoolName} />}
    </div>
  );
}
