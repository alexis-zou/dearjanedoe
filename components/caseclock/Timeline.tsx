import { addBusinessDays, formatDate } from "@/lib/caseclock/businessDays";
import type { StageResult } from "@/lib/caseclock/engine";
import { rungState } from "@/lib/caseclock/ladder";
import type { CaseClockState, LadderRung, SchoolTimeline } from "@/lib/caseclock/types";

type Entry = {
  date: string;
  title: string;
  note?: string;
  /** event: something that happened · milestone: a policy date that has passed · today · expected: still ahead */
  kind: "event" | "milestone" | "today" | "expected";
  alert?: boolean;
  order: number;
};

export const START_LABEL: Record<CaseClockState["process"], string> = {
  investigation: "Notice of the charges",
  "alternative-resolution": "Alternative Resolution started",
  dismissal: "Notice of dismissal",
};

/** Everything on record plus the policy's dates, in date order. */
function buildEntries(
  state: CaseClockState,
  stages: StageResult[],
  rungs: LadderRung[],
  today: string,
  officeName: string,
): Entry[] {
  const out: Entry[] = [
    { date: state.startDate, title: START_LABEL[state.process], note: "The clock starts here.", kind: "event", order: 0 },
  ];

  if (state.lastUpdateDate) {
    out.push({ date: state.lastUpdateDate, title: `Status update from ${officeName}`, kind: "event", order: 1 });
  }

  for (const rung of rungs) {
    const contact = state.contacts[rung.id];
    if (!contact) continue;
    const s = rungState(contact, today);
    out.push({
      date: contact.contactedOn,
      title: `You contacted ${rung.office.replace(/^Your /, "your ")}`,
      note:
        s.state === "replied"
          ? "They replied."
          : s.state === "no-reply"
            ? `No reply after ${s.days} business days.`
            : "Waiting for a reply.",
      alert: s.state === "no-reply",
      kind: "event",
      order: 2,
    });
  }

  const push = (date: string, title: string, note?: string, alert?: boolean) =>
    out.push({ date, title, note, alert, kind: date <= today ? "milestone" : "expected", order: 3 });

  for (const { rule, from, result } of stages) {
    if (rule.kind === "window") {
      push(addBusinessDays(from, rule.minDays ?? 0), `Usual ${rule.label.toLowerCase()} window opens`, `Business day ${rule.minDays}.`);
      push(
        addBusinessDays(from, rule.maxDays ?? 0),
        `Usual ${rule.label.toLowerCase()} window ends`,
        result.status === "extended"
          ? `Business day ${rule.maxDays}. You've marked an extension notice.`
          : `Business day ${rule.maxDays}.`,
        result.status === "past-window",
      );
    } else if (rule.kind === "recurring") {
      const due = addBusinessDays(from, rule.everyDays ?? 0);
      push(due, "Regular status update due", `Every ${rule.everyDays} business days.`, result.status === "update-available");
    } else {
      const ends = addBusinessDays(from, rule.deadlineDays ?? 0);
      push(ends, "Appeal window ends", `${rule.deadlineDays} business days after the notice.`, result.status === "deadline-soon");
    }
  }

  out.push({ date: today, title: "Today", kind: "today", order: 4 });
  return out.sort((a, b) => (a.date === b.date ? a.order - b.order : a.date < b.date ? -1 : 1));
}

const DOT: Record<Entry["kind"], string> = {
  event: "bg-primary",
  milestone: "bg-muted",
  today: "bg-accent ring-4 ring-accent-soft",
  expected: "border-2 border-primary bg-surface",
};

type Props = {
  timeline: SchoolTimeline;
  state: CaseClockState;
  stages: StageResult[];
  rungs: LadderRung[];
  today: string;
};

/** The case history: what's happened, what the policy says comes next, and why. */
export default function Timeline({ timeline, state, stages, rungs, today }: Props) {
  const entries = buildEntries(state, stages, rungs, today, timeline.officeName);

  return (
    <div className="flex flex-col gap-5">
      <ol className="flex flex-col">
        {entries.map((e, i) => (
          <li key={`${e.date}-${e.title}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
            {i < entries.length - 1 && (
              <span aria-hidden className="absolute left-[0.4rem] top-5 h-full w-0.5 bg-border" />
            )}
            <span aria-hidden className={`relative mt-1.5 size-3.5 shrink-0 rounded-full ${DOT[e.kind]}`} />
            <div className={e.kind === "today" ? "w-full rounded-2xl bg-accent-soft/70 px-3 py-2" : ""}>
              <p className="text-sm text-muted">
                {formatDate(e.date)}
                {e.kind === "expected" && " · expected"}
              </p>
              <p className={`font-semibold ${e.kind === "expected" || e.kind === "milestone" ? "text-foreground/80" : "text-foreground"}`}>
                {e.title}
                {e.alert && (
                  <span className="ml-2 rounded-full bg-danger/15 px-2 py-0.5 align-middle text-xs font-medium text-foreground ring-1 ring-danger/40">
                    needs attention
                  </span>
                )}
              </p>
              {e.note && <p className="text-sm text-muted">{e.note}</p>}
            </div>
          </li>
        ))}
      </ol>

      <details className="rounded-2xl border border-border bg-surface/70 p-4 text-sm">
        <summary className="min-h-11 cursor-pointer py-2 font-medium text-primary">
          Where do these dates come from?
        </summary>
        <div className="mt-2 flex flex-col gap-4">
          {stages.map(({ rule }) => (
            <div key={rule.id}>
              <p className="font-semibold text-foreground">{rule.label}</p>
              <p className="mt-1">{rule.summary}</p>
              {rule.quote && (
                <blockquote className="mt-2 border-l-4 border-accent pl-3 italic">&ldquo;{rule.quote}&rdquo;</blockquote>
              )}
              <p className="mt-1 text-muted">{rule.cite}</p>
              {!rule.verified && (
                <p className="mt-1 font-medium">Confirm this timeframe with {timeline.officeName}.</p>
              )}
            </div>
          ))}
          <p className="text-muted">
            Business days skip weekends and US federal holidays. UC&apos;s own calendar has a few more
            days off, so {timeline.officeName}&apos;s count can be a day or two lower.{" "}
            <a href={timeline.policyUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              Read the full policy
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
      </details>
    </div>
  );
}
