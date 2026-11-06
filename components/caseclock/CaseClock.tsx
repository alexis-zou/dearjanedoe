"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useVault } from "@/components/vault/VaultProvider";
import { berkeleyLadder } from "@/data/ladders/berkeley";
import { berkeleyTimeline } from "@/data/timelines/berkeley";
import { addBusinessDays, formatDate, subtractBusinessDays, todayIso } from "@/lib/caseclock/businessDays";
import { evaluate, type StageResult } from "@/lib/caseclock/engine";
import { NO_REPLY_AFTER_DAYS, rungState, suggestNext } from "@/lib/caseclock/ladder";
import { load, save } from "@/lib/caseclock/persistence";
import { followUp, statusRequest, timelineRequest } from "@/lib/caseclock/templates";
import type { CaseClockState, EmailTemplate, LadderRung, LadderTrack } from "@/lib/caseclock/types";
import { subscribe } from "@/lib/vault/store";
import DraftPanel from "./DraftPanel";
import Ladder, { REASSURANCE } from "./Ladder";
import SetupForm, { PROCESSES } from "./SetupForm";
import Timeline, { START_LABEL } from "./Timeline";

const OFFICE = berkeleyTimeline.officeName;

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

const btnPrimary =
  "min-h-12 rounded-full bg-primary px-6 py-2 font-medium text-primary-contrast hover:bg-primary-hover";
const btnSecondary =
  "min-h-11 rounded-full border border-border bg-surface/70 px-4 py-1.5 text-sm font-medium text-foreground hover:border-primary";

const shortOffice = (office: string) => office.replace(/^Your /, "your ");

/* ------------------------------------------------------------------ */
/* What needs attention                                                */
/* ------------------------------------------------------------------ */

type Nudge = {
  key: string;
  headline: string;
  /** "The policy says X. It's been Y. You can ask Z." */
  text: string;
  overdue: boolean;
  draft?: EmailTemplate;
  /** Ladder rung to log as contacted when the user says they sent the draft. */
  sendTo?: string;
};

function pickNudges(stages: StageResult[], state: CaseClockState, rungs: LadderRung[], today: string): Nudge[] {
  const out: Nudge[] = [];
  const ctxBase = { timeline: berkeleyTimeline, startDate: state.startDate, lastUpdateDate: state.lastUpdateDate };
  const find = (s: StageResult["result"]["status"]) => stages.find((x) => x.result.status === s);
  // Already wrote to OPHD and still inside the 5-day wait: don't ask the user to write again.
  const waitingOnOffice = rungState(state.contacts["ophd-contact"], today).state === "waiting";

  const deadline = find("deadline-soon");
  if (deadline) {
    const left = deadline.result.remaining ?? 0;
    const ends = formatDate(addBusinessDays(deadline.from, deadline.rule.deadlineDays ?? 0));
    out.push({
      key: "deadline",
      headline: left >= 0 ? `Your appeal window ends ${ends}` : "The appeal window may have closed",
      overdue: false,
      text:
        `The policy says an appeal of a dismissal goes to the appeal officer within five business days after the notice. ` +
        (left >= 0
          ? `By this count, ${left} business day${left === 1 ? " is" : "s are"} left. `
          : `By this count, that window ended ${ends}. `) +
        `The appeal officer's contact is in your notice of dismissal. A PATH to Care advocate can help you with an appeal or explain what it involves.`,
    });
  }

  const past = find("past-window");
  if (past && !waitingOnOffice) {
    const altres = past.rule.id === "altres";
    out.push({
      key: "past",
      headline: `Ask ${OFFICE} about the timeline`,
      overdue: true,
      text: `The policy says ${altres ? "Alternative Resolution" : "the investigation"} is typically done within ${past.rule.minDays}–${past.rule.maxDays} business days, and any extension comes with a written reason and a new timeline. It's been ${past.result.elapsed} business days with no extension notice. You can ask ${OFFICE} for the reason and a new timeline in writing.`,
      draft: timelineRequest({ ...ctxBase, elapsed: past.result.elapsed }, altres ? "altres" : "invest"),
      sendTo: "ophd-contact",
    });
  }

  const update = find("update-available");
  if (update && !waitingOnOffice) {
    out.push({
      key: "update",
      headline: "Ask for a status update",
      overdue: true,
      text: `The policy says ${OFFICE} gives a status update whenever you ask, and every 30 business days. It's been ${update.result.elapsed} business days since ${state.lastUpdateDate ? "your last update" : "the investigation started"}. You can ask for one now.`,
      draft: statusRequest({ ...ctxBase, elapsed: update.result.elapsed }),
      sendTo: "ophd-contact",
    });
  }

  for (const rung of rungs) {
    const s = rungState(state.contacts[rung.id], today);
    if (s.state !== "no-reply") continue;
    const next = suggestNext(rungs, rung.track, state.contacts, today);
    out.push({
      key: `noreply-${rung.id}`,
      headline: `No reply from ${shortOffice(rung.office)}`,
      overdue: true,
      text: `You contacted them on ${formatDate(s.contactedOn)}, ${s.days} business days ago. You can send a follow-up${next ? `, or contact ${next.office} next` : ""}.`,
      draft: followUp({
        timeline: berkeleyTimeline,
        startDate: state.startDate,
        elapsed: 0,
        office: rung.office.replace(/^Your /, "my "),
        contactedOn: s.contactedOn,
      }),
      sendTo: rung.id,
    });
  }

  return out;
}

