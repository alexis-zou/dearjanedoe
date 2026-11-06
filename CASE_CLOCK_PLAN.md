# CASE_CLOCK_PLAN.md — Case Clock

> **Owner:** one person, working through the phases below in order. **Filing help and the vault**
> are owned by someone else: see `VAULT_PLAN.md`. Read `AGENTS.md` (Next.js here differs from your
> training data, so check `node_modules/next/dist/docs/`) and `CONTRACTS.md` first. Tight timeline:
> ship this core, working, before anything else.

## What to build

A page at `/tracker`. The user picks **Berkeley** and a process, then enters one date. The page shows
the school's published timeline, counts business days, flags when a stage is past the school's own
stated window, and offers a ready-to-copy email citing the policy. When an office doesn't reply, an
**escalation ladder** shows who to contact next and drafts that email too.

## Rules (must follow)

1. Procedural only. Never write or edit an account of what happened. Never tell the user whether to
   report, appeal, or escalate. Pattern: "The policy says X. It's been Y. You can ask Z."
   Don't use: "violated", "you should", "you must". UI copy addresses the user as "you".
2. Don't invent office contacts, URLs, or deadlines. Contacts stay empty and render
   "Find contact on the school's site".
3. Never auto-send. The user copies drafts themselves.
4. Every overdue / no-reply message also shows: "Delays aren't your fault. A confidential
   advocate can contact them for you."
5. No personal details in Case Clock state: dates, stages, and office names only. Personal details
   appear in templates only as `{{vault.<key>}}` tokens.
6. Never use `localStorage` or `sessionStorage` directly.
7. No new dependencies. Don't edit files outside the list below.

## Depends on the vault (only in Phase 4)

| Case Clock needs | From | Available after |
|---|---|---|
| `getRecord` / `putRecord` | `lib/vault/store.ts` | Vault Phase 1 |
| `FilledDraft` | `components/vault/FilledDraft.tsx` | Vault Phase 3 |

Phases 1–3 need nothing from the vault, so start now. Filing help does not need Case Clock.

### Shared interface (identical in both plans; change it only by agreement)

```ts
// lib/vault/store.ts
// Session mode or locked: kept in memory only. Saved and unlocked: encrypted with the vault.
// getRecord returns null when there is no record or the vault is locked.
export function getRecord(name: "caseclock"): Promise<unknown | null>;
export function putRecord(name: "caseclock", data: unknown): Promise<void>;

// components/vault/FilledDraft.tsx (default export)
// Shows tokens as chips -> "Fill in my details" -> approval list -> filled text -> Copy / Open in email.
type FilledDraftProps = { template: string; subject?: string };

// Tokens: {{vault.legalName}} {{vault.preferredName}} {{vault.studentId}} {{vault.schoolEmail}}
//         {{vault.phone}} {{vault.caseNumber}} {{vault.investigatorName}}
```

## Files you own

```
app/tracker/page.tsx
components/caseclock/{SetupForm,Timeline,DraftPanel,Ladder}.tsx
lib/caseclock/{types,businessDays,engine,templates,ladder,persistence}.ts
lib/caseclock/caseclock.test.ts
data/timelines/berkeley.ts
data/ladders/berkeley.ts
```

### Shared files (small diffs; pull first)

| File | Your change | When |
|---|---|---|
| `package.json` | scripts: `"test": "node --test --experimental-strip-types"` | Phase 1 (the vault owner makes the identical change) |
| `tsconfig.json` | compilerOptions: `"allowImportingTsExtensions": true` | Phase 1 (identical change) |
| `app/layout.tsx` | add `{ href: "/tracker", label: "Case Clock" }` to `NAV` | Phase 5 |
| `app/page.tsx` | add a `/tracker` card to `QUICK_LINKS` (nav links are hidden on phones) | Phase 5 |
| `CONTRACTS.md` | add a Case Clock row to File ownership | Phase 5 |

## How to work

