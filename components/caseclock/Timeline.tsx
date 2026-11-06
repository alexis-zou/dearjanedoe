import { addBusinessDays, formatDate } from "@/lib/caseclock/businessDays";
import type { StageResult } from "@/lib/caseclock/engine";
import type { CaseClockState, SchoolTimeline, StageStatus } from "@/lib/caseclock/types";

const CHIP_STYLE: Record<StageStatus, string> = {
  "on-track": "bg-primary-soft",
  "in-window": "bg-accent-soft",
  extended: "bg-surface-muted",
  "past-window": "bg-danger/15 ring-1 ring-danger/40",
  "update-available": "bg-danger/15 ring-1 ring-danger/40",
  "deadline-soon": "bg-danger/15 ring-1 ring-danger/40",
};

function chipLabel({ rule, result }: StageResult): string {
  switch (result.status) {
    case "on-track":
      if (rule.kind === "recurring") return "No update due yet";
      if (rule.kind === "user-deadline") return "Window open";
      return "Before the usual window";
    case "in-window":
      return "In the usual window";
    case "past-window":
      return "Past the usual timeframe";
    case "extended":
      return "Extended, with notice";
    case "update-available":
      return "Status update available";
    case "deadline-soon":
      return (result.remaining ?? 0) < 0 ? "Window may have closed" : "Deadline soon";
  }
}

export function StatusChip({ stage }: { stage: StageResult }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-foreground ${CHIP_STYLE[stage.result.status]}`}
    >
      {chipLabel(stage)}
    </span>
  );
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** One line on where the stage stands, in plain numbers. */
function detail({ rule, from, result }: StageResult): string {
  if (rule.kind === "window") {
    const opens = addBusinessDays(from, rule.minDays ?? 0);
    const closes = addBusinessDays(from, rule.maxDays ?? 0);
    return `Business day ${result.elapsed}. The usual window is ${formatDate(opens)} to ${formatDate(closes)} (business days ${rule.minDays}–${rule.maxDays}).`;
  }
  if (rule.kind === "recurring") {
    const next = addBusinessDays(from, rule.everyDays ?? 0);
    return `${plural(result.elapsed, "business day")} since ${formatDate(from)}. The next regular update is due by ${formatDate(next)}.`;
  }
  const deadline = addBusinessDays(from, rule.deadlineDays ?? 0);
  const left = result.remaining ?? 0;
  return left >= 0
    ? `${plural(left, "business day")} left by this count. The window ends ${formatDate(deadline)}.`
    : `By this count, the window ended ${formatDate(deadline)}.`;
}

/** Share of the usual window used so far, for the progress bar. */
function progress({ rule, result }: StageResult): number | null {
  const total = rule.kind === "window" ? rule.maxDays : rule.kind === "recurring" ? rule.everyDays : rule.deadlineDays;
  return total ? Math.min(1, result.elapsed / total) : null;
}

const START_LABEL: Record<CaseClockState["process"], string> = {
  investigation: "Written notice of the charges",
  "alternative-resolution": "Written notice that Alternative Resolution started",
  dismissal: "Notice of dismissal",
};

type Props = { timeline: SchoolTimeline; state: CaseClockState; stages: StageResult[] };

export default function Timeline({ timeline, state, stages }: Props) {
  return (
    <ol className="relative flex flex-col gap-5 border-l-2 border-border pl-6 sm:pl-8">
      <li className="relative">
        <span aria-hidden className="absolute -left-[2.05rem] top-1.5 size-4 rounded-full bg-primary ring-4 ring-primary-soft sm:-left-[2.55rem]" />
        <p className="text-sm text-muted">{formatDate(state.startDate)}</p>
        <p className="font-semibold text-foreground">{START_LABEL[state.process]}</p>
        <p className="text-sm text-muted">The clock starts here.</p>
      </li>

      {stages.map((stage) => {
        const { rule } = stage;
        const pct = progress(stage);
        return (
          <li key={rule.id} className="relative">
            <span aria-hidden className="absolute -left-[2.05rem] top-6 size-4 rounded-full border-2 border-primary bg-surface sm:-left-[2.55rem]" />
            <article className="glass shadow-soft rounded-[var(--radius)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-xl font-semibold text-foreground">{rule.label}</h3>
                <StatusChip stage={stage} />
              </div>
              <p className="mt-2">{rule.summary}</p>
              <p className="mt-2 text-sm text-muted">{detail(stage)}</p>
              {pct !== null && (
                <div
                  aria-hidden
                  className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${Math.round(pct * 100)}%` }}
                  />
                </div>
              )}
              {!rule.verified && (
                <p className="mt-3 rounded-xl bg-surface-muted px-3 py-2 text-sm font-medium">
                  Confirm this timeframe with {timeline.officeName}.
                </p>
              )}
              <details className="mt-3 text-sm">
                <summary className="min-h-11 cursor-pointer py-2 font-medium text-primary">
                  What the policy says
                </summary>
                {rule.quote && (
                  <blockquote className="border-l-4 border-accent pl-3 italic">
                    &ldquo;{rule.quote}&rdquo;
                  </blockquote>
                )}
                <p className="mt-2 text-muted">
                  {rule.cite}, counted from {rule.startsFrom}.{" "}
                  <a
                    href={timeline.policyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    Read the policy
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </p>
              </details>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
