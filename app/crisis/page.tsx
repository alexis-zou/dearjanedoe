import type { Metadata } from "next";
import ResourceCard from "@/components/ResourceCard";
import { callLines, textLines } from "@/data/hotlines";

export const metadata: Metadata = {
  title: "Crisis Support — Know Your Rights",
};

// Note: the root layout already provides <main id="main"> and page padding.
export default function CrisisPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Crisis support</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">
        Whatever happened, you deserve support. These lines are free and confidential,
        and you can reach out whenever you&apos;re ready. You don&apos;t have to decide
        anything else to talk to someone.
      </p>

      <div
        role="note"
        className="mt-6 rounded-[var(--radius)] border border-danger/40 bg-danger/10 p-4 text-foreground"
      >
        If you are in immediate danger, call{" "}
        <a href="tel:911" className="font-semibold text-danger underline">
          911
        </a>
        .
      </div>

      <section aria-labelledby="text-lines" className="mt-10">
        <h2 id="text-lines" className="text-2xl font-semibold text-foreground">
          Text lines
        </h2>
        <p className="mt-1 text-muted">
          If talking out loud doesn&apos;t feel safe or comfortable, you can text.
        </p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {textLines.map((h) => (
            <li key={h.id}>
              <ResourceCard hotline={h} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="call-lines" className="mt-10">
        <h2 id="call-lines" className="text-2xl font-semibold text-foreground">
          Call lines
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {callLines.map((h) => (
            <li key={h.id}>
              <ResourceCard hotline={h} />
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-sm text-muted">
        RAINN also offers a confidential online chat at{" "}
        <a
          href="https://rainn.org/help-and-healing/hotline/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          rainn.org
          <span className="sr-only"> (opens in new tab)</span>
        </a>
        .
      </p>
    </div>
  );
}
