import type { Hotline } from "@/lib/types";

/**
 * Crisis lines shown in Section 1 (/crisis) and in the "Get Help Now" sheet.
 *
 * Each entry is ONE channel (call OR text) so the page can group "Text lines"
 * vs "Call lines". Organizations that offer both appear twice.
 *
 * Extends the shared `Hotline` contract (lib/types.ts) with B-local fields only;
 * every entry is still a valid `Hotline`.
 *
 * ⚠️ VERIFY EVERY NUMBER AGAINST ITS `url` BEFORE THE DEMO.
 * Verified 2026-11-06 against each org's official site (RAINN, 988, Crisis Text
 * Line, NDVH, love is respect, Trevor Project, Trans Lifeline).
 */
export interface HotlineEntry extends Hotline {
  /** Stable React key. */
  id: string;
  /** Organization website. */
  url?: string;
  /** Shown in the Get Help Now sheet (988, Crisis Text Line, RAINN). */
  featured?: boolean;
  /** Override for how the number is shown, when the org styles it unusually. */
  display?: string;
}

export const hotlines: HotlineEntry[] = [
  // ---------- Call lines ----------
  {
    id: "rainn-call",
    name: "RAINN National Sexual Assault Hotline",
    description:
      "Free, confidential support from a trained staff member at a local sexual assault service provider.",
    kind: "call",
    contact: "+18006564673",
    available: "24/7",
    url: "https://rainn.org/help-and-healing/hotline/",
    featured: true,
  },
  {
    id: "988-call",
    name: "988 Suicide & Crisis Lifeline",
    description:
      "If you're thinking about suicide or are in emotional distress, call to talk with a trained counselor.",
    kind: "call",
    contact: "988",
    available: "24/7",
    url: "https://988lifeline.org",
    featured: true,
  },
  {
    id: "ndvh-call",
    name: "National Domestic Violence Hotline",
    description:
      "Support, safety planning, and resources for anyone affected by relationship abuse.",
    kind: "call",
    contact: "+18007997233",
    available: "24/7",
    url: "https://www.thehotline.org",
  },
  {
    id: "loveisrespect-call",
    name: "love is respect",
    description:
      "Support for young people with questions or concerns about dating relationships.",
    kind: "call",
    contact: "+18663319474",
    available: "24/7",
    url: "https://www.loveisrespect.org",
  },
  {
    id: "trevor-call",
    name: "The Trevor Project",
    description: "Crisis support for LGBTQ+ young people.",
    kind: "call",
    contact: "+18664887386",
    available: "24/7",
    url: "https://www.thetrevorproject.org",
  },
  {
    id: "translifeline-call",
    name: "Trans Lifeline",
    description: "Peer support run by and for trans people.",
    kind: "call",
    contact: "+18775658860",
    // NOT 24/7 — verified at translifeline.org/hotline/ on 2026-11-06.
    available: "Mon–Fri, 1–9 PM Eastern (10 AM–6 PM Pacific)",
    url: "https://translifeline.org/hotline/",
  },

  // ---------- Text lines ----------
  {
    id: "rainn-text",
    name: "RAINN National Sexual Assault Hotline (text)",
    description:
      "Text with a trained staff member for free, confidential sexual assault support.",
    kind: "text",
    contact: "64673",
    smsBody: "HOPE",
    available: "24/7",
    url: "https://rainn.org/help-and-healing/hotline/",
  },
  {
    id: "ctl-text",
    name: "Crisis Text Line",
    description: "Text with a trained crisis counselor about anything you're going through.",
    kind: "text",
    contact: "741741",
    smsBody: "HOME",
    available: "24/7",
    url: "https://www.crisistextline.org",
    featured: true,
  },
  {
    id: "988-text",
    name: "988 Suicide & Crisis Lifeline (text)",
    description: "Text with a trained counselor if you're in emotional distress.",
    kind: "text",
    contact: "988",
    available: "24/7",
    url: "https://988lifeline.org",
  },
  {
    id: "ndvh-text",
    name: "National Domestic Violence Hotline (text)",
    description: "Text support and safety planning for relationship abuse.",
    kind: "text",
    contact: "88788",
    smsBody: "START",
    available: "24/7",
    url: "https://www.thehotline.org",
  },
  {
    id: "loveisrespect-text",
    name: "love is respect (text)",
    description: "Text with an advocate about dating relationships.",
    kind: "text",
    contact: "22522",
    smsBody: "LOVEIS",
    available: "24/7",
    url: "https://www.loveisrespect.org",
  },
  {
    id: "trevor-text",
    name: "The Trevor Project (text)",
    description: "Text crisis support for LGBTQ+ young people.",
    kind: "text",
    contact: "678678",
    display: "678-678",
    smsBody: "START",
    available: "24/7",
    url: "https://www.thetrevorproject.org",
  },
];

export const callLines = hotlines.filter((h) => h.kind === "call");
export const textLines = hotlines.filter((h) => h.kind === "text");

/** Top lines for the "Get Help Now" sheet: RAINN, 988, Crisis Text Line. */
export const featuredHotlines = hotlines.filter((h) => h.featured);

/** "+18006564673" -> "800-656-4673"; short codes are returned unchanged. */
export function formatContact(contact: string): string {
  const digits = contact.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return contact;
}

/** Builds the one-tap tel:/sms: href for a hotline. */
export function hotlineHref(h: Hotline): string {
  if (h.kind === "call") return `tel:${h.contact}`;
  // `?&body=` is the form that pre-fills the message on both iOS and Android.
  return h.smsBody
    ? `sms:${h.contact}?&body=${encodeURIComponent(h.smsBody)}`
    : `sms:${h.contact}`;
}

/** Human-readable action, e.g. "Call 988" or "Text HOME to 741741". */
export function hotlineActionLabel(h: Hotline & { display?: string }): string {
  const shown = h.display ?? formatContact(h.contact);
  if (h.kind === "call") return `Call ${shown}`;
  return h.smsBody ? `Text ${h.smsBody} to ${shown}` : `Text ${shown}`;
}
