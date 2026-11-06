import { Suspense } from "react";
import type { Metadata } from "next";
import CaseClock from "@/components/caseclock/CaseClock";

export const metadata: Metadata = {
  title: "Case Clock — Dear Jane Doe",
  description:
    "See your school's published Title IX timeline next to your own dates, and draft a polite email when things run long. General information, not legal advice.",
};

export default function TrackerPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="relative flex flex-col gap-2">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-0 -z-10 h-56 w-56 rounded-full bg-gradient-to-br from-accent/40 via-primary/30 to-transparent blur-3xl"
        />
        <p className="font-medium tracking-wide text-primary">Case Clock</p>
        <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          Your case, on one page
        </h1>
        <p className="max-w-2xl text-lg">
          Case Clock remembers your dates, counts the business days, and tells you when
          something is running past UC Berkeley&apos;s own timeframe. Dates only. Nothing is sent
          for you.
        </p>
      </header>

      {/* CaseClock reads ?demo=1, so it renders on the client inside this boundary. */}
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <CaseClock />
      </Suspense>
    </div>
  );
}
