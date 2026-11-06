// Crisis detection for the chat route (Agent A, AI core).
// Defense-in-depth: the system prompt already makes crisis handling rule #1; when the
// latest user message matches these patterns the route appends a non-cached reinforcement
// system block so the safety behavior is anchored even if the model under-reacts.
// Kept in its own module so it is unit-testable in isolation.

export const CRISIS_PATTERNS: RegExp[] = [
  /\bkill(ing)? myself\b/i,
  /\bend (my life|it all|my life)\b/i,
  /\bsuicid/i,
  /\bself[-\s]?harm/i,
  /\bhurt(ing)? myself\b/i,
  /\bwant to die\b/i,
  /\bdon'?t want to (be alive|live)\b/i,
  /\bno reason to (live|go on)\b/i,
  /\bin (immediate |serious )?danger\b/i,
  /\b(he|she|they)('s| is| are)? going to (kill|hurt|attack)\b/i,
  /\bbeing (followed|stalked|threatened)\b/i,
  /\b(he|she|they)('s| is| are) (here|outside)( right)? now\b/i,
];

export const CRISIS_REINFORCEMENT =
  "SAFETY OVERRIDE: The user's latest message may indicate crisis, self-harm, or " +
  "immediate danger. Before anything else, respond with warmth and these resources: " +
  "call 911 if in immediate danger; 988 Suicide & Crisis Lifeline (call or text 988); " +
  "Crisis Text Line (text HOME to 741741); RAINN 800-656-4673. Encourage reaching a " +
  "real person now. Do not lead with legal/process information.";

export function looksLikeCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}
