import type { LegalAidEntry } from "@/data/legalAid";

/** Turns a US number as displayed, like "(617) 399-6720", into +16173996720. */
function toE164(displayNumber: string): string {
  return `+1${displayNumber.replace(/\D/g, "")}`;
}

const linkClass =
  "inline-flex min-h-11 items-center rounded-lg border border-primary px-3 py-2 text-sm font-medium text-foreground hover:bg-primary-soft";

export default function LegalAidCard({ org }: { org: LegalAidEntry }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-lg font-semibold">{org.name}</h3>
      <p className="mt-1 text-sm font-medium text-primary">{org.coverage}</p>
      <p className="mt-3 flex-1">{org.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {/*
          Opens in this tab on purpose. Quick-exit can only replace the current
          tab, so a legal-aid site left open in a new tab would stay on screen.
        */}
        <a
          href={org.url}
          className={linkClass}
          aria-label={`Visit the ${org.name} website (leaves this site)`}
        >
          Visit website
        </a>
        {org.phone && (
          <a
            href={`tel:${toE164(org.phone)}`}
            className={linkClass}
            aria-label={`Call ${org.name} at ${org.phone}`}
          >
            Call {org.phone}
          </a>
        )}
        {org.textNumber && (
          <a
            href={`sms:${toE164(org.textNumber)}`}
            className={linkClass}
            aria-label={`Text ${org.name} at ${org.textNumber}`}
          >
            Text {org.textNumber}
          </a>
        )}
      </div>
    </article>
  );
}
