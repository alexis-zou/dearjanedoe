"use client";

import type { ReactNode } from "react";
import FilledDraft from "@/components/vault/FilledDraft";
import type { EmailTemplate } from "@/lib/caseclock/types";

type Props = { template: EmailTemplate; onClose: () => void; footer?: ReactNode };

/**
 * A Case Clock email draft. FilledDraft (from the vault) shows the placeholders, asks
 * before filling in the user's details on this device, and handles Copy / Open in email.
 * Nothing is ever sent from here.
 */
export default function DraftPanel({ template, onClose, footer }: Props) {
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
            Review it, change anything you like, and send it yourself. Nothing is sent from here.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-full border border-border bg-surface/70 px-4 py-1.5 text-sm font-medium hover:border-primary"
        >
          Close
        </button>
      </div>

      {/* key: a new draft starts fresh, so an earlier approval never carries over. */}
      <FilledDraft key={template.id + template.body} template={template.body} subject={template.subject} />

      {footer}
    </section>
  );
}
