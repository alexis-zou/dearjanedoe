"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { berkeleyLadder } from "@/data/ladders/berkeley";
import { berkeleyTimeline } from "@/data/timelines/berkeley";
import {
  addBusinessDays,
  formatDate,
  outsideHolidayYears,
  subtractBusinessDays,
  todayIso,
} from "@/lib/caseclock/businessDays";
import { evaluate, type StageResult } from "@/lib/caseclock/engine";
import { load, save } from "@/lib/caseclock/persistence";
import { subscribe } from "@/lib/vault/store";
import { followUp, statusRequest, timelineRequest } from "@/lib/caseclock/templates";
import type { CaseClockState, EmailTemplate, LadderTrack } from "@/lib/caseclock/types";
import DraftPanel from "./DraftPanel";
import Ladder, { REASSURANCE } from "./Ladder";
import SetupForm, { PROCESSES } from "./SetupForm";
import Timeline from "./Timeline";

/** /tracker?demo=1: a Berkeley investigation that shows every kind of nudge. */
function demoState(today: string): CaseClockState {
  return {
    school: "berkeley",
    process: "investigation",
    startDate: subtractBusinessDays(today, 94),
    lastUpdateDate: subtractBusinessDays(today, 33),
    extensionNoticed: false,
    policeReport: true,
    contacts: { "ucpd-detective": { contactedOn: subtractBusinessDays(today, 12) } },
  };
}

type Nudge = {
  text: string;
  overdue: boolean;
  draft?: EmailTemplate;
};

/** What needs attention on the timeline, most pressing first, in "The policy says X. It's been Y. You can ask Z." form. */
function pickNudges(stages: StageResult[], state: CaseClockState): Nudge[] {
  const out: Nudge[] = [];
  const ctxBase = { timeline: berkeleyTimeline, startDate: state.startDate, lastUpdateDate: state.lastUpdateDate };
  const find = (s: StageResult["result"]["status"]) => stages.find((x) => x.result.status === s);

  const deadline = find("deadline-soon");
  if (deadline) {
    const left = deadline.result.remaining ?? 0;
    const ends = formatDate(addBusinessDays(deadline.from, deadline.rule.deadlineDays ?? 0));
    out.push({
      overdue: false,
      text:
        `The policy says an appeal of a dismissal goes to the appeal officer within five business days after the notice. ` +
        (left >= 0
          ? `By this count, ${left} business day${left === 1 ? "" : "s"} ${left === 1 ? "is" : "are"} left, through ${ends}. `
          : `By this count, that window ended ${ends}. `) +
        `The appeal officer's contact information is in your notice of dismissal. You can ask a PATH to Care advocate to help you with an appeal or explain what it involves.`,
    });
  }

  const past = find("past-window");
  if (past) {
    const ruleId = past.rule.id === "altres" ? "altres" : "invest";
    out.push({
      overdue: true,
      text: `The policy says ${past.rule.id === "altres" ? "Alternative Resolution" : "the investigation"} is typically completed within ${past.rule.minDays}–${past.rule.maxDays} business days, and that any extension comes with a written reason and a new timeline. It's been ${past.result.elapsed} business days, and you haven't marked an extension notice. You can ask ${berkeleyTimeline.officeName} for the reason and a projected new timeline in writing.`,
      draft: timelineRequest({ ...ctxBase, elapsed: past.result.elapsed }, ruleId),
    });
  }

  const update = find("update-available");
  if (update) {
    out.push({
      overdue: true,
      text: `The policy says ${berkeleyTimeline.officeName} gives a status update whenever you ask, and every 30 business days. It's been ${update.result.elapsed} business days since ${state.lastUpdateDate ? "your last update" : "the investigation started"}. You can ask for an update now.`,
      draft: statusRequest({ ...ctxBase, elapsed: update.result.elapsed }),
    });
  }

  return out;
}

