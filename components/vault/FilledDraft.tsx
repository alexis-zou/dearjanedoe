"use client";

import { useState } from "react";
import Link from "next/link";
import { fill, fillForDisplay, listKeys, splitTokens } from "@/lib/vault/placeholders";
import { VAULT_LABELS, VAULT_PHRASES } from "@/lib/vault/types";
import type { VaultKey, VaultValues } from "@/lib/vault/types";
import { useVault } from "./VaultProvider";

type FilledDraftProps = { template: string; subject?: string };

/** The stage for a draft. Tied to the text, so approval can't carry over to a different draft. */
type Stage = { forText: string; step: "approving" | "filled"; approved: VaultKey[] };

function Tokens({ text }: { text: string }) {
  return splitTokens(text).map((part, index) =>
    typeof part === "string" ? (
      part
    ) : (
      <span
        key={index}
        className="mx-0.5 inline-block rounded-full bg-primary-soft px-2 text-sm font-medium text-foreground"
      >
        {VAULT_LABELS[part.key]}
      </span>
    ),
  );
}

/** Only what was approved, with visible brackets where a detail is still needed. */
function fillApproved(text: string, values: VaultValues, approved: VaultKey[]): string {
  const allowed: VaultValues = {};
  for (const key of approved) allowed[key] = values[key];
  const { missing } = fill(text, allowed);
  for (const key of missing) allowed[key] = `[${VAULT_PHRASES[key]}]`;
  return fillForDisplay(text, allowed);
}

const BUTTON =
  "inline-flex min-h-11 items-center rounded-lg px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-60";
const PRIMARY = `${BUTTON} bg-primary text-primary-contrast hover:bg-primary-hover`;
const SECONDARY = `${BUTTON} border border-primary text-foreground hover:bg-primary-soft`;

export default function FilledDraft({ template, subject }: FilledDraftProps) {
  const { values, locked } = useVault();
  const [stage, setStage] = useState<Stage | null>(null);
  const [copyStatus, setCopyStatus] = useState("");

  const allText = subject ? `${subject}\n${template}` : template;
  const keys = listKeys(allText);
  const available = keys.filter((key) => values[key]);
  const missing = keys.filter((key) => !values[key]);
  const current = stage?.forText === allText ? stage : null;
  const showFilled = keys.length === 0 || current?.step === "filled";

  const approved = current?.approved ?? [];
  const filledBody = fillApproved(template, values, approved);
  const filledSubject = subject === undefined ? undefined : fillApproved(subject, values, approved);

  async function copy() {
    const text = filledSubject ? `Subject: ${filledSubject}\n\n${filledBody}` : filledBody;
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied.");
    } catch {
      setCopyStatus("We couldn’t copy automatically. You can select the text and copy it yourself.");
    }
  }

  const params = [
    filledSubject ? `subject=${encodeURIComponent(filledSubject)}` : "",
    `body=${encodeURIComponent(filledBody)}`,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      {showFilled ? (
        <>
          {filledSubject && <p className="mb-3 font-medium">Subject: {filledSubject}</p>}
          <p className="whitespace-pre-wrap break-words">{filledBody}</p>
        </>
      ) : (
        <>
          {subject && (
            <p className="mb-3 font-medium">
              Subject: <Tokens text={subject} />
            </p>
          )}
          <p className="whitespace-pre-wrap break-words">
            <Tokens text={template} />
          </p>
        </>
      )}

      {missing.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm">
          {locked && (
            <li>
              Your details are locked.{" "}
              <Link href="/vault" className="font-medium underline">
                Unlock them
              </Link>
            </li>
          )}
          {missing.map((key) => (
            <li key={key}>
              <Link href="/vault" className="font-medium underline">
                Add {VAULT_PHRASES[key]}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!showFilled && current?.step !== "approving" && (
        <button
          type="button"
          disabled={available.length === 0}
          onClick={() => setStage({ forText: allText, step: "approving", approved: [] })}
          className={`${PRIMARY} mt-4`}
        >
          Fill in my details
        </button>
      )}

      {!showFilled && current?.step === "approving" && (
        <div className="mt-4 rounded-lg bg-surface-muted p-4">
          <p className="font-medium">
            This will fill in: {available.map((key) => VAULT_LABELS[key]).join(", ")}
          </p>
          <p className="mt-1 text-sm">
            Your details are filled in on this device. Nothing is sent anywhere.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStage({ forText: allText, step: "filled", approved: available })}
              className={PRIMARY}
            >
              Fill these in
            </button>
            <button type="button" onClick={() => setStage(null)} className={SECONDARY}>
              Not now
            </button>
          </div>
        </div>
      )}

      {showFilled && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void copy()} className={PRIMARY}>
            Copy
          </button>
          <a href={`mailto:?${params.join("&")}`} className={SECONDARY}>
            Open in email
          </a>
          {keys.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setStage(null);
                setCopyStatus("");
              }}
              className={SECONDARY}
            >
              Hide my details
            </button>
          )}
        </div>
      )}

      <p role="status" className="mt-2 text-sm text-muted">
        {copyStatus}
      </p>
    </div>
  );
}
