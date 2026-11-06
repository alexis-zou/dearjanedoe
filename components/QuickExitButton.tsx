"use client";

/** Neutral site the user is sent to. `replace` keeps this app out of Back history. */
const EXIT_URL = "https://weather.com";

export function quickExit() {
  try {
    // Chat state is in-memory and dies with the page; also wipe any session
    // flags (e.g. disclaimer-seen) so nothing about this visit lingers.
    sessionStorage.clear();
  } catch {
    // Storage can throw in private modes — never block the exit on it.
  }
  window.location.replace(EXIT_URL);
}

export default function QuickExitButton() {
  return (
    <button
      type="button"
      onClick={quickExit}
      aria-label="Quick exit: leave this site immediately"
      title="Leave this site immediately"
      className="inline-flex min-h-11 items-center rounded-full bg-foreground px-4 py-2 font-semibold text-background hover:opacity-90"
    >
      Quick exit
    </button>
  );
}
