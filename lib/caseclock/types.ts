// Case Clock types. State holds dates, stages, and office names only: never names, IDs,
// or anything about what happened. Personal details appear only as {{vault.<key>}} tokens
// inside email templates, filled in on the user's device.

export type CaseSchool = "berkeley";

export type ProcessId = "investigation" | "alternative-resolution" | "dismissal";

export type RuleId = "invest" | "status" | "altres" | "dismissal-appeal";

/**
 * window:        the school's own timeframe (min–max business days from a start date)
 * recurring:     something the school does every N business days (status updates)
 * user-deadline: a deadline that applies to the user (an appeal window)
 */
export type RuleKind = "window" | "recurring" | "user-deadline";

export interface TimelineRule {
  id: RuleId;
  kind: RuleKind;
  /** Short name for the stage, e.g. "Investigation". */
  label: string;
  /** What starts the clock, phrased to finish "Counted from …". */
  startsFrom: string;
  /** window: usual minimum / maximum, in business days. */
  minDays?: number;
  maxDays?: number;
  /** recurring: how often, in business days. */
  everyDays?: number;
  /** user-deadline: how long the user has, in business days. */
  deadlineDays?: number;
  /** Plain-language summary of the rule, for the timeline. */
  summary: string;
  /** Where in the policy this comes from. */
  cite: string;
  /** Exact policy wording, when quoted. */
  quote?: string;
  /** True only once checked word-for-word against the policy text. */
  verified: boolean;
}

export interface SchoolTimeline {
  school: CaseSchool;
  schoolName: string;
  officeName: string;
  policyName: string;
  policyUrl: string;
  rules: TimelineRule[];
}

export type StageStatus =
  | "on-track"
  | "in-window"
  | "past-window"
  | "extended"
  | "update-available"
  | "deadline-soon";

export interface StatusResult {
  status: StageStatus;
  /** Business days since the start date. */
  elapsed: number;
  /** user-deadline only: business days left (negative once it has passed). */
  remaining?: number;
}

export type LadderTrack = "school" | "police";

export interface LadderRung {
  id: string;
  track: LadderTrack;
  /** Office or role, never a person's name. */
  office: string;
  description: string;
  /** Can contact the office on the user's behalf. */
  advocate?: boolean;
  /** Left undefined until someone confirms it on the school's site. */
  contact?: string;
}

export interface RungContact {
  /** When the user reached out, "YYYY-MM-DD". */
  contactedOn: string;
  replied?: boolean;
}

export interface CaseClockState {
  school: CaseSchool;
  process: ProcessId;
  /** The date that starts the main clock for the chosen process. */
  startDate: string;
  /** investigation: last status update received (defaults to startDate). */
  lastUpdateDate?: string;
  /** The school sent written notice of an extension with a new timeline. */
  extensionNoticed: boolean;
  /** Shows the police track of the escalation ladder. */
  policeReport: boolean;
  /** Ladder progress, keyed by rung id. */
  contacts: Record<string, RungContact>;
}

export interface EmailTemplate {
  id: "status-request" | "timeline-request" | "follow-up";
  title: string;
  subject: string;
  body: string;
}
