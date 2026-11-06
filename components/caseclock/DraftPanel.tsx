"use client";

import { useState } from "react";
import type { EmailTemplate } from "@/lib/caseclock/types";

const READABLE: Record<string, string> = {
  legalName: "your name",
  preferredName: "your preferred name",
  studentId: "your student ID",
  schoolEmail: "your school email",
  phone: "your phone",
  caseNumber: "your case number",
  investigatorName: "investigator's name",
};

/** Shows {{vault.key}} tokens as chips so it's clear what still needs filling in. */
function withTokenChips(text: string) {
  return text.split(/(\{\{vault\.\w+\}\})/g).map((part, i) => {
    const m = /^\{\{vault\.(\w+)\}\}$/.exec(part);
    if (!m) return part;
    return (
      <mark
        key={i}
        className="rounded-full bg-primary-soft px-2 py-0.5 font-sans text-[0.85em] font-medium text-foreground"
      >
        {READABLE[m[1]] ?? m[1]}
        <span className="sr-only"> (placeholder)</span>
      </mark>
    );
  });
}

type Props = { template: EmailTemplate; onClose: () => void };

/**
 * Temporary draft view (Phase 3): tokens stay unfilled and the user copies the text.
 * Phase 4 renders through the vault's FilledDraft instead. Nothing is ever sent from here.
 */
export default function DraftPanel({ template, onClose }: Props) {
  const [copyStatus, setCopyStatus] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(`Subject: ${template.subject}\n\n${template.body}`);
      setCopyStatus("Copied. Paste it into your email and fill in the highlighted parts.");
    } catch {
      setCopyStatus("We couldn't copy automatically. You can select the text and copy it yourself.");
    }
  }

  return (
    <section
      aria-labelledby="draft-heading"
      className="glass shadow-soft flex flex-col gap-4 rounded-[var(--radius)] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id="draft-heading" className="font-display text-xl font-semibold text-foreground">
            {template.title}
          </h3>
          <p className="text-sm text-muted">
            A draft for you to review, change, and send yourself. Nothing is sent from here.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-full border border-border bg-surface/70 px-4 py-1.5 text-sm font-medium hover:border-primary"
        >
          Close draft
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm text-muted">Subject</p>
        <p className="font-medium">{withTokenChips(template.subject)}</p>
        <p className="mt-3 whitespace-pre-wrap break-words">{withTokenChips(template.body)}</p>
      </div>

      <p className="text-sm text-muted">
        Highlighted words are placeholders for your details. They stay on your device. Replace
        them before you send.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void copy()}
          className="min-h-12 rounded-full bg-primary px-6 py-2 font-medium text-primary-contrast hover:bg-primary-hover"
        >
          Copy draft
        </button>
        <p role="status" className="text-sm text-muted">
          {copyStatus}
        </p>
      </div>
    </section>
  );
}
