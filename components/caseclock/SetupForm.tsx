"use client";

import { useId, useState, type FormEvent } from "react";
import { isIsoDate } from "@/lib/caseclock/businessDays";
import type { CaseClockState, ProcessId } from "@/lib/caseclock/types";

export const PROCESSES: { id: ProcessId; label: string; dateLabel: string; hint: string }[] = [
  {
    id: "investigation",
    label: "Formal investigation",
    dateLabel: "When did you get written notice of the charges?",
    hint: "The date on OPHD's written notice. The investigation timeframe counts from here.",
  },
  {
    id: "alternative-resolution",
    label: "Alternative Resolution",
    dateLabel: "When did you get written notice that Alternative Resolution started?",
    hint: "The date on OPHD's written notice that the process began.",
  },
  {
    id: "dismissal",
    label: "A dismissal notice",
    dateLabel: "When did you get the notice of dismissal?",
    hint: "The date on the notice. The appeal window counts from here.",
  },
];

const inputClass =
  "mt-1 block min-h-12 w-full max-w-xs rounded-xl border border-border bg-surface px-3 py-2 text-base text-foreground";
const pillClass =
  "flex min-h-12 cursor-pointer items-center gap-3 rounded-full border border-border bg-surface/70 px-4 py-2 text-foreground transition-colors hover:border-primary has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring";

type Props = {
  initial: CaseClockState | null;
  today: string;
  onSubmit: (state: CaseClockState) => void;
  onCancel?: () => void;
};

export default function SetupForm({ initial, today, onSubmit, onCancel }: Props) {
  const [process, setProcess] = useState<ProcessId>(initial?.process ?? "investigation");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [lastUpdateDate, setLastUpdateDate] = useState(initial?.lastUpdateDate ?? "");
  const [extensionNoticed, setExtensionNoticed] = useState(initial?.extensionNoticed ?? false);
  const [policeReport, setPoliceReport] = useState(initial?.policeReport ?? false);
  const [error, setError] = useState("");
  const startId = useId();
  const updateId = useId();
  const errorId = useId();

  const chosen = PROCESSES.find((p) => p.id === process) ?? PROCESSES[0];

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isIsoDate(startDate) || startDate > today) {
      setError("Enter a date on or before today.");
      return;
    }
    if (process === "investigation" && lastUpdateDate) {
      if (!isIsoDate(lastUpdateDate) || lastUpdateDate > today || lastUpdateDate < startDate) {
        setError("The last update date needs to be between the notice date and today.");
        return;
      }
    }
    setError("");
    onSubmit({
      school: "berkeley",
      process,
      startDate,
      lastUpdateDate: process === "investigation" && lastUpdateDate ? lastUpdateDate : undefined,
      extensionNoticed: process !== "dismissal" && extensionNoticed,
      policeReport,
      // Keep ladder progress when only the dates change.
      contacts: initial?.contacts ?? {},
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="glass shadow-soft flex flex-col gap-6 rounded-[var(--radius)] p-5 sm:p-7"
    >
      <fieldset>
        <legend className="mb-2 font-semibold text-foreground">School</legend>
        <div className="flex flex-wrap gap-2">
          <label className={pillClass}>
            <input type="radio" name="school" value="berkeley" checked readOnly className="size-5 accent-primary" />
            <span className="font-medium">UC Berkeley</span>
          </label>
        </div>
        <p className="mt-2 text-sm text-muted">Only UC Berkeley is available for now.</p>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-semibold text-foreground">Which process are you tracking?</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {PROCESSES.map((p) => (
            <label key={p.id} className={pillClass}>
              <input
                type="radio"
                name="process"
                value={p.id}
                checked={process === p.id}
                onChange={() => setProcess(p.id)}
                className="size-5 shrink-0 accent-primary"
              />
              <span className="font-medium">{p.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={startId} className="block font-semibold text-foreground">
          {chosen.dateLabel}
        </label>
        <p className="text-sm text-muted">{chosen.hint}</p>
        <input
          id={startId}
          type="date"
          required
          max={today}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          className={inputClass}
        />
      </div>

      {process === "investigation" && (
        <div>
          <label htmlFor={updateId} className="block font-semibold text-foreground">
            When did you last get a status update? <span className="font-normal text-muted">(optional)</span>
          </label>
          <p className="text-sm text-muted">Leave this empty if you haven&apos;t had one yet.</p>
          <input
            id={updateId}
            type="date"
            min={startDate || undefined}
            max={today}
            value={lastUpdateDate}
            onChange={(e) => setLastUpdateDate(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {process !== "dismissal" && (
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={extensionNoticed}
              onChange={(e) => setExtensionNoticed(e.target.checked)}
              className="mt-1 size-5 shrink-0 accent-primary"
            />
            <span>OPHD sent me written notice of an extension, with a new timeline.</span>
          </label>
        )}
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={policeReport}
            onChange={(e) => setPoliceReport(e.target.checked)}
            className="mt-1 size-5 shrink-0 accent-primary"
          />
          <span>I made a police report. (This adds police contacts to the list of who to contact next.)</span>
        </label>
      </div>

      {error && (
        <p id={errorId} role="alert" className="font-medium text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="min-h-12 rounded-full bg-primary px-6 py-2 font-medium text-primary-contrast hover:bg-primary-hover"
        >
          Show my timeline
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-full border border-border bg-surface/70 px-6 py-2 font-medium text-foreground hover:border-primary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