export default function CaseClock() {
  const params = useSearchParams();
  const demo = params.get("demo") === "1";
  const today = todayIso();

  const [state, setState] = useState<CaseClockState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EmailTemplate | null>(null);
  const isDemoRef = useRef(false);
  useEffect(() => {
    isDemoRef.current = isDemo;
  }, [isDemo]);

  useEffect(() => {
    let alive = true;
    void load().then((saved) => {
      if (!alive) return;
      if (saved) {
        setState(saved);
      } else if (demo) {
        // Demo data lives in this component only and is never saved.
        setState(demoState(today));
        setIsDemo(true);
      }
      setLoaded(true);
    });
    // When the vault unlocks (or is deleted), pick up whatever it now holds.
    const unsubscribe = subscribe(() => {
      void load().then((saved) => {
        if (alive && !isDemoRef.current) setState(saved);
      });
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [demo, today]);

  function update(next: CaseClockState | null) {
    setState(next);
    if (!isDemo) void save(next);
  }

  if (!loaded) return <p className="text-muted">Loading…</p>;

  if (!state || editing) {
    return (
      <SetupForm
        initial={state}
        today={today}
        onSubmit={(next) => {
          update(next);
          setEditing(false);
          setDraft(null);
        }}
        onCancel={state ? () => setEditing(false) : undefined}
      />
    );
  }

  const stages = evaluate(state, berkeleyTimeline, today);
  const nudges = pickNudges(stages, state);
  const tracks: LadderTrack[] = state.policeReport ? ["school", "police"] : ["school"];
  const processLabel = PROCESSES.find((p) => p.id === state.process)?.label ?? "";

  return (
    <div className="flex flex-col gap-8">
      {isDemo && (
        <p className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm">
          You&apos;re viewing example dates. Nothing here is saved.
        </p>
      )}

      <div className="glass shadow-soft flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] px-5 py-3 sm:rounded-full">
        <p className="text-sm">
          <span className="font-semibold">{berkeleyTimeline.schoolName}</span> · {processLabel} · from{" "}
          {formatDate(state.startDate)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="min-h-11 rounded-full border border-border bg-surface/70 px-4 py-1.5 text-sm font-medium hover:border-primary"
          >
            Edit dates
          </button>
          <button
            type="button"
            onClick={() => {
              update(null);
              setIsDemo(false);
              setDraft(null);
            }}
            className="min-h-11 rounded-full border border-border bg-surface/70 px-4 py-1.5 text-sm font-medium hover:border-primary"
          >
            Start over
          </button>
        </div>
      </div>

      {nudges.length > 0 ? (
        <section
          aria-labelledby="nudge-heading"
          className="relative overflow-hidden rounded-[var(--radius)] border border-white/50 bg-gradient-to-br from-accent-soft via-surface to-primary-soft p-5 shadow-soft sm:p-6"
        >
          <h2 id="nudge-heading" className="text-2xl font-semibold text-foreground">
            Where things stand
          </h2>
          <ul className="mt-3 flex flex-col gap-5">
            {nudges.map((nudge) => (
              <li key={nudge.text} className="max-w-2xl">
                <p>{nudge.text}</p>
                {nudge.draft && (
                  <button
                    type="button"
                    onClick={() => setDraft(nudge.draft!)}
                    className="mt-3 min-h-12 rounded-full bg-primary px-6 py-2 font-medium text-primary-contrast hover:bg-primary-hover"
                  >
                    {nudge.draft.title}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {nudges.some((n) => n.overdue) && (
            <p className="mt-4 max-w-2xl text-sm text-muted">{REASSURANCE}</p>
          )}
        </section>
      ) : (
        <p className="glass rounded-[var(--radius)] px-5 py-4">
          Nothing on this timeline is past the school&apos;s usual timeframe today. You can still ask{" "}
          {berkeleyTimeline.officeName} for an update at any time.
        </p>
      )}

      {draft && <DraftPanel template={draft} onClose={() => setDraft(null)} />}

      <section aria-labelledby="timeline-heading" className="flex flex-col gap-4">
        <h2 id="timeline-heading" className="text-2xl font-semibold text-foreground">
          Your timeline
        </h2>
        <Timeline timeline={berkeleyTimeline} state={state} stages={stages} />
        <p className="text-sm text-muted">
          Business days here skip weekends and US federal holidays. UC&apos;s own calendar has a few
          more days off, so {berkeleyTimeline.officeName}&apos;s count can be a day or two lower.
          {outsideHolidayYears(state.startDate, today) &&
            " Holidays outside 2026–2027 aren't counted, so this count may be a little high."}
        </p>
      </section>

      <section aria-labelledby="ladder-heading" className="flex flex-col gap-3">
        <div>
          <h2 id="ladder-heading" className="text-2xl font-semibold text-foreground">
            Who to contact next
          </h2>
          <p className="mt-1 max-w-2xl text-muted">
            If an office doesn&apos;t reply within 5 business days, the next one is suggested. You can
            contact any of them at any time, in any order.
          </p>
        </div>
        <Ladder
          rungs={berkeleyLadder}
          tracks={tracks}
          contacts={state.contacts}
          today={today}
          onChange={(contacts) => update({ ...state, contacts })}
          onFollowUp={(rung, contactedOn) =>
            setDraft(
              followUp({
                timeline: berkeleyTimeline,
                startDate: state.startDate,
                elapsed: 0,
                office: rung.office.replace(/^Your /, "my "),
                contactedOn,
              }),
            )
          }
        />
      </section>

      <p className="text-sm text-muted">
        General information, not legal advice. Want to talk it through?{" "}
        <Link href="/university" className="text-primary underline underline-offset-2">
          Ask about UC Berkeley&apos;s process
        </Link>{" "}
        or{" "}
        <Link href="/crisis" className="text-primary underline underline-offset-2">
          find support now
        </Link>
        .
      </p>
    </div>
  );
}
