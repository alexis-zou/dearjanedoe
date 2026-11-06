"use client";

import Link from "next/link";

// PLACEHOLDER (Phase 0) — Agent B OWNS this file and will replace it with the real
// "Get Help Now" control that opens the CrisisSheet modal (988 / 741741 / RAINN).
// For now it routes to the Crisis page so the scaffold compiles and the escape path works.

export default function GetHelpNowButton() {
  return (
    <Link
      href="/crisis"
      className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
    >
      Get Help Now
    </Link>
  );
}
