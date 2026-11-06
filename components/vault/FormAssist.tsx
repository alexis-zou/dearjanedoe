"use client";

import { useState } from "react";
import type { FormField, FormGuide } from "@/data/forms/berkeley";
import { VAULT_LABELS, VAULT_PHRASES } from "@/lib/vault/types";
import type { VaultKey } from "@/lib/vault/types";
import { useVault } from "./VaultProvider";

const BUTTON = "inline-flex min-h-11 items-center rounded-lg px-4 py-2 font-medium";
const PRIMARY = `${BUTTON} bg-primary text-primary-contrast hover:bg-primary-hover`;
const SECONDARY = `${BUTTON} border border-primary text-foreground hover:bg-primary-soft`;

function hasVaultKey(field: FormField): field is Extract<FormField, { vaultKey: VaultKey }> {
  return "vaultKey" in field;
}

/** Copy-and-paste help for one form. Nothing is filled in or submitted on the form itself. */
export default function FormAssist({ guide }: { guide: FormGuide }) {
  const { values } = useVault();
  const [isApproving, setIsApproving] = useState(false);
  const [approved, setApproved] = useState<VaultKey[]>([]);
  const [copyStatus, setCopyStatus] = useState("");

  const available = guide.fields
    .filter(hasVaultKey)
    .map((field) => field.vaultKey)
    .filter((key) => values[key]);

  async function copy(field: FormField & { vaultKey: VaultKey }) {
    try {
      await navigator.clipboard.writeText(values[field.vaultKey] ?? "");
      setCopyStatus(`Copied ${field.label}.`);
    } catch {
      setCopyStatus("We couldn’t copy automatically. You can type this in yourself.");
    }
  }

  return (
    <div data-form-assist>
      <p className="rounded-lg bg-surface-muted p-3 font-medium">
        Field names may not match the live form exactly.
      </p>
      {!guide.labelsMatchLiveForm && (
        <p className="mt-3">
          These are the details you may want to have ready, listed by the names used on this page.
          They aren’t the form’s own fields.
        </p>
      )}

      <ul className="mt-4 divide-y divide-border">
        {guide.fields.map((field) => {
          const isApproved = hasVaultKey(field) && approved.includes(field.vaultKey);
          return (
            <li key={field.label} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span className="min-w-40 font-medium">{field.label}</span>
              {!hasVaultKey(field) ? (
                <span className="text-muted">Only you should write this.</span>
              ) : !values[field.vaultKey] ? (
                <span className="text-muted">Add {VAULT_PHRASES[field.vaultKey]} above</span>
              ) : isApproved ? (
                <>
                  <span className="break-all">{values[field.vaultKey]}</span>
                  <button
                    type="button"
                    aria-label={`Copy ${field.label}`}
                    onClick={() => void copy(field)}
                    className={`${SECONDARY} ml-auto`}
                  >
                    Copy
                  </button>
                </>
              ) : (
                <span className="text-muted">Ready to fill in</span>
              )}
            </li>
          );
        })}
      </ul>

      {isApproving ? (
        <div className="mt-4 rounded-lg bg-surface-muted p-4">
          <p className="font-medium">
            This will fill in: {available.map((key) => VAULT_LABELS[key]).join(", ")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setApproved(available);
                setIsApproving(false);
              }}
              className={PRIMARY}
            >
              Fill these in
            </button>
            <button type="button" onClick={() => setIsApproving(false)} className={SECONDARY}>
              Not now
            </button>
          </div>
        </div>
      ) : approved.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            setApproved([]);
            setCopyStatus("");
          }}
          className={`${SECONDARY} mt-4`}
        >
          Hide my details
        </button>
      ) : (
        available.length > 0 && (
          <button type="button" onClick={() => setIsApproving(true)} className={`${PRIMARY} mt-4`}>
            Fill in my details
          </button>
        )
      )}

      <p role="status" className="mt-2 text-sm text-muted">
        {copyStatus}
      </p>
    </div>
  );
}
