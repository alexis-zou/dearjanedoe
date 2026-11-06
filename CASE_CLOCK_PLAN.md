# CASE_CLOCK_PLAN.md — Agent E brief (core only)

> For a coding agent. Base: `main` @ `66948cf`. Tight timeline: ship the core below, working,
> before anything else. Read `AGENTS.md` (Next.js here differs from your training data — check
> `node_modules/next/dist/docs/`), `CONTRACTS.md`, and **`VAULT_PLAN.md`** (Agent F) first.

## What to build

A page at `/tracker`. She picks **Berkeley** and a process, enters one date. The page shows the
school's published timeline, counts business days, flags when a stage is past the school's own
stated window, and gives her a ready-to-copy email citing the policy. When an office doesn't
reply, an **escalation ladder** shows who to contact next and drafts that email too.

**Works with the vault (`VAULT_PLAN.md`):** her personal details (name, case number,
investigator name) live only in the vault. Templates use `{{vault.<key>}}` tokens; the vault fills
them. Case Clock saves its state through the vault's store — never `localStorage` directly.

## Rules (must follow)

1. Procedural only. Never write or edit an account of what happened. Never tell her whether to
   report, appeal, or escalate. Pattern: "The policy says X. It's been Y. You can ask Z."
   Don't use: "violated", "you should", "you must".
2. Don't invent office contacts, URLs, or deadlines. Contacts stay empty and render
   "Find contact on the school's site".
3. Never auto-send. She copies drafts herself.
4. Every overdue / no-reply message also shows: "Delays aren't your fault. A confidential
   advocate can contact them for you."
5. No personal details in Case Clock state — dates, stages, office names only.
6. No new dependencies. Don't edit other agents' files except the touch points below.

## Files you own

```
app/tracker/page.tsx
components/caseclock/{SetupForm,Timeline,DraftPanel,Ladder}.tsx
lib/caseclock/{types,businessDays,engine,templates,ladder}.ts
lib/caseclock/caseclock.test.ts
data/timelines/berkeley.ts
data/ladders/berkeley.ts
```
Touch points: add `{ href: "/tracker", label: "Case Clock" }` to `NAV` in `app/layout.tsx`
(Agent F edits the same file — one combined commit). Add a row for Agent E in `CONTRACTS.md`.

## Data

`data/timelines/berkeley.ts` — source: UC SVSH Interim Policy, effective 1/1/2026.

| id | starts from | rule | cite |
|---|---|---|---|
| `invest` | written notice of the charges | typically **60–90 business days**; extension needs written reason + new timeline | §V.A.5.b.i |
| `status` | investigation start / last update | update on request and **every 30 business days** | §V.A.5.b |
| `altres` | written notice AR started | typically **30–60 business days** | §V.A.5.a |
| `dismissal-appeal` | notice of dismissal | **her** deadline: **5 business days** | Appendix IV §C.4 |

Store the exact quote for `invest`:
`"typically within 60 to 90 business days of notifying the parties in writing of the charges"`.

`data/ladders/berkeley.ts` — ordered rungs, all `contact: undefined`:
- School: 1 your case contact at OPHD → 2 Title IX Officer (OPHD) → 3 PATH to Care (confidential advocate, can contact them for you)
- Police (shown only if she toggles "I made a police report"): 1 UCPD detective → 2 UCPD supervisor → 3 Alameda County DA Victim-Witness

## Logic

- `businessDays.ts`: skip weekends + US federal holidays (hardcode 2026–2027 dates).
- `engine.ts`: `status(rule, startDate, today, extensionNoticed)` →
  `on-track` (< min) · `in-window` (min–max) · `past-window` (> max, no extension notice) ·
  `extended` · `update-available` (≥ 30 business days since last update) ·
  `deadline-soon` (her deadline ≤ 2 business days away).
- `ladder.ts`: she marks a rung "contacted on {date}". If no reply after **5 business days**, show
  "No reply yet" + suggest the next rung. She can open any rung anytime.
- `templates.ts` — three templates, tokens only for her details:
  1. **Status request** (cites §V.A.5.b)
  2. **Timeline/extension request** (cites §V.A.5.b.i, includes the quote)
  3. **Gentle follow-up** (for no reply)
  Sign-off `{{vault.legalName}}`, reference `Case: {{vault.caseNumber}}`.

## UI

Setup (school → process → date) → vertical timeline with status chip per stage → one nudge card
with a "Draft email" button → `DraftPanel` renders through the vault's `FilledDraft` (approval,
then Copy / Open in email). Ladder below. Use existing theme (`glass`, `shadow-soft`). Mobile-first.

## Tasks

- [ ] E1 `businessDays.ts` + `engine.ts` with tests: day 30, 61, 91, 91-with-extension, 30 days since last update.
- [ ] E2 Berkeley timeline + ladder data.
- [ ] E3 Three templates (tokens only).
- [ ] E4 `/tracker` page: setup, timeline, nudge, DraftPanel, ladder.
- [ ] E5 Save/load via vault store (`getRecord/putRecord("caseclock")`) — after Agent F's Phase A.
- [ ] E6 Demo seed `?demo=1`: Berkeley investigation, notice 94 business days ago, last update 33
  business days ago, UCPD contacted 12 business days ago with no reply.

Tests: `node:test`; add `"test": "node --test --experimental-strip-types"` to `package.json` scripts (coordinate with F).

## Done when

`npm run build` passes, tests pass, and the demo seed shows: "past the usual timeframe",
"status update available", UCPD "no reply" → suggests next rung, and a draft that fills her
details after approval. Report back what's unverified (office names, holidays).

**Later, not now:** Stanford/Cornell timelines, calendar export, contact notes, appeal-stage rules.
