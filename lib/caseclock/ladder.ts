import { businessDaysBetween } from "./businessDays.ts";
import type { LadderRung, LadderTrack, RungContact } from "./types.ts";

/** Business days without a reply before a rung shows "No reply yet". */
export const NO_REPLY_AFTER_DAYS = 5;

export type RungState =
  | { state: "not-contacted" }
  | { state: "replied"; contactedOn: string }
  | { state: "waiting"; contactedOn: string; days: number }
  | { state: "no-reply"; contactedOn: string; days: number };

export function rungState(contact: RungContact | undefined, today: string): RungState {
  if (!contact) return { state: "not-contacted" };
  if (contact.replied) return { state: "replied", contactedOn: contact.contactedOn };
  const days = Math.max(0, businessDaysBetween(contact.contactedOn, today));
  return days >= NO_REPLY_AFTER_DAYS
    ? { state: "no-reply", contactedOn: contact.contactedOn, days }
    : { state: "waiting", contactedOn: contact.contactedOn, days };
}

/**
 * The rung to suggest next on a track: the one after the highest rung that has gone
 * 5 business days without a reply. null when nothing is overdue or it's the last rung.
 * Any rung can still be opened at any time; this is only a suggestion.
 */
export function suggestNext(
  rungs: LadderRung[],
  track: LadderTrack,
  contacts: Record<string, RungContact>,
  today: string,
): LadderRung | null {
  const onTrack = rungs.filter((r) => r.track === track);
  for (let i = onTrack.length - 1; i >= 0; i--) {
    const s = rungState(contacts[onTrack[i].id], today);
    if (s.state === "no-reply") {
      const next = onTrack[i + 1];
      return next && !contacts[next.id] ? next : null;
    }
    if (s.state !== "not-contacted") return null; // waiting or replied: nothing to suggest
  }
  return null;
}
