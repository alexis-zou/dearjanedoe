"use client";

import { useState } from "react";
import CrisisSheet from "@/components/CrisisSheet";

export default function GetHelpNowButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex min-h-11 items-center rounded-full bg-danger px-4 py-2 font-semibold text-danger-contrast hover:bg-danger-hover"
      >
        Get help now
      </button>
      <CrisisSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
