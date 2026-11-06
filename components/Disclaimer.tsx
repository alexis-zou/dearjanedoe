"use client";

import { useEffect, useRef } from "react";

/**
 * Remembered in sessionStorage, NOT localStorage: a persistent flag would leave a
 * trace on a shared device that this site was visited. Quick-exit clears it too.
 */
const SEEN_KEY = "djd-disclaimer-seen";

export default function Disclaimer() {
  const ref = useRef<HTMLDialogElement>(null);

  // Read storage after mount (no hydration mismatch) and open imperatively.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Storage unavailable — just show it.
    }
    if (!seen && ref.current && !ref.current.open) ref.current.showModal();
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore
    }
    if (ref.current?.open) ref.current.close();
  }

  return (
    <dialog
      ref={ref}
      // Esc counts as acknowledging — don't trap a user who wants out.
      onClose={dismiss}
      aria-labelledby="disclaimer-title"
      aria-describedby="disclaimer-body"
      className="m-auto w-[min(36rem,calc(100%-2rem))] rounded-[var(--radius)] bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <div className="p-6 sm:p-8">
        <h2 id="disclaimer-title" className="text-2xl font-bold">
          Before you start
        </h2>
        <ul
          id="disclaimer-body"
          className="mt-4 list-disc space-y-3 pl-5 leading-relaxed text-muted"
        >
          <li>
            This app gives <strong className="text-foreground">general information, not legal advice</strong>.
            For advice about your situation, talk with a lawyer or advocate.
          </li>
          <li>
            <strong className="text-foreground">This app does not file any report</strong> or contact
            your school, the police, or anyone else.
          </li>
          <li>
            We don&apos;t require an account and we don&apos;t store your conversation.
            Messages you type in the chat are sent to an AI service to generate answers,
            so please don&apos;t include names or other identifying details.
          </li>
          <li>
            Use <strong className="text-foreground">Quick exit</strong> at any time to leave this
            site immediately. Use <strong className="text-foreground">Get help now</strong> to
            reach a crisis line.
          </li>
        </ul>
        <button
          type="button"
          onClick={dismiss}
          autoFocus
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-5 py-2 font-semibold text-primary-contrast hover:bg-primary-hover sm:w-auto"
        >
          I understand, continue
        </button>
      </div>
    </dialog>
  );
}