Work on a branch named `case-clock`. At the end of each phase: pull `main`, merge it in, run
`npm test` and `npm run build`, merge to `main`, and push. Tests use `node:test`, relative imports
ending in `.ts` (Node can't resolve `@/`), and TypeScript syntax Node can strip (no `enum`).

---

## Phase 1 — Date logic and tests (no dependencies)

- [x] Add the `test` script and the `tsconfig.json` option from the shared files table.
- [x] `businessDays.ts`: skip weekends + US federal holidays (hardcode 2026–2027 dates).
- [x] `engine.ts`: `status(rule, startDate, today, extensionNoticed)` →
  `on-track` (< min) · `in-window` (min–max) · `past-window` (> max, no extension notice) ·
  `extended` · `update-available` (≥ 30 business days since last update) ·
  `deadline-soon` (user's deadline ≤ 2 business days away).
- [x] `ladder.ts`: the user marks a rung "contacted on {date}". If no reply after **5 business
  days**, show "No reply yet" and suggest the next rung. Any rung can be opened anytime.
- [x] Tests: day 30, 61, 91, 91 with extension, 30 days since last update, a holiday inside the
  range, ladder no-reply at 4 and 5 business days.

**Done when:** `npm test` and `npm run build` pass.

## Phase 2 — Berkeley data and email templates

**Needs a person:** the UC policy text. The numbers below come from the first draft of this plan and
**have not been checked against the policy**. `content/corpus/berkeley.md` supports the 30–60, 60–90,
and every-30-day figures, but not the section numbers, the exact quote, or the dismissal deadline. Its
"within 5 business days of a disciplinary decision" is a different rule (when parties are told an
outcome), so don't treat it as support. Get the PDF from https://policy.ucop.edu/doc/4000385/SVSH in a
browser and add it to the repo root, next to the Stanford PDF.

- [x] `data/timelines/berkeley.ts`, source: UC SVSH Interim Policy, effective 1/1/2026. Give each
  rule a `verified: boolean`, starting `false`.

| id | starts from | rule | cite |
|---|---|---|---|
| `invest` | written notice of the charges | typically **60–90 business days**; extension needs written reason + new timeline | §V.A.5.b.i |
| `status` | investigation start / last update | update on request and **every 30 business days** | §V.A.5.b |
| `altres` | written notice AR started | typically **30–60 business days** | §V.A.5.a |
| `dismissal-appeal` | notice of dismissal | **the user's** deadline: **5 business days** | Appendix IV §C.4 |

  Exact quote to store for `invest`:
  `"typically within 60 to 90 business days of notifying the parties in writing of the charges"`.
- [x] Check every row and the quote against the PDF. Set `verified: true` only for what matches;
  correct or remove what doesn't. Pay most attention to `dismissal-appeal`, because a wrong date could
  cost the user their appeal.
- [x] `data/ladders/berkeley.ts`, ordered rungs, all `contact: undefined`:
  - School: 1 your case contact at OPHD → 2 Title IX Officer (OPHD) → 3 PATH to Care (confidential advocate, can contact them for you)
  - Police (shown only if the user toggles "I made a police report"): 1 UCPD detective → 2 UCPD supervisor → 3 Alameda County DA Victim-Witness
- [x] `templates.ts`, three templates, tokens only for personal details:
  1. **Status request** (cites the `status` rule)
  2. **Timeline/extension request** (cites the `invest` rule, includes the quote)
  3. **Gentle follow-up** (for no reply)

  Sign-off `{{vault.legalName}}`, reference `Case: {{vault.caseNumber}}`.

**Done when:** templates contain no real personal details, and every rule is verified or still marked
`verified: false` for Phase 5. Phase 3 can start with rows still unverified.

## Phase 3 — The `/tracker` page, with temporary stand-ins

- [x] `persistence.ts`: `load()` and `save()` for Case Clock state. For now they keep state in a
  module variable. Everything else calls only these two functions.
- [x] Setup (school → process → date) → vertical timeline with a status chip per stage → one nudge
  card with a "Draft email" button → ladder below. Use the existing theme (`glass`, `shadow-soft`).
  Mobile-first.
- [x] `DraftPanel`: for now, show the template with tokens unfilled, plus Copy.
- [x] Show any rule with `verified: false` as "Confirm this timeframe with OPHD".

**Done when:** you can go from setup to a copied draft on phone-width and desktop, with tokens still
visible, and the page reloads to an empty state.

## Phase 4 — Connect to the vault (wait for the vault owner)

Check `main` for each item, or ask the vault owner. Do each as soon as its dependency is merged.

- [x] After Vault Phase 1: `persistence.ts` calls `getRecord/putRecord("caseclock")`. Handle `null`
  by showing setup.
- [x] After Vault Phase 3: `DraftPanel` renders through `FilledDraft`. Remove the temporary Copy.

**Done when:** a draft fills in after approval, saved mode restores Case Clock after unlocking, and
session mode leaves no Case Clock data in browser storage.

## Phase 5 — Demo, links, finish

- [x] Demo seed, when `/tracker?demo=1`: Berkeley investigation, police toggle on, notice 94 business
  days ago, last update 33 business days ago, UCPD contacted 12 business days ago with no reply. Seed
  in memory only, and never overwrite saved data. The vault owner seeds the fake personal details.
- [x] Add the nav entry, the home card, and the `CONTRACTS.md` row.
- [x] Remove or verify every rule still marked `verified: false`.

**Done when:** `npm run build` and `npm test` pass, and the demo shows "past the usual timeframe",
"status update available", UCPD "no reply" → next rung, and a draft that fills in after approval.
Report what's still unverified (office names, holidays).

**Status (Nov 6, 2026):** All phases done on `main`. All four Berkeley rules were checked
word-for-word against `UC-SVSH-Interim-Policy-2026.pdf` and are `verified: true`. Phase 4 done: persistence uses the vault store
and drafts render through `FilledDraft`; ladder contacts are empty by design; holidays are US federal, not UC's campus
calendar. `components/caseclock/CaseClock.tsx` was added as the page's client container.

**Later, not now:** Stanford/Cornell timelines, calendar export, contact notes, appeal-stage rules.
