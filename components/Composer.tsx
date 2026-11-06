"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

type ComposerProps = {
  onSend: (text: string) => void;
  isSending: boolean;
};

export default function Composer({ onSend, isSending }: ComposerProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaId = useId();
  const hintId = useId();

  const canSend = text.trim().length > 0 && !isSending;

  function send() {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
    // The send button is disabled in flight, which would otherwise drop keyboard focus.
    textareaRef.current?.focus();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    send();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // isComposing: Enter is confirming IME input here, not sending.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border p-4">
      <label htmlFor={textareaId} className="block font-medium">
        Your question
      </label>
      <p id={hintId} className="mt-1 text-sm text-muted">
        Please leave out names and other identifying details. Press Enter to send, or Shift+Enter
        for a new line.
      </p>
      <div className="mt-2 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          id={textareaId}
          aria-describedby={hintId}
          rows={2}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-12 w-full resize-y rounded-lg border border-muted bg-surface px-3 py-2 text-base text-foreground"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="min-h-12 shrink-0 rounded-lg bg-primary px-5 py-2 font-medium text-primary-contrast hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted"
        >
          {isSending ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
