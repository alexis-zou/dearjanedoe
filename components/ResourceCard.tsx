import type { Hotline } from "@/lib/types";
import { hotlineActionLabel, hotlineHref } from "@/data/hotlines";

type Props = {
  hotline: Hotline & { url?: string };
  /** Compact variant used inside the Get Help Now sheet. */
  compact?: boolean;
};

export default function ResourceCard({ hotline, compact = false }: Props) {
  const action = hotlineActionLabel(hotline);

  return (
    <article
      className={`h-full rounded-[var(--radius)] border border-border bg-surface shadow-sm ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <h3 className="text-lg font-semibold text-foreground">{hotline.name}</h3>
      {!compact && (
        <p className="mt-1 leading-relaxed text-muted">{hotline.description}</p>
      )}
      {hotline.available && (
        <p className="mt-1 text-sm text-muted">Available {hotline.available}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <a
          href={hotlineHref(hotline)}
          aria-label={`${action}, ${hotline.name}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2 font-semibold text-primary-contrast hover:bg-primary-hover"
        >
          <span aria-hidden="true">{hotline.kind === "call" ? "📞" : "💬"}</span>
          {action}
        </a>
        {hotline.url && !compact && (
          <a
            href={hotline.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary-hover"
          >
            Website<span className="sr-only"> for {hotline.name} (opens in new tab)</span>
          </a>
        )}
      </div>
    </article>
  );
}
