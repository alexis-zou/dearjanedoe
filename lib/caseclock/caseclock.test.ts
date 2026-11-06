import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FEDERAL_HOLIDAYS,
  addBusinessDays,
  businessDaysBetween,
  isBusinessDay,
  isIsoDate,
  subtractBusinessDays,
} from "./businessDays.ts";
import { status } from "./engine.ts";
import { rungState, suggestNext } from "./ladder.ts";
import type { LadderRung, TimelineRule } from "./types.ts";

const INVEST: TimelineRule = {
  id: "invest",
  kind: "window",
  label: "Investigation",
  startsFrom: "written notice of the charges",
  minDays: 60,
  maxDays: 90,
  summary: "",
  cite: "",
  verified: true,
};
const STATUS: TimelineRule = {
  id: "status",
  kind: "recurring",
  label: "Status updates",
  startsFrom: "the last update",
  everyDays: 30,
  summary: "",
  cite: "",
  verified: true,
};
const APPEAL: TimelineRule = {
  id: "dismissal-appeal",
  kind: "user-deadline",
  label: "Appeal",
  startsFrom: "notice of dismissal",
  deadlineDays: 5,
  summary: "",
  cite: "",
  verified: true,
};

const START = "2026-01-05"; // a Monday
const day = (n: number) => addBusinessDays(START, n);

// ---------- business days ----------

test("every listed federal holiday is a weekday", () => {
  for (const iso of FEDERAL_HOLIDAYS) {
    const wd = new Date(`${iso}T00:00:00Z`).getUTCDay();
    assert.ok(wd >= 1 && wd <= 5, `${iso} falls on a weekend`);
  }
});

test("weekends are skipped and the start day doesn't count", () => {
  assert.equal(businessDaysBetween("2026-01-09", "2026-01-12"), 1); // Fri -> Mon
  assert.equal(businessDaysBetween("2026-01-12", "2026-01-12"), 0);
  assert.equal(businessDaysBetween("2026-01-05", "2026-01-16"), 9);
});

test("a holiday inside the range is skipped", () => {
  // Fri Nov 20 -> Mon Nov 30, 2026: Thanksgiving (Thu Nov 26) doesn't count.
  assert.equal(isBusinessDay("2026-11-26"), false);
  assert.equal(businessDaysBetween("2026-11-20", "2026-11-30"), 5);
  assert.equal(addBusinessDays("2026-11-25", 1), "2026-11-27");
});

test("add and subtract are inverses, and between agrees with them", () => {
  for (const n of [1, 5, 30, 61, 94]) {
    assert.equal(businessDaysBetween(START, addBusinessDays(START, n)), n);
    assert.equal(businessDaysBetween(subtractBusinessDays("2026-11-06", n), "2026-11-06"), n);
  }
});

test("isIsoDate rejects impossible dates", () => {
  assert.equal(isIsoDate("2026-02-28"), true);
  assert.equal(isIsoDate("2026-02-30"), false);
  assert.equal(isIsoDate("02/03/2026"), false);
});

// ---------- engine ----------

test("investigation: day 30 is on track", () => {
  assert.deepEqual(status(INVEST, START, day(30)), { status: "on-track", elapsed: 30 });
});

test("investigation: day 61 is inside the usual window", () => {
  assert.equal(status(INVEST, START, day(61)).status, "in-window");
  assert.equal(status(INVEST, START, day(60)).status, "in-window");
  assert.equal(status(INVEST, START, day(90)).status, "in-window");
});

test("investigation: day 91 is past the window", () => {
  assert.equal(status(INVEST, START, day(91)).status, "past-window");
});

test("investigation: day 91 with an extension notice is extended", () => {
  assert.equal(status(INVEST, START, day(91), true).status, "extended");
});

test("status update: 30 business days since the last update is available", () => {
  assert.equal(status(STATUS, START, day(29)).status, "on-track");
  assert.equal(status(STATUS, START, day(30)).status, "update-available");
});

test("appeal: deadline-soon within 2 business days, and after it passes", () => {
  assert.equal(status(APPEAL, START, day(2)).status, "on-track");
  const soon = status(APPEAL, START, day(3));
  assert.equal(soon.status, "deadline-soon");
  assert.equal(soon.remaining, 2);
  assert.equal(status(APPEAL, START, day(6)).remaining, -1);
});

// ---------- ladder ----------

const RUNGS: LadderRung[] = [
  { id: "s1", track: "school", office: "Case contact", description: "" },
  { id: "s2", track: "school", office: "Title IX Officer", description: "" },
  { id: "p1", track: "police", office: "Detective", description: "" },
  { id: "p2", track: "police", office: "Supervisor", description: "" },
];

test("ladder: 4 business days without a reply is still waiting", () => {
  const contacts = { p1: { contactedOn: START } };
  assert.deepEqual(rungState(contacts.p1, day(4)), { state: "waiting", contactedOn: START, days: 4 });
  assert.equal(suggestNext(RUNGS, "police", contacts, day(4)), null);
});

test("ladder: 5 business days without a reply suggests the next rung", () => {
  const contacts = { p1: { contactedOn: START } };
  assert.equal(rungState(contacts.p1, day(5)).state, "no-reply");
  assert.equal(suggestNext(RUNGS, "police", contacts, day(5))?.id, "p2");
  assert.equal(suggestNext(RUNGS, "school", contacts, day(5)), null);
});

test("ladder: a reply stops the suggestion", () => {
  const contacts = { s1: { contactedOn: START, replied: true } };
  assert.equal(rungState(contacts.s1, day(20)).state, "replied");
  assert.equal(suggestNext(RUNGS, "school", contacts, day(20)), null);
});
