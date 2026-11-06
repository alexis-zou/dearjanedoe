import type { SchoolTimeline } from "../../lib/caseclock/types.ts";

/**
 * UC Berkeley follows the systemwide UC Sexual Violence and Sexual Harassment (SVSH)
 * Interim Policy, effective January 1, 2026 (issued December 22, 2025). Each rule below
 * was checked word-for-word against that PDF (UC-SVSH-Interim-Policy-2026.pdf in the repo
 * root, from https://policy.ucop.edu/doc/4000385/SVSH) on November 6, 2026.
 */
export const berkeleyTimeline: SchoolTimeline = {
  school: "berkeley",
  schoolName: "UC Berkeley",
  officeName: "OPHD",
  policyName: "UC SVSH Interim Policy (effective January 1, 2026)",
  policyUrl: "https://policy.ucop.edu/doc/4000385/SVSH",
  rules: [
    {
      id: "invest",
      kind: "window",
      label: "Investigation",
      startsFrom: "the written notice of the charges",
      minDays: 60,
      maxDays: 90,
      summary:
        "The Title IX Officer completes the investigation, typically within 60 to 90 business days. They can extend it for good cause, and if they do, they tell both parties in writing why and give a new projected timeline.",
      cite: "UC SVSH Policy §V.A.5.b.i",
      quote:
        "typically within 60 to 90 business days of notifying the parties in writing of the charges",
      verified: true,
    },
    {
      id: "status",
      kind: "recurring",
      label: "Status updates",
      startsFrom: "the start of the investigation or the last update",
      everyDays: 30,
      summary:
        "The Title IX Officer updates the parties on the investigation when either party asks, and every 30 business days until the outcome, unless a party opts out in writing.",
      cite: "UC SVSH Policy §V.A.5.b",
      quote:
        "update parties on the status of the investigation at the request of a Complainant or a Respondent and every 30 business days until the outcome of the complaint",
      verified: true,
    },
    {
      id: "altres",
      kind: "window",
      label: "Alternative Resolution",
      startsFrom: "the written notice that Alternative Resolution started",
      minDays: 30,
      maxDays: 60,
      summary:
        "The Title IX Officer completes Alternative Resolution, typically within 30 to 60 business days. They can extend it for good cause, and if they do, they tell both parties in writing why and give a new projected timeline.",
      cite: "UC SVSH Policy §V.A.5.a",
      quote:
        "typically within 30 to 60 business days of notifying the parties in writing of starting the process",
      verified: true,
    },
    {
      id: "dismissal-appeal",
      kind: "user-deadline",
      label: "Appeal of a dismissal",
      startsFrom: "the notice of dismissal",
      deadlineDays: 5,
      summary:
        "When allegations in a federal (DOE) Formal Complaint are dismissed, either party can appeal. The appeal goes to the appeal officer named in the notice, within five business days after the notice of dismissal.",
      cite: "UC SVSH Policy, Appendix IV §C.4",
      quote:
        "An appeal must be submitted to the appeal officer within five business days after notice of dismissal.",
      verified: true,
    },
  ],
};
