"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import ResourceCard from "@/components/ResourceCard";
import { featuredHotlines } from "@/data/hotlines";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Modal with the top crisis lines. Uses native <dialog> + showModal() so we get
 * focus trapping, Esc-to-close, and an inert background for free.
 */
export default function CrisisSheet({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click on the backdrop (the dialog element itself, outside the panel) closes it.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="crisis-sheet-title"
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-[var(--radius)] bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="crisis-sheet-title" className="text-2xl font-bold">
            You can talk to someone right now
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-2xl text-muted hover:bg-surface-muted"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <p className="mt-2 leading-relaxed text-muted">
          These lines are free and confidential. If you are in immediate danger, call{" "}
          <a href="tel:911" className="font-semibold text-danger underline">
            911
          </a>
          .
        </p>

        <ul className="mt-4 space-y-3">
          {featuredHotlines.map((h) => (
            <li key={h.id}>
              <ResourceCard hotline={h} compact />
            </li>
          ))}
        </ul>

        <Link
          href="/crisis"
          onClick={onClose}
          className="mt-4 inline-block text-primary underline underline-offset-2 hover:text-primary-hover"
        >
          See all crisis and support lines
        </Link>
      </div>
    </dialog>
  );
}
