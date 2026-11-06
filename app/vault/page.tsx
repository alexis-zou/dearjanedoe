"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import FilledDraft from "@/components/vault/FilledDraft";
import FormAssist from "@/components/vault/FormAssist";
import { reportToOphd } from "@/data/forms/berkeley";
import { useVault } from "@/components/vault/VaultProvider";
import {
  createSaved,
  deleteAll,
  lastSaveFailed,
  lock,
  set,
  unlock,
} from "@/lib/vault/store";
import { VAULT_KEYS, VAULT_LABELS } from "@/lib/vault/types";
import type { VaultKey } from "@/lib/vault/types";

const SAMPLE_SUBJECT = "Status update: case {{vault.caseNumber}}";
const SAMPLE_TEMPLATE = `Hello,

I'd like to ask for a status update on my case.

Thank you,
{{vault.legalName}}
Student ID: {{vault.studentId}}
{{vault.schoolEmail}}`;

const INPUT =
  "mt-1 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground";
const BUTTON =
  "inline-flex min-h-11 items-center rounded-lg px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-60";
const PRIMARY = `${BUTTON} bg-primary text-primary-contrast hover:bg-primary-hover`;
const SECONDARY = `${BUTTON} border border-primary text-foreground hover:bg-primary-soft`;
const CARD = "glass shadow-soft rounded-[var(--radius)] p-5 sm:p-6";

const NO_RECOVERY =
  "There’s no way to recover your passphrase. If you forget it, your saved details can’t be opened, and you’ll need to delete them and start again.";

function Field({ field, value }: { field: VaultKey; value: string }) {
  // Held here while typing, because the store trims values and would remove spaces mid-name.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="block">
      <span className="font-medium">{VAULT_LABELS[field]}</span>
      <input
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={draft ?? value}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft !== null) void set(field, draft);
          setDraft(null);
        }}
        className={INPUT}
      />
    </label>
  );
}

function StartSaving() {
  const [choice, setChoice] = useState<"session" | "saved">("session");
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!passphrase) return setError("Please choose a passphrase.");
    if (passphrase !== confirm) return setError("Those passphrases don’t match.");
    setError("");
    setIsWorking(true);
    const saved = await createSaved(passphrase);
    setIsWorking(false);
    if (!saved) setError("We couldn’t save on this device. Your details are still here for this session.");
  }

  const options = [
    {
      id: "session",
      label: "Just for now",
      body: "Kept in memory only. Gone when you close this tab, refresh, or use Quick Exit.",
    },
    {
      id: "saved",
      label: "Save on this device",
      body: "Encrypted and stored in this browser. You’ll need your passphrase to open it again.",
    },
  ] as const;

  return (
    <fieldset>
      <legend className="text-lg font-semibold">How should we keep your details?</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4 has-checked:border-primary has-checked:bg-primary-soft"
          >
            <input
              type="radio"
              name="vault-mode"
              checked={choice === option.id}
              onChange={() => setChoice(option.id)}
              className="mt-1 size-5 shrink-0 accent-primary"
            />
            <span>
              <span className="block font-medium">{option.label}</span>
              <span className="block text-sm text-muted">{option.body}</span>
            </span>
          </label>
        ))}
      </div>

      {choice === "saved" && (
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 max-w-md space-y-3">
          <p className="font-medium">{NO_RECOVERY}</p>
          <label className="block">
            <span className="font-medium">Choose a passphrase</span>
            <input
              type="password"
              autoComplete="off"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className="font-medium">Type it again</span>
            <input
              type="password"
              autoComplete="off"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={INPUT}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={isWorking} className={PRIMARY}>
            {isWorking ? "Saving…" : "Save on this device"}
          </button>
        </form>
      )}
    </fieldset>
  );
}

function UnlockForm() {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsWorking(true);
    const opened = await unlock(passphrase);
    setIsWorking(false);
    setPassphrase("");
    if (!opened) setError("That passphrase didn’t open your saved details. You can try again.");
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="max-w-md space-y-3">
      <h2 className="text-lg font-semibold">Your saved details are locked</h2>
      <p>While they’re locked, we can’t fill them in or keep them out of chat messages.</p>
      <label className="block">
        <span className="font-medium">Passphrase</span>
        <input
          type="password"
          autoComplete="off"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          className={INPUT}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isWorking || !passphrase} className={PRIMARY}>
        {isWorking ? "Opening…" : "Unlock"}
      </button>
    </form>
  );
}

function DeleteAll() {
  const [isConfirming, setIsConfirming] = useState(false);
  if (!isConfirming) {
    return (
      <button type="button" onClick={() => setIsConfirming(true)} className={SECONDARY}>
        Delete my details
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="font-medium">Delete everything from this device? This can’t be undone.</p>
      <button
        type="button"
        onClick={() => {
          deleteAll();
          setIsConfirming(false);
        }}
        className={PRIMARY}
      >
        Yes, delete
      </button>
      <button type="button" onClick={() => setIsConfirming(false)} className={SECONDARY}>
        Keep them
      </button>
    </div>
  );
}

export default function VaultPage() {
  const { values, locked, mode } = useVault();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">My details</h1>
        <p className="mt-3 max-w-3xl text-lg">
          Keep a few details here so you can fill them into drafts and forms, then copy and paste
          them yourself. They stay on this device and are never sent to our server or the AI.
        </p>
        <p className="mt-3 max-w-3xl">
          Nothing here is required. Please don’t add anything about what happened. Only you should
          write that.
        </p>
      </header>

      <section className={CARD} aria-label="How your details are kept">
        {locked ? (
          <UnlockForm />
        ) : mode === "saved" ? (
          <div>
            <h2 className="text-lg font-semibold">Saved on this device</h2>
            <p className="mt-1">
              Your details are encrypted in this browser. {NO_RECOVERY}
            </p>
            <button type="button" onClick={lock} className={`${PRIMARY} mt-3`}>
              Lock now
            </button>
          </div>
        ) : (
          <StartSaving />
        )}
      </section>

      {!locked && (
        <section className={CARD} aria-labelledby="fields-heading">
          <h2 id="fields-heading" className="text-lg font-semibold">
            Your details
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {VAULT_KEYS.map((field) => (
              <Field key={field} field={field} value={values[field] ?? ""} />
            ))}
          </div>
          {lastSaveFailed() && (
            <p role="alert" className="mt-3 font-medium">
              We couldn’t save your latest change on this device. It’s here until you close this tab.
            </p>
          )}
        </section>
      )}

      <section className={CARD} aria-labelledby="sample-heading">
        <h2 id="sample-heading" className="text-lg font-semibold">
          See how filling in works
        </h2>
        <p className="mt-1 mb-4">
          This sample email shows your details as labels until you approve filling them in.
        </p>
        <FilledDraft template={SAMPLE_TEMPLATE} subject={SAMPLE_SUBJECT} />
      </section>

      <section className={CARD} aria-labelledby="filing-heading">
        <h2 id="filing-heading" className="text-lg font-semibold">
          Filing help: {reportToOphd.title} (UC Berkeley)
        </h2>
        <p className="mt-1 mb-4">
          Copy your details one at a time and paste them in yourself. Nothing here fills in or
          submits a form, and using this doesn’t mean you have to report.
        </p>
        <FormAssist guide={reportToOphd} />
      </section>

      <section className={CARD} aria-label="Delete your details">
        <DeleteAll />
      </section>
    </div>
  );
}
