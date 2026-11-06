import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import PolicyView, { Markdown, parsePolicyDoc, type PolicyDoc } from "@/components/PolicyView";
import SchoolPicker from "@/components/SchoolPicker";
import { SCHOOLS, type School } from "@/lib/types";

export const metadata: Metadata = {
  title: "University Navigator — Know Your Rights",
  description:
    "Plain-language summaries of Title IX options at Cornell, Stanford, and UC Berkeley, plus the federal baseline. General information, not legal advice.",
};

// Corpus files (owned by Agent A) are read once at module scope — they don't vary by
// request, so the page prerenders statically under cacheComponents. Literal paths keep
// file tracing narrow (same approach as app/api/chat/route.ts).
function load(read: () => string): PolicyDoc | null {
  try {
    const raw = read();
    return raw.trim() ? parsePolicyDoc(raw) : null;
  } catch {
    return null; // missing file -> friendly "not available" state in PolicyView
  }
}

const DOCS: Record<School, PolicyDoc | null> = {
  cornell: load(() => readFileSync(join(process.cwd(), "content/corpus/cornell.md"), "utf8")),
  stanford: load(() => readFileSync(join(process.cwd(), "content/corpus/stanford.md"), "utf8")),
  berkeley: load(() => readFileSync(join(process.cwd(), "content/corpus/berkeley.md"), "utf8")),
};
const FEDERAL = load(() => readFileSync(join(process.cwd(), "content/corpus/title-ix-federal.md"), "utf8"));

export default function UniversityPage() {
  const panels = Object.fromEntries(
    SCHOOLS.map((s) => [s.id, <PolicyView key={s.id} school={s.id} schoolName={s.name} doc={DOCS[s.id]} />]),
  ) as Record<School, ReactNode>;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          University Navigator
        </h1>
        <p className="max-w-2xl text-lg text-foreground">
          If something happened while you were a student, your school has options and
          supports available under Title IX. Read how it works at your own pace. You
          don&apos;t have to decide anything today, and you don&apos;t have to make a
          report to get support.
        </p>
        <p className="max-w-2xl rounded-xl border border-border bg-surface-muted p-4 text-foreground">
          <strong>This page does not file a report with your school</strong> or contact
          anyone. It&apos;s general information, not legal advice.
        </p>
      </header>

      <SchoolPicker panels={panels} />

      <section
        aria-labelledby="other-schools-heading"
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm"
      >
        <h2 id="other-schools-heading" className="text-2xl font-semibold text-foreground">
          At a different school?
        </h2>
        <p>
          School-specific summaries here cover only Cornell, Stanford, and UC Berkeley.
          Every school that receives federal funding follows the same federal Title IX
          baseline and must have a Title IX Coordinator whose contact information is
          published. To find yours, search for{" "}
          <q className="font-medium">[your school name] Title IX office</q> or look on
          your school&apos;s website. You can contact them just to ask questions; asking is
          not the same as filing a report.
        </p>
        {FEDERAL ? (
          <details className="rounded-xl border border-border bg-surface-muted p-4">
            <summary className="min-h-11 cursor-pointer py-2 font-medium text-primary">
              Read the federal Title IX baseline
              {FEDERAL.asOf ? ` (as of ${FEDERAL.asOf})` : ""}
            </summary>
            <div className="mt-3 flex flex-col gap-4">
              {FEDERAL.intro && <p className="border-l-4 border-accent pl-4">{FEDERAL.intro}</p>}
              {FEDERAL.scope && <Markdown source={FEDERAL.scope} />}
              <Markdown source={FEDERAL.body} />
              {FEDERAL.sources && (
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <h3 className="font-semibold text-foreground">Where this summary comes from</h3>
                  <Markdown source={FEDERAL.sources} />
                </div>
              )}
            </div>
          </details>
        ) : (
          <p className="text-muted">A summary of the federal baseline isn&apos;t available right now.</p>
        )}
      </section>
    </div>
  );
}
