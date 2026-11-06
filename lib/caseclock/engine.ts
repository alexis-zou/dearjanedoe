import { businessDaysBetween } from "./businessDays.ts";
import type { StatusResult, TimelineRule } from "./types.ts";

/** A user deadline this close (in business days) is flagged. */
export const DEADLINE_SOON_DAYS = 2;

/**
 * Where a stage stands today against the school's own published timeframe.
 *
 * window:        < min → on-track · min–max → in-window · > max → past-window,
 *                or extended when the school sent written notice of an extension
 * recurring:     ≥ everyDays since the last update → update-available, else on-track
 * user-deadline: ≤ 2 business days left (including after it passes) → deadline-soon
 */
export function status(
  rule: TimelineRule,
  startDate: string,
  today: string,
  extensionNoticed = false,
): StatusResult {
  const elapsed = Math.max(0, businessDaysBetween(startDate, today));

  switch (rule.kind) {
    case "window": {
      const min = rule.minDays ?? 0;
      const max = rule.maxDays ?? Infinity;
      if (elapsed < min) return { status: "on-track", elapsed };
      if (elapsed <= max) return { status: "in-window", elapsed };
      return { status: extensionNoticed ? "extended" : "past-window", elapsed };
    }
    case "recurring": {
      const every = rule.everyDays ?? Infinity;
      return { status: elapsed >= every ? "update-available" : "on-track", elapsed };
    }
    case "user-deadline": {
      const remaining = (rule.deadlineDays ?? 0) - elapsed;
      return {
        status: remaining <= DEADLINE_SOON_DAYS ? "deadline-soon" : "on-track",
        elapsed,
        remaining,
      };
    }
  }
}

/** Statuses that get the "Delays aren't your fault" reassurance. */
export function isOverdue(s: StatusResult["status"]): boolean {
  return s === "past-window" || s === "update-available";
}
