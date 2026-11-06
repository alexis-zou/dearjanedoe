"use client";

import { useId, useState } from "react";
import { isIsoDate } from "@/lib/caseclock/businessDays";
import type { CaseClockState, ProcessId } from "@/lib/caseclock/types";

export const PROCESSES: {
  id: ProcessId;
  label: string;
  description: string;
  dateLabel: string;
  hint: string;
}[] = [
  {
    id: "investigation",
    label: "Formal investigation",
    description: "OPHD is investigating and sent a written notice of the charges.",
    dateLabel: "When did you get the written notice of the charges?",
    hint: "Use the date on OPHD's notice. If you're not sure, a close guess is fine. You can change it later.",
  },
  {
    id: "alternative-resolution",
    label: "Alternative Resolution",
    description: "A voluntary process without an investigation.",
    dateLabel: "When did you get the notice that Alternative Resolution started?",
    hint: "Use the date on OPHD's notice. You can change it later.",
  },
  {
    id: "dismissal",
    label: "A dismissal notice",
    description: "You got a notice that allegations were dismissed.",
    dateLabel: "When did you get the notice of dismissal?",
    hint: "The appeal window counts from this date.",
  },
];

const inputClass =
  "mt-2 block min-h-12 w-full max-w-xs rounded-xl border border-border bg-surface px-3 py-2 text-base text-foreground";
const primaryBtn =
  "min-h-12 rounded-full bg-primary px-6 py-2 font-medium text-primary-contrast hover:bg-primary-hover";
const secondaryBtn =
  "min-h-12 rounded-full border border-border bg-surface/70 px-6 py-2 font-medium text-foreground hover:border-primary";

type Props = {
  initial: CaseClockState | null;
  today: string;
  onSubmit: (state: CaseClockState) => void;
  onCancel?: () => void;
};

/** Three short steps instead of one long form: what → when → anything else. */
export default function SetupForm({ initial, today, onSubmit, onCancel }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(initial ? 2 : 1);
  const [process, setProcess] = useState<ProcessId>(initial?.process ?? "investigation");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [lastUpdateDate, setLastUpdateDate] = useState(initial?.lastUpdateDate ?? "");
  const [extensionNoticed, setExtensionNoticed] = useState(initial?.extensionNoticed ?? false);
  const [policeReport, setPoliceReport] = useState(initial?.policeReport ?? false);
  const [error, setError] = useState("");
  const startId = useId();
  const updateId = useId();

  const chosen = PROCESSES.find((p) => p.id === process) ?? PROCESSES[0];

  function checkDates(): boolean {
    if (!isIsoDate(startDate) || startDate > today) {
      setError("Enter a date on or before today.");
      return false;
    }
    if (process === "investigation" && lastUpdateDate) {
      if (!isIsoDate(lastUpdateDate) || lastUpdateDate > today || lastUpdateDate < startDate) {
        setError("The update date needs to be between the notice date and today.");
        return false;
      }
    }
    setError("");
    return true;
  }

  function finish() {
    onSubmit({
      school: "berkeley",
      process,
      startDate,
      lastUpdateDate: process === "investigation" && lastUpdateDate ? lastUpdateDate : undefined,
      extensionNoticed: process !== "dismissal" && extensionNoticed,
      policeReport,
      contacts: initial?.contacts ?? {},
    });
  }

  return (
    <section
      aria-labelledby="setup-heading"
      className="glass shadow-soft mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-[var(--radius)] p-5 sm:p-8"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted" aria-live="polite">
          Step {step} of 3
        </p>
        <div aria-hidden className="flex gap-1.5">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`h-1.5 w-8 rounded-full ${n <= step ? "bg-primary" : "bg-surface-muted"}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <fieldset className="flex flex-col gap-3">
          <legend id="setup-heading" className="mb-1 font-display text-2xl font-semibold text-foreground">
            What would you like to keep track of?
          </legend>
          <p className="-mt-1 mb-1 text-muted">UC Berkeley (OPHD). More schools are coming later.</p>
          {PROCESSES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProcess(p.id);
                setStep(2);
              }}
              className={`flex min-h-16 flex-col items-start rounded-2xl border px-5 py-3 text-left transition-colors hover:border-primary hover:bg-primary-soft ${process === p.id && initial ? "border-primary bg-primary-soft" : "border-border bg-surface/80"}`}
            >
              <span className="font-semibold text-foreground">{p.label}</span>
              <span className="text-sm text-muted">{p.description}</span>
            </button>
          ))}
        </fieldset>
      )}

      {step === 2 && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (checkDates()) setStep(3);
          }}
          className="flex flex-col gap-6"
        >
          <div>
            <h2 id="setup-heading" className="font-display text-2xl font-semibold text-foreground">
              <label htmlFor={startId}>{chosen.dateLabel}</label>
            </h2>
            <p className="mt-1 text-muted">{chosen.hint}</p>
            <input
              id={startId}
              type="date"
              max={today}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-invalid={Boolean(error)}
              className={inputClass}
            />
          </div>

          {process === "investigation" && (
            <div>
              <label htmlFor={updateId} className="block font-semibold text-foreground">
                Have you had a status update since? <span className="font-normal text-muted">(optional)</span>
              </label>
              <p className="text-sm text-muted">If so, when was the most recent one? Leave empty if not.</p>
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

          {error && (
            <p role="alert" className="font-medium text-danger">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className={primaryBtn}>
              Continue
            </button>
            <button type="button" onClick={() => setStep(1)} className={secondaryBtn}>
              Back
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 id="setup-heading" className="font-display text-2xl font-semibold text-foreground">
              Anything else?
            </h2>
            <p className="mt-1 text-muted">Tick what applies, or skip this.</p>
          </div>
          <div className="flex flex-col gap-3">
            {process !== "dismissal" && (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface/80 p-4 has-checked:border-primary has-checked:bg-primary-soft">
                <input
                  type="checkbox"
                  checked={extensionNoticed}
                  onChange={(e) => setExtensionNoticed(e.target.checked)}
                  className="mt-1 size-5 shrink-0 accent-primary"
                />
                <span>OPHD told me in writing that they&apos;re extending the timeline.</span>
              </label>
            )}
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface/80 p-4 has-checked:border-primary has-checked:bg-primary-soft">
              <input
                type="checkbox"
                checked={policeReport}
                onChange={(e) => setPoliceReport(e.target.checked)}
                className="mt-1 size-5 shrink-0 accent-primary"
              />
              <span>I also made a police report.</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={finish} className={primaryBtn}>
              {initial ? "Save changes" : "Start tracking"}
            </button>
            <button type="button" onClick={() => setStep(2)} className={secondaryBtn}>
              Back
            </button>
          </div>
        </div>
      )}

      {onCancel && (
        <button type="button" onClick={onCancel} className="self-start text-sm font-medium text-primary underline underline-offset-2">
          Cancel and go back to my case
        </button>
      )}
    </section>
  );
}
