"use client";

import { useId, useState } from "react";
import { formatDate, isIsoDate } from "@/lib/caseclock/businessDays";
import { NO_REPLY_AFTER_DAYS, rungState, suggestNext } from "@/lib/caseclock/ladder";
import type { LadderRung, LadderTrack, RungContact } from "@/lib/caseclock/types";

export const REASSURANCE =
  "Delays aren't your fault. A confidential advocate can contact them for you.";

const TRACK_TITLE: Record<LadderTrack, string> = {
  school: "At UC Berkeley",
  police: "Police",
};

const smallBtn =
  "min-h-10 rounded-full border border-border bg-surface/70 px-3.5 py-1 text-sm font-medium hover:border-primary";
const smallPrimary =
  "min-h-10 rounded-full bg-primary px-3.5 py-1 text-sm font-medium text-primary-contrast hover:bg-primary-hover";

type Props = {
  rungs: LadderRung[];
  tracks: LadderTrack[];
  contacts: Record<string, RungContact>;
  today: string;
  onChange: (contacts: Record<string, RungContact>) => void;
  onFollowUp: (rung: LadderRung) => void;
};

function Rung({
  rung,
  index,
  contact,
  today,
  suggested,
  onSet,
  onFollowUp,
}: {
  rung: LadderRung;
  index: number;
  contact: RungContact | undefined;
  today: string;
  suggested: boolean;
  onSet: (contact: RungContact | undefined) => void;
  onFollowUp: () => void;
}) {
  const [pickingDate, setPickingDate] = useState(false);
  const [date, setDate] = useState(today);
  const dateId = useId();
  const s = rungState(contact, today);

  const statusText =
    s.state === "not-contacted"
      ? "Not contacted yet"
      : s.state === "replied"
        ? `Contacted ${formatDate(s.contactedOn)} · they replied`
        : s.state === "waiting"
          ? `Contacted ${formatDate(s.contactedOn)} · waiting (${s.days} of ${NO_REPLY_AFTER_DAYS} business days)`
          : `Contacted ${formatDate(s.contactedOn)} · no reply in ${s.days} business days`;

  return (
    <li
      className={`flex gap-3 rounded-2xl border p-4 ${suggested ? "border-primary bg-primary-soft/60" : "border-border bg-surface/80"}`}
    >
      <span
        aria-hidden
        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${s.state === "not-contacted" ? "bg-surface-muted text-muted" : "bg-primary text-primary-contrast"}`}
      >
        {s.state === "replied" ? "✓" : index + 1}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-semibold text-foreground">{rung.office}</h4>
          {suggested && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-contrast">
              Suggested next
            </span>
          )}
          {rung.advocate && (
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-foreground">
              Can contact them for you
            </span>
          )}
        </div>
        <p className="text-sm text-muted">
          {rung.description}{" "}
          {rung.contact ??
            (rung.track === "school" ? "Find their contact on the school's site." : "Find their contact on their official site.")}
        </p>
        <p className={`text-sm ${s.state === "no-reply" ? "font-medium text-foreground" : "text-muted"}`}>{statusText}</p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {s.state === "not-contacted" && !pickingDate && (
            <>
              <button type="button" onClick={() => onSet({ contactedOn: today })} className={smallBtn}>
                I contacted them today
              </button>
              <button
                type="button"
                onClick={() => setPickingDate(true)}
                className="min-h-10 px-1 text-sm font-medium text-primary underline underline-offset-2"
              >
                Earlier date
              </button>
            </>
          )}
          {s.state === "not-contacted" && pickingDate && (
            <>
              <label htmlFor={dateId} className="sr-only">
                Date you contacted {rung.office}
              </label>
              <input
                id={dateId}
                type="date"
                max={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-10 rounded-xl border border-border bg-surface px-3 py-1 text-base"
              />
              <button
                type="button"
                disabled={!isIsoDate(date) || date > today}
                onClick={() => {
                  onSet({ contactedOn: date });
                  setPickingDate(false);
                }}
                className={`${smallPrimary} disabled:opacity-50`}
              >
                Save
              </button>
              <button type="button" onClick={() => setPickingDate(false)} className={smallBtn}>
                Cancel
              </button>
            </>
          )}
          {s.state === "no-reply" && (
            <button type="button" onClick={onFollowUp} className={smallPrimary}>
              Draft a follow-up
            </button>
          )}
          {(s.state === "waiting" || s.state === "no-reply") && (
            <button type="button" onClick={() => onSet({ ...contact!, replied: true })} className={smallBtn}>
              They replied
            </button>
          )}
          {s.state !== "not-contacted" && (
            <button
              type="button"
              onClick={() => onSet(undefined)}
              className="min-h-10 px-1 text-sm font-medium text-muted underline underline-offset-2"
            >
              Undo
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/** Who to contact, in order. The app records each contact and counts the days for you. */
export default function Ladder({ rungs, tracks, contacts, today, onChange, onFollowUp }: Props) {
  function setContact(id: string, contact: RungContact | undefined) {
    const next = { ...contacts };
    if (contact) next[id] = contact;
    else delete next[id];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted">
        Tap a button when you reach out, and Case Clock counts the days for you. If there&apos;s no
        reply in {NO_REPLY_AFTER_DAYS} business days, it suggests who to try next. You can contact
        anyone here at any time, in any order.
      </p>
      {tracks.map((track) => {
        const suggested = suggestNext(rungs, track, contacts, today);
        return (
          <section key={track} aria-labelledby={`ladder-${track}`}>
            <h3 id={`ladder-${track}`} className="mb-2 font-semibold text-foreground">
              {TRACK_TITLE[track]}
            </h3>
            <ol className="flex flex-col gap-2.5">
              {rungs
                .filter((r) => r.track === track)
                .map((rung, i) => (
                  <Rung
                    key={rung.id}
                    rung={rung}
                    index={i}
                    contact={contacts[rung.id]}
                    today={today}
                    suggested={suggested?.id === rung.id}
                    onSet={(c) => setContact(rung.id, c)}
                    onFollowUp={() => onFollowUp(rung)}
                  />
                ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
