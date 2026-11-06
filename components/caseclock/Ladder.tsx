"use client";

import { useId, useState } from "react";
import { formatDate, isIsoDate } from "@/lib/caseclock/businessDays";
import { rungState, suggestNext } from "@/lib/caseclock/ladder";
import type { LadderRung, LadderTrack, RungContact } from "@/lib/caseclock/types";

export const REASSURANCE =
  "Delays aren't your fault. A confidential advocate can contact them for you.";

const TRACK_TITLE: Record<LadderTrack, string> = {
  school: "At the school",
  police: "Police",
};

type Props = {
  rungs: LadderRung[];
  tracks: LadderTrack[];
  contacts: Record<string, RungContact>;
  today: string;
  onChange: (contacts: Record<string, RungContact>) => void;
  onFollowUp: (rung: LadderRung, contactedOn: string) => void;
};

function Rung({
  rung,
  contact,
  today,
  suggested,
  onSet,
  onFollowUp,
}: {
  rung: LadderRung;
  contact: RungContact | undefined;
  today: string;
  suggested: boolean;
  onSet: (contact: RungContact | undefined) => void;
  onFollowUp: () => void;
}) {
  const [date, setDate] = useState(today);
  const [error, setError] = useState("");
  const dateId = useId();
  const s = rungState(contact, today);

  function markContacted() {
    if (!isIsoDate(date) || date > today) {
      setError("Enter a date on or before today.");
      return;
    }
    setError("");
    onSet({ contactedOn: date });
  }

  return (
    <li
      className={`rounded-2xl border bg-surface/80 p-4 ${suggested ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
    >
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
      <p className="mt-1 text-sm">{rung.description}</p>
      <p className="mt-1 text-sm text-muted">{rung.contact ??
          (rung.track === "school" ? "Find contact on the school's site" : "Find contact on their official site")}</p>

      {s.state === "not-contacted" ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor={dateId} className="block text-sm font-medium">
              I contacted them on
            </label>
            <input
              id={dateId}
              type="date"
              max={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 min-h-11 rounded-xl border border-border bg-surface px-3 py-1.5 text-base"
            />
          </div>
          <button
            type="button"
            onClick={markContacted}
            className="min-h-11 rounded-full border border-primary px-4 py-1.5 text-sm font-medium hover:bg-primary-soft"
          >
            Save date
          </button>
          {error && (
            <p role="alert" className="w-full text-sm font-medium text-danger">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm">
            {s.state === "replied" && <>Contacted {formatDate(s.contactedOn)}. They replied.</>}
            {s.state === "waiting" && (
              <>
                Contacted {formatDate(s.contactedOn)}. Waiting for a reply ({s.days} of 5 business
                days).
              </>
            )}
            {s.state === "no-reply" && (
              <>
                <strong>No reply yet.</strong> Contacted {formatDate(s.contactedOn)}, {s.days}{" "}
                business days ago.
              </>
            )}
          </p>
          {s.state === "no-reply" && <p className="text-sm text-muted">{REASSURANCE}</p>}
          <div className="flex flex-wrap gap-2">
            {s.state === "no-reply" && (
              <button
                type="button"
                onClick={onFollowUp}
                className="min-h-11 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-contrast hover:bg-primary-hover"
              >
                Draft a follow-up
              </button>
            )}
            {s.state !== "replied" && (
              <button
                type="button"
                onClick={() => onSet({ ...contact!, replied: true })}
                className="min-h-11 rounded-full border border-primary px-4 py-1.5 text-sm font-medium hover:bg-primary-soft"
              >
                They replied
              </button>
            )}
            <button
              type="button"
              onClick={() => onSet(undefined)}
              className="min-h-11 rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:border-primary"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function Ladder({ rungs, tracks, contacts, today, onChange, onFollowUp }: Props) {
  function setContact(id: string, contact: RungContact | undefined) {
    const next = { ...contacts };
    if (contact) next[id] = contact;
    else delete next[id];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-6">
      {tracks.map((track) => {
        const suggested = suggestNext(rungs, track, contacts, today);
        return (
          <section key={track} aria-labelledby={`ladder-${track}`}>
            <h3 id={`ladder-${track}`} className="mb-2 font-semibold text-foreground">
              {TRACK_TITLE[track]}
            </h3>
            <ol className="flex flex-col gap-3">
              {rungs
                .filter((r) => r.track === track)
                .map((rung) => (
                  <Rung
                    key={rung.id}
                    rung={rung}
                    contact={contacts[rung.id]}
                    today={today}
                    suggested={suggested?.id === rung.id}
                    onSet={(c) => setContact(rung.id, c)}
                    onFollowUp={() => onFollowUp(rung, contacts[rung.id].contactedOn)}
                  />
                ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