/** The next date the app will flag something, so "nothing to do" still says what's coming. */
function nextCheckIn(stages: StageResult[], state: CaseClockState, rungs: LadderRung[], today: string) {
  const dates: { date: string; what: string }[] = [];
  for (const { rule, from } of stages) {
    if (rule.kind === "window") {
      dates.push({ date: addBusinessDays(from, rule.minDays ?? 0), what: `the usual ${rule.label.toLowerCase()} window opens` });
      dates.push({ date: addBusinessDays(from, rule.maxDays ?? 0), what: `the usual ${rule.label.toLowerCase()} window ends` });
    } else if (rule.kind === "recurring") {
      dates.push({ date: addBusinessDays(from, rule.everyDays ?? 0), what: "a regular status update is due" });
    }
  }
  for (const rung of rungs) {
    const s = rungState(state.contacts[rung.id], today);
    if (s.state === "waiting") {
      dates.push({
        date: addBusinessDays(s.contactedOn, NO_REPLY_AFTER_DAYS),
        what: `you'll have waited ${NO_REPLY_AFTER_DAYS} business days for ${shortOffice(rung.office)}`,
      });
    }
  }
  return dates.filter((d) => d.date > today).sort((a, b) => (a.date < b.date ? -1 : 1))[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function SaveStatus({ isDemo }: { isDemo: boolean }) {
  const { mode, locked } = useVault();
  if (isDemo) return <p className="text-sm text-muted">Example case. Nothing here is saved.</p>;
  if (mode === "saved" && !locked) {
    return <p className="text-sm text-muted">Saved on this device, encrypted with your passphrase.</p>;
  }
  return (
    <p className="text-sm text-muted">
      Kept only while this tab is open.{" "}
      <Link href="/vault" className="font-medium text-primary underline underline-offset-2">
        Keep it on this device
      </Link>
    </p>
  );
}

const STATUS_LABEL: Record<string, string> = {
  "on-track": "Before the usual window",
  "in-window": "Inside the usual window",
  "past-window": "Past the usual timeframe",
  extended: "Extended, with notice",
};

function Summary({
  state,
  stages,
  isDemo,
  onEdit,
}: {
  state: CaseClockState;
  stages: StageResult[];
  isDemo: boolean;
  onEdit: () => void;
}) {
  const main = stages[0];
  const { rule, result } = main;
  const processLabel = PROCESSES.find((p) => p.id === state.process)?.label ?? "";
  const dismissal = rule.kind === "user-deadline";
  const left = result.remaining ?? 0;
  const max = rule.maxDays ?? rule.deadlineDays ?? 1;
  const pct = Math.min(1, result.elapsed / max);
  const minPct = rule.minDays ? rule.minDays / max : null;

  const label = dismissal
    ? result.status === "deadline-soon"
      ? left >= 0
        ? "Deadline soon"
        : "Window may have closed"
      : "Window open"
    : (STATUS_LABEL[result.status] ?? "");
  const alert = result.status === "past-window" || result.status === "deadline-soon";

  return (
    <section aria-labelledby="summary-heading" className="glass shadow-soft rounded-[var(--radius)] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="summary-heading" style={{ fontFamily: "var(--font-sans)" }} className="font-sans text-sm font-medium text-muted">
            UC Berkeley · {processLabel}
          </h2>
          <p className="mt-1 font-display text-5xl font-semibold leading-none text-foreground">
            {dismissal ? `${Math.max(0, left)} day${left === 1 ? "" : "s"}` : `Day ${result.elapsed}`}
          </p>
          <p className="mt-2 text-muted">
            {dismissal
              ? `business days left to appeal, counted from ${formatDate(state.startDate)}`
              : `business days since the ${START_LABEL[state.process].toLowerCase()} (${formatDate(state.startDate)})`}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium text-foreground ${alert ? "bg-danger/15 ring-1 ring-danger/40" : result.status === "in-window" ? "bg-accent-soft" : "bg-primary-soft"}`}
        >
          {label}
        </span>
      </div>

      {!dismissal && (
        <div className="mt-5" aria-hidden>
          <div className="relative h-2.5 rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.round(pct * 100)}%` }} />
            {minPct !== null && (
              <span className="absolute top-0 h-full w-0.5 bg-foreground/30" style={{ left: `${minPct * 100}%` }} />
            )}
          </div>
          <div className="relative mt-1 h-4 text-xs text-muted">
            <span className="absolute left-0">0 business days</span>
            {minPct !== null && (
              <span className="absolute -translate-x-1/2" style={{ left: `${minPct * 100}%` }}>
                {rule.minDays}
              </span>
            )}
            <span className="absolute right-0">{max}</span>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <SaveStatus isDemo={isDemo} />
        <button type="button" onClick={onEdit} className={btnSecondary}>
          Edit dates
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CaseClock() {
  const params = useSearchParams();
  const demo = params.get("demo") === "1";
  const today = todayIso();
  const { locked } = useVault();

  const [state, setState] = useState<CaseClockState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState<Nudge | null>(null);
  const [tab, setTab] = useState<"history" | "contacts">("history");
  const [logged, setLogged] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const isDemoRef = useRef(false);
  const draftRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (open) draftRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  function update(next: CaseClockState | null, message = "") {
    setState(next);
    setLogged(message);
    if (!isDemo) void save(next);
  }

  if (!loaded) return <p className="text-muted">Loading…</p>;

  if (!state || editing) {
    return (
      <div className="flex flex-col gap-4">
        {!state && locked && (
          <p className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm">
            Have a saved case?{" "}
            <Link href="/vault" className="font-medium text-primary underline underline-offset-2">
              Unlock My details
            </Link>{" "}
            to see it.
          </p>
        )}
        <SetupForm
          initial={state}
          today={today}
          onSubmit={(next) => {
            update(next, state ? "Your dates are updated." : "");
            setEditing(false);
            setOpen(null);
          }}
          onCancel={state ? () => setEditing(false) : undefined}
        />
      </div>
    );
  }

  const current = state;
  const stages = evaluate(current, berkeleyTimeline, today);
  const tracks: LadderTrack[] = current.policeReport ? ["school", "police"] : ["school"];
  const rungs = berkeleyLadder.filter((r) => tracks.includes(r.track));
  const nudges = pickNudges(stages, current, rungs, today);
  const upcoming = nextCheckIn(stages, current, rungs, today);
  const [first, ...rest] = nudges;
  const showReassurance = nudges.some((n) => n.overdue);

  function logSent(nudge: Nudge) {
    if (!nudge.sendTo) return;
    const rung = berkeleyLadder.find((r) => r.id === nudge.sendTo);
    update(
      { ...current, contacts: { ...current.contacts, [nudge.sendTo]: { contactedOn: today } } },
      `Logged: you contacted ${rung ? shortOffice(rung.office) : OFFICE} today. If there's no reply by ${formatDate(addBusinessDays(today, NO_REPLY_AFTER_DAYS))}, Case Clock will suggest a follow-up.`,
    );
    setOpen(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <Summary state={current} stages={stages} isDemo={isDemo} onEdit={() => setEditing(true)} />

      {logged && (
        <p role="status" className="rounded-2xl border border-primary/40 bg-primary-soft px-4 py-3 text-sm">
          {logged}
        </p>
      )}

      {/* ---------- Next step ---------- */}
      <section
        aria-labelledby="next-heading"
        className="rounded-[var(--radius)] border border-white/50 bg-gradient-to-br from-accent-soft via-surface to-primary-soft p-5 shadow-soft sm:p-7"
      >
        <h2 id="next-heading" style={{ fontFamily: "var(--font-sans)" }} className="font-sans text-sm font-medium tracking-wide text-primary">
          {first ? "Next step" : "Nothing needs you right now"}
        </h2>
        {first ? (
          <>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">{first.headline}</p>
            <p className="mt-2 max-w-2xl">{first.text}</p>
            {first.draft && (
              <button type="button" onClick={() => setOpen(first)} className={`${btnPrimary} mt-4`}>
                Draft the email for me
              </button>
            )}
          </>
        ) : (
          <p className="mt-1 max-w-2xl">
            {stages.some((x) => x.result.status === "past-window" || x.result.status === "update-available")
              ? `You've reached out to ${OFFICE}, so there's nothing to do while you wait.`
              : `Nothing is past ${OFFICE}'s usual timeframe today.`}
            {upcoming && (
              <>
                {" "}
                Case Clock will check again on <strong>{formatDate(upcoming.date)}</strong>, when {upcoming.what}.
              </>
            )}{" "}
            You can still ask {OFFICE} for an update at any time.
          </p>
        )}

        {rest.length > 0 && (
          <div className="mt-5 border-t border-border/70 pt-4">
            <p className="text-sm font-medium text-muted">Also</p>
            <ul className="mt-2 flex flex-col gap-2">
              {rest.map((n) => (
                <li key={n.key} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface/70 px-4 py-3">
                  <span className="font-medium text-foreground">{n.headline}</span>
                  {n.draft && (
                    <button type="button" onClick={() => setOpen(n)} className={btnSecondary}>
                      Draft email
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showReassurance && <p className="mt-4 max-w-2xl text-sm text-muted">{REASSURANCE}</p>}
      </section>

      {open?.draft && (
        <div ref={draftRef} className="scroll-mt-24">
          <DraftPanel
            template={open.draft}
            onClose={() => setOpen(null)}
            footer={
              open.sendTo && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface/80 px-4 py-3">
                  <p className="text-sm">Sent it? Case Clock will remember and count the days for you.</p>
                  <button type="button" onClick={() => logSent(open)} className={btnPrimary}>
                    I sent it today
                  </button>
                </div>
              )
            }
          />
        </div>
      )}

      {/* ---------- Something new? ---------- */}
      <section aria-labelledby="quick-heading" className="flex flex-col gap-2">
        <h2 id="quick-heading" style={{ fontFamily: "var(--font-sans)" }} className="font-sans text-sm font-medium text-muted">
          Something new? Tap to add it to your case.
        </h2>
        <div className="flex flex-wrap gap-2">
          {current.process === "investigation" && current.lastUpdateDate !== today && (
            <button
              type="button"
              onClick={() => update({ ...current, lastUpdateDate: today }, `Logged: status update from ${OFFICE} today.`)}
              className={btnSecondary}
            >
              I got a status update today
            </button>
          )}
          {current.process !== "dismissal" && !current.extensionNoticed && (
            <button
              type="button"
              onClick={() => update({ ...current, extensionNoticed: true }, `Logged: ${OFFICE} sent a written extension notice.`)}
              className={btnSecondary}
            >
              {OFFICE} extended the timeline
            </button>
          )}
          <button type="button" onClick={() => setTab("contacts")} className={btnSecondary}>
            I contacted someone
          </button>
        </div>
      </section>

      {/* ---------- Details, in tabs ---------- */}
      <section aria-label="Case details" className="glass shadow-soft rounded-[var(--radius)] p-5 sm:p-7">
        <div role="tablist" aria-label="Case details" className="mb-5 inline-flex rounded-full bg-surface-muted p-1">
          {(
            [
              ["history", "Case history"],
              ["contacts", "Who to contact"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              onClick={() => setTab(id)}
              className={`min-h-11 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${tab === id ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "history" ? (
            <Timeline timeline={berkeleyTimeline} state={current} stages={stages} rungs={rungs} today={today} />
          ) : (
            <Ladder
              rungs={rungs}
              tracks={tracks}
              contacts={current.contacts}
              today={today}
              onChange={(contacts) => update({ ...current, contacts }, "Logged.")}
              onFollowUp={(rung) => {
                const n = nudges.find((x) => x.key === `noreply-${rung.id}`);
                if (n) setOpen(n);
              }}
            />
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <p>
          General information, not legal advice.{" "}
          <Link href="/university" className="text-primary underline underline-offset-2">
            Ask about UC Berkeley&apos;s process
          </Link>
        </p>
        {confirmClear ? (
          <span className="flex flex-wrap items-center gap-2">
            Clear this case?
            <button
              type="button"
              onClick={() => {
                update(null);
                setIsDemo(false);
                setOpen(null);
                setConfirmClear(false);
              }}
              className="min-h-10 rounded-full bg-danger px-3.5 py-1 font-medium text-danger-contrast"
            >
              Yes, clear it
            </button>
            <button type="button" onClick={() => setConfirmClear(false)} className={btnSecondary}>
              Keep it
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmClear(true)} className="min-h-10 underline underline-offset-2">
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
