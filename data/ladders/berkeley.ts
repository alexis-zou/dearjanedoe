import type { LadderRung } from "../../lib/caseclock/types.ts";

/**
 * Who to contact next when an office doesn't reply, in order. Contacts stay undefined
 * until someone confirms them on the school's own site, so the page shows
 * "Find contact on the school's site" instead of guessing.
 */
export const berkeleyLadder: LadderRung[] = [
  {
    id: "ophd-contact",
    track: "school",
    office: "Your case contact at OPHD",
    description: "The person at OPHD handling your case, if one was assigned.",
  },
  {
    id: "ophd-titleix",
    track: "school",
    office: "Title IX Officer (OPHD)",
    description: "Oversees OPHD's process and its timelines.",
  },
  {
    id: "path-to-care",
    track: "school",
    office: "PATH to Care Center",
    description: "Confidential advocates. They can contact OPHD for you.",
    advocate: true,
  },
  {
    id: "ucpd-detective",
    track: "police",
    office: "UCPD detective on your report",
    description: "The detective assigned to your police report.",
  },
  {
    id: "ucpd-supervisor",
    track: "police",
    office: "UCPD supervisor",
    description: "The detective's supervisor at UC Police Department.",
  },
  {
    id: "alameda-da-vw",
    track: "police",
    office: "Alameda County DA Victim-Witness Assistance",
    description: "Advocates for people whose cases are with police or prosecutors.",
    advocate: true,
  },
];
