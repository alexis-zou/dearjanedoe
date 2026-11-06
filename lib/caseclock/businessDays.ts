// Business-day math on plain "YYYY-MM-DD" strings. Everything runs in UTC so a user's
// time zone or daylight-saving change can never shift a date by one.

/**
 * US federal holidays (observed dates), 2026–2027. UC campus holidays differ slightly
 * (for example, the day after Thanksgiving and the winter closure), so counts here can
 * run a day or two ahead of the school's own count. The page says so.
 */
export const FEDERAL_HOLIDAYS: ReadonlySet<string> = new Set([
  // 2026
  "2026-01-01", "2026-01-19", "2026-02-16", "2026-05-25", "2026-06-19", "2026-07-03",
  "2026-09-07", "2026-10-12", "2026-11-11", "2026-11-26", "2026-12-25",
  // 2027
  "2027-01-01", "2027-01-18", "2027-02-15", "2027-05-31", "2027-06-18", "2027-07-05",
  "2027-09-06", "2027-10-11", "2027-11-11", "2027-11-25", "2027-12-24", "2027-12-31",
]);

/** Years the holiday list covers. Outside them, only weekends are skipped. */
export const HOLIDAY_YEARS = [2026, 2027] as const;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function isIsoDate(value: string): boolean {
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return toIso(d) === value; // rejects 2026-02-30 and similar
}

function parse(iso: string): Date {
  if (!isIsoDate(iso)) throw new Error(`Not a valid date: ${iso}`);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Today's calendar date where the user is, as "YYYY-MM-DD". */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isBusinessDay(iso: string): boolean {
  const day = parse(iso).getUTCDay();
  return day !== 0 && day !== 6 && !FEDERAL_HOLIDAYS.has(iso);
}

/**
 * Business days after `start`, up to and including `end`. The start day itself doesn't
 * count, matching how "within N business days of notice" is usually read. Returns a
 * negative count when `end` is before `start`.
 */
export function businessDaysBetween(start: string, end: string): number {
  const a = parse(start).getTime();
  const b = parse(end).getTime();
  if (b < a) return -businessDaysBetween(end, start);
  let count = 0;
  for (let t = a + DAY_MS; t <= b; t += DAY_MS) {
    if (isBusinessDay(toIso(new Date(t)))) count++;
  }
  return count;
}

/** The date `n` business days after `start` (n ≥ 0). */
export function addBusinessDays(start: string, n: number): string {
  let t = parse(start).getTime();
  let left = n;
  while (left > 0) {
    t += DAY_MS;
    if (isBusinessDay(toIso(new Date(t)))) left--;
  }
  return toIso(new Date(t));
}

/** The date `n` business days before `end` (n ≥ 0). Used by the demo seed. */
export function subtractBusinessDays(end: string, n: number): string {
  let t = parse(end).getTime();
  let left = n;
  while (left > 0) {
    t -= DAY_MS;
    if (isBusinessDay(toIso(new Date(t)))) left--;
  }
  return toIso(new Date(t));
}

/** True when the range touches a year the holiday list doesn't cover. */
export function outsideHolidayYears(start: string, end: string): boolean {
  const years = [Number(start.slice(0, 4)), Number(end.slice(0, 4))];
  return years.some((y) => !(HOLIDAY_YEARS as readonly number[]).includes(y));
}

/** "2026-11-06" -> "November 6, 2026". */
export function formatDate(iso: string): string {
  return parse(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
