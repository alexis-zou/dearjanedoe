import { formatDate } from "./businessDays.ts";
import type { EmailTemplate, SchoolTimeline } from "./types.ts";

/**
 * Email drafts the user copies and sends themselves. Personal details appear only as
 * {{vault.<key>}} tokens, filled in on the user's device. Dates come from Case Clock
 * state (dates only). Wording stays procedural: what the policy says, how long it's
 * been, and what the user is asking for.
 */

const SIGN_OFF = "Thank you,\n{{vault.legalName}}\nCase: {{vault.caseNumber}}";

export interface TemplateContext {
  timeline: SchoolTimeline;
  startDate: string;
  elapsed: number;
  lastUpdateDate?: string;
  /** For follow-ups: who was contacted and when. */
  office?: string;
  contactedOn?: string;
}

function rule(ctx: TemplateContext, id: string) {
  const r = ctx.timeline.rules.find((x) => x.id === id);
  if (!r) throw new Error(`Missing rule ${id}`);
  return r;
}

export function statusRequest(ctx: TemplateContext): EmailTemplate {
  const r = rule(ctx, "status");
  const since = ctx.lastUpdateDate ?? ctx.startDate;
  return {
    id: "status-request",
    title: "Ask for a status update",
    subject: "Request for a status update — Case: {{vault.caseNumber}}",
    body: [
      "Dear {{vault.investigatorName}},",
      "",
      `I'm writing to ask for a status update on my case. ${r.cite} says the Title IX Officer will "${r.quote}."`,
      "",
      `${ctx.lastUpdateDate ? `My last update was on ${formatDate(since)}` : `I haven't had a status update since the investigation started on ${formatDate(since)}`}. Could you share where the investigation stands and what the next steps are?`,
      "",
      SIGN_OFF,
    ].join("\n"),
  };
}

export function timelineRequest(
  ctx: TemplateContext,
  ruleId: "invest" | "altres" = "invest",
): EmailTemplate {
  const r = rule(ctx, ruleId);
  const noun = ruleId === "altres" ? "the Alternative Resolution process" : "the investigation";
  return {
    id: "timeline-request",
    title: "Ask about the timeline",
    subject: "Question about my case timeline — Case: {{vault.caseNumber}}",
    body: [
      "Dear {{vault.investigatorName}},",
      "",
      `I'm writing about the timeline for my case. ${r.cite} says ${noun} is completed "${r.quote}," and that if it's extended, the parties are told in writing the reason and the projected new timeline.`,
      "",
      `I received ${r.startsFrom} on ${formatDate(ctx.startDate)}, which is ${ctx.elapsed} business days ago. I haven't received a notice of extension.`,
      "",
      "Could you tell me the reason for the delay and the projected new timeline in writing?",
      "",
      SIGN_OFF,
    ].join("\n"),
  };
}

export function followUp(ctx: TemplateContext): EmailTemplate {
  const when = ctx.contactedOn ? ` on ${formatDate(ctx.contactedOn)}` : "";
  return {
    id: "follow-up",
    title: "Gentle follow-up",
    subject: "Following up — Case: {{vault.caseNumber}}",
    body: [
      "Hello,",
      "",
      `I'm following up on my message${when}${ctx.office ? ` to ${ctx.office}` : ""} about my case. I haven't received a reply yet.`,
      "",
      "Could you let me know when I can expect a response, or who else I can contact about this?",
      "",
      SIGN_OFF,
    ].join("\n"),
  };
}

/** Every {{vault.<key>}} token a template uses, in order of first appearance. */
export function vaultTokens(text: string): string[] {
  return [...new Set([...text.matchAll(/\{\{vault\.(\w+)\}\}/g)].map((m) => m[1]))];
}
