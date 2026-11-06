"use client";

// PLACEHOLDER (Phase 0) — Agent B OWNS this file and will replace it.
// Kept functional because it is safety-critical and trivial: leaves the site via
// location.replace (not in Back history) to protect a user whose screen may be watched.

export default function QuickExitButton() {
  function exit() {
    try {
      // Clear anything an agent may have stashed for the ephemeral session.
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    window.location.replace("https://weather.com");
  }

  return (
    <button
      type="button"
      onClick={exit}
      aria-label="Quick exit — leave this site immediately"
      className="rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-danger-contrast hover:bg-danger-hover"
    >
      Quick Exit
    </button>
  );
}
