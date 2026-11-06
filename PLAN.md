# Plan: "Know Your Rights" — Survivor Support App (1-day hackathon)

## Context

A trauma-informed **web app** helping sexual assault survivors navigate their rights,
legal representation, and university Title IX/VI processes. Inspired by the Cornell
Jane Doe case (used in the demo video narrative). The app lets users ask general
questions, explore vetted resources, and prepare for human consultations — it does
**not** give legal advice, doubt accounts, recommend whether to report, or collect
sensitive data.

Three sections of roughly equal weight:
1. **Crisis Counseling** — curated hotlines (text lines vs. call lines), tap-to-contact.
2. **Legal Help** — a grounded "Know Your Rights" Claude chatbot + legal-aid directory
   + a "prepare for your consultation" question-list generator.
3. **University Navigator** — pick your school (**Cornell / Stanford / Berkeley**) and get
   that school's Title IX/VI policy & reporting process, grounded in curated real policy
   excerpts over the shared federal baseline + how to find the school's Title IX office.

**All work lives inside `/Users/alexis/Documents/anthropic_hackathon`.** This is a fresh
project with no dependency on, or reference to, any other directory.

---

## Overlooked areas (incorporated into this plan)

These are the domain gaps most likely to be noticed by a judge — or to actually harm a
real user. Each is addressed below.

1. **Crisis / self-harm escalation.** If a user expresses suicidal ideation or imminent
   danger in the chat, the bot must break out of legal Q&A and surface 988 + crisis
   lines. → Built into the system prompt as a hard, top-priority rule.
2. **Two safety controls** (see Global section): a **quick-exit** that leaves the site,
   and a **"Get Help Now" quick-escape-to-crisis** that jumps straight to hotlines.
3. **Hallucination control for legal content.** Wrong rights/deadlines cause real harm.
   → Grounding corpus + citations + "general information, not legal advice" framing.
   School-specific answers are limited to the **three curated schools** (Cornell,
   Stanford, Berkeley) grounded in real policy excerpts; the bot does **not** invent
   policy for other schools. Mark each school doc "as of <date>" since policies change.
4. **Privacy honesty.** No accounts, no logging, ephemeral chat cleared on exit/refresh.
   The chat text does go to the Claude API via our server route — the UI says so plainly
   rather than over-promising.
5. **Not a reporting channel.** The app explicitly states it does not file any report or
   notify any school/authority.
6. **API key safety.** The Anthropic key stays server-side in the API route; it is never
   exposed to the browser (no `NEXT_PUBLIC_` prefix).
7. **Inclusivity + accessibility.** Primary audience framing stays, but copy is inclusive
   of all survivors; plain-language reading level; semantic HTML, adequate contrast,
   scalable text, keyboard navigation, ARIA labels on interactive elements.
8. **Resource accuracy.** Hotline numbers are hardcoded and must be verified against
   source before the demo (RAINN 800-656-4673, 988, Crisis Text Line "HOME" to 741741,
   love-is-respect, etc.).

**Explicitly out of scope for one day** (acknowledge in README/demo, don't build):
schools beyond the three curated ones, state-by-state law, criminal-vs-civil case
guidance, minors/K-12 flows, auth/accounts, offline mode, localization.

---

## Architecture

- **Framework:** Fresh **Next.js (App Router) + TypeScript**, created in the project
  directory. **Tailwind CSS** for fast, consistent styling (calming palette: soft blues/
  greens, generous spacing, large readable type).
- **LLM calls:** a server-side **API route** `app/api/chat/route.ts` holds the Anthropic
  key + system prompt + cached corpus and calls `@anthropic-ai/sdk`. The browser calls
  `POST /api/chat` same-origin — **no separate proxy, no CORS, no localhost/tunnel
  problem** (the big Expo risks disappear here).
- **Model:** `claude-sonnet-5` (exact string — no date suffix, no namespace).
- **Grounding:** curated markdown corpus stuffed into the `system` block with
  **prompt caching** (`cache_control: {type:"ephemeral", ttl:"1h"}` on the last system
  block). No vector DB. Keep corpus well under ~20–30K tokens; keep the prefix
  byte-stable or caching silently misses.
- **Responses:** **non-streaming** by default (`messages.create`, single JSON reply,
  typing indicator in UI) — simplest and fully sufficient. Streaming is low-risk in
  Next.js (standard Web `ReadableStream` + the SDK's `messages.stream`) and can be added
  as an easy stretch if time allows; unlike React Native there is no Hermes trap.
- **Config / secrets:**
  - `ANTHROPIC_API_KEY` in `.env.local` — **no `NEXT_PUBLIC_` prefix** (that's what keeps
    it out of the client bundle). Read `process.env.ANTHROPIC_API_KEY` only inside the
    route handler. The SDK reads it from env automatically.
  - The client needs no env var (same-origin call).
  - Add `.env.local` to `.gitignore`.
- **Demo delivery:** `npm run dev` locally is enough; optionally `vercel deploy` from this
  directory for a shareable URL (nice for judges). Deploy is optional, not critical path.

---

## File structure (all under `/Users/alexis/Documents/anthropic_hackathon`)

```
app/
  layout.tsx               # root: nav + persistent quick-exit + "Get Help Now" buttons
  page.tsx                 # home / landing + first-visit disclaimer
  crisis/page.tsx          # Section 1 (static)
  legal/page.tsx           # Section 2 (chat + legal-aid + consultation list)
  university/page.tsx       # Section 3 (federal baseline explainer)
  api/chat/route.ts        # server route: POST /api/chat, system prompt + cached corpus
components/
  ChatWindow.tsx, MessageList.tsx, Composer.tsx, LegalAidCard.tsx,   # Agent C
  ResourceCard.tsx, QuickExitButton.tsx, GetHelpNowButton.tsx,       # Agent B
  CrisisSheet.tsx, Disclaimer.tsx,                                   # Agent B
  SchoolPicker.tsx, PolicyView.tsx                                   # Agent D
lib/
  types.ts                 # shared contracts (Phase 0 scaffold)
  api.ts                   # chat(messages, school?) -> fetch('/api/chat') (Phase 0)
  prompts/system.md        # trauma-informed system prompt + guardrails (Agent A)
CONTRACTS.md               # data shapes + API contract, written in Phase 0
data/
  hotlines.ts              # verified crisis lines, split text vs call
  legalAid.ts              # legal-aid orgs directory
  consultationPrompts.ts   # "prepare for consultation" question templates
content/corpus/
  title-ix-federal.md      # trimmed federal Title IX/VI rights & process (from the PDF)
  cornell.md, stanford.md, berkeley.md   # curated real per-school policy excerpts ("as of" dated)
.env.local                 # ANTHROPIC_API_KEY (gitignored)
tailwind.config.ts, app/globals.css   # calming theme tokens
```

---

## Screen & component details

### Global: two distinct safety controls + disclaimer
These are **two different buttons** — don't merge them:
- **Quick-exit** (`QuickExitButton`, in the nav on every page) →
  `window.location.replace('https://weather.com')` (use `replace` so it's not in back
  history) and clear in-memory chat state. Protects a user whose screen may be watched.
- **"Get Help Now" quick-escape-to-crisis** (`GetHelpNowButton` → `CrisisSheet`) — a
  persistent, high-contrast button in the nav / chat view that opens a modal with the top
  crisis lines — 988, Crisis Text Line ("HOME" to 741741), RAINN (800-656-4673) — each a
  one-tap `tel:`/`sms:` link. Lets a distressed user reach a human immediately without
  navigating away. Reuses `data/hotlines.ts`.
- First-visit `Disclaimer` modal: "General information, not legal advice. This app does
  not file any report. We don't require accounts and don't store your conversation;
  messages are sent to an AI service to generate answers." Dismiss to proceed.

### Section 1 — Crisis Counseling (static, build first)
- Data-driven from `data/hotlines.ts`, two groups: **Text lines** and **Call lines**.
- Each `ResourceCard` renders a `tel:`/`sms:` anchor. Fully works with no backend.

### Section 2 — Legal Help (chat; highest-value, build + test round-trip early)
- **Know Your Rights chatbot:** `lib/api.ts` `chat(messages)` → `POST /api/chat`.
  `MessageList` is a scrollable div that auto-scrolls to bottom on new messages
  (`ref.scrollIntoView` / set `scrollTop = scrollHeight` in an effect). `Composer` is a
  textarea + send button; Enter to send, send disabled while in flight; typing indicator.
  (No RN list/keyboard gymnastics — standard web scroll.)
- **Legal-aid directory:** static list from `data/legalAid.ts` (national orgs: e.g. legal
  aid, Victim Rights Law Center, Know Your IX) with links. Verify before demo.
- **Prepare for your consultation:** generate a question checklist. Simplest = static
  templates from `data/consultationPrompts.ts`; optional second Claude call to tailor
  questions. No sensitive data collected.

### Section 3 — University Navigator (3 curated schools)
- **School picker:** Cornell / Stanford / Berkeley. Selecting one shows that school's
  Title IX/VI policy summary (reporting options & offices, supportive measures, the
  grievance/hearing process, no-contact orders, advisor rights) drawn from
  `content/corpus/<school>.md`, with a visible "as of <date>" note and a link to the
  school's Title IX office.
- Can be mostly static (render the curated school doc) and/or reuse the chat scoped to
  the selected school — ask questions answered from that school's doc + the federal
  baseline, with citations.

### API route — `app/api/chat/route.ts`
- `POST`: `{messages, school?}` in → `anthropic.messages.create({ model:'claude-sonnet-5',
  system:[{type:'text', text:<prompt + federal + all three school docs>,
  cache_control:{type:'ephemeral', ttl:'1h'}}], messages, max_tokens })` → `{reply}` out.
- **Keep the whole corpus (federal + all 3 schools) in one byte-stable cached prefix** so
  the cache never misses. Tell the model which school the user selected via a short line
  appended to the user turn (`[School context: Cornell]`) rather than by swapping the
  prefix. Only fall back to selectively including docs if total corpus exceeds ~30K tokens.
- Runs on the Node runtime; key read from `process.env.ANTHROPIC_API_KEY`.

### System prompt / guardrails (`lib/prompts/system.md`) — the safety core
Hard rules, highest priority first:
1. **Crisis first:** if the user indicates self-harm, suicidality, or immediate danger,
   stop and surface 988 / Crisis Text Line / RAINN before anything else.
2. Trauma-informed, warm, non-judgmental; offer choices, never pressure.
3. **Never** doubt or question an account; **never** advise whether to report.
4. Answer only from the corpus: **federal** Title IX/VI baseline, and school-specific
   policy **only for Cornell, Stanford, or Berkeley**. For any other school, say you only
   cover those three and give the federal baseline — never invent policy. No
   case-specific or predictive legal advice; defer to a lawyer/advocate and cite sources.
5. Don't ask for or retain identifying/sensitive details.
6. Always frame as "general information, not legal advice," and point to human help.

---

## Corpus prep (`content/corpus/`)
- **Federal** (`title-ix-federal.md`): extract **only** the federal Title IX/VI rights &
  process sections from the existing `Public-Counsel-Title-IX-Manual-Final.pdf` into clean
  markdown. Don't dump the full 2.9 MB PDF. `brew install poppler` then
  `pdftotext -layout Public-Counsel-Title-IX-Manual-Final.pdf -` and hand-trim.
- **Per-school** (`cornell.md`, `stanford.md`, `berkeley.md`): curate concise real excerpts
  from each school's published Title IX / sexual-misconduct policy (reporting offices &
  contacts, supportive measures, grievance/hearing process, timelines, advisor rights).
  Each file starts with an "as of <date>" line and the source URL. Keep each tight.
- Total corpus target < ~20–30K tokens combined. Keep crisis-hotline data in
  `data/hotlines.ts` (not the prompt).

---

## Parallel execution — 4 agents, strictly disjoint files

**Phase 0 — shared scaffold (must finish BEFORE the 4 fan out; lead does this, ~45 min).**
This exists so the four agents never edit the same file. It fixes every cross-file
contract:
- `create-next-app` (TS, Tailwind, App Router); `tailwind.config.ts`, `app/globals.css`
  (calming theme tokens).
- `app/layout.tsx` — nav shell that mounts `<QuickExitButton/>`, `<GetHelpNowButton/>`,
  `<Disclaimer/>` (imports only; the component files are owned by Agent B).
- `lib/types.ts` — shared types: `Message`, `Hotline`, `LegalAidOrg`,
  `ConsultationPrompt`, `School = 'cornell'|'stanford'|'berkeley'`.
- `lib/api.ts` — client `chat(messages: Message[], school?: School)` → `POST /api/chat`
  (contract fixed here; Agent A implements the matching route).
- Commit the data-shape and API contract in a short `CONTRACTS.md` so agents don't guess.

**Then the 4 agents run concurrently — each owns a disjoint file set (no overlap):**

| Agent | Scope | Files it OWNS (exclusive) |
|---|---|---|
| **A — AI core** | API route, grounding, guardrails | `app/api/chat/route.ts`, `lib/prompts/system.md`, `content/corpus/title-ix-federal.md`, `content/corpus/cornell.md`, `content/corpus/stanford.md`, `content/corpus/berkeley.md`, `.env.local` |
| **B — Crisis + safety** | Section 1 + both safety buttons + disclaimer | `app/crisis/page.tsx`, `data/hotlines.ts`, `components/ResourceCard.tsx`, `components/QuickExitButton.tsx`, `components/GetHelpNowButton.tsx`, `components/CrisisSheet.tsx`, `components/Disclaimer.tsx` |
| **C — Legal chat** | Section 2 chat + legal-aid + consultation | `app/legal/page.tsx`, `components/ChatWindow.tsx`, `components/MessageList.tsx`, `components/Composer.tsx`, `components/LegalAidCard.tsx`, `data/legalAid.ts`, `data/consultationPrompts.ts` |
| **D — University + home** | Section 3 picker + landing | `app/university/page.tsx`, `components/SchoolPicker.tsx`, `components/PolicyView.tsx`, `app/page.tsx` |

Rules enforced: no two agents list the same path; agents may **import** from
scaffold-owned files (`lib/*`, `layout.tsx`) but never edit them. A/B/C/D consume the
Phase-0 contracts; Agent D's school content comes from Agent A's corpus via `/api/chat`
(it writes only UI, no corpus duplication). Reusable card lives with B (`ResourceCard`);
C uses its own `LegalAidCard` to avoid sharing a file. No git worktrees needed — disjoint
ownership means they can work the same directory at once (this is not a git repo anyway).

**Phase 2 — integration & demo (lead, sequential after agents, ~2 hr).**
Wire-up check across sections, end-to-end round-trip on the AI core, then: polish copy,
loading/empty/error states, a11y + responsive pass, verify every hotline number & link,
and record the Jane Doe/Cornell demo video (grounded cited answer, guardrail firing on
"should I report?", both safety buttons, crisis-line escalation).

Build-order note: Agent A's round-trip is the critical path — start it first and confirm
one grounded reply early; B is fully demoable with no backend; D depends on A's corpus
being populated for live answers (can scaffold its UI against stub content meanwhile).

## Top risks & mitigations
1. **Legal hallucination on camera** → answers grounded in the curated corpus with
   citations; school answers limited to the 3 curated schools (bot refuses to invent
   policy for others); persistent "not legal advice" + "as of <date>" framing. Rehearse
   the demo prompts (lead with a Cornell question).
2. **Key leakage / oversized corpus** → key in `.env.local` server-only (never
   `NEXT_PUBLIC_`); corpus trimmed + prompt-cached. A key in the client bundle is the one
   unrecoverable mistake.
3. **Scope creep across 3 equal sections** → ship the static Crisis section first so
   there's always a working demo; treat streaming, Vercel deploy, and the tailored
   consultation call as stretch goals.
- Time sinks to avoid: building a vector DB, feeding the whole PDF into the prompt,
  over-polishing one section while another has nothing.

---

## Verification (end-to-end)
- **API route:** `curl -X POST http://localhost:3000/api/chat -H 'content-type:
  application/json' -d '{"messages":[{"role":"user","content":"What is Title IX?"}]}'` →
  returns a grounded reply. A second identical call should report a cache read (lower
  input cost).
- **Guardrails:** ask "should I report?" → bot declines to advise, explains options.
  Send a crisis-signal message → bot leads with 988/crisis lines. Ask about a school NOT
  in the three → bot says it only has Cornell/Stanford/Berkeley and points to the federal
  baseline + "find your Title IX office," without inventing policy.
- **School grounding:** select Cornell → answers reflect the Cornell doc and cite it;
  switch to Stanford/Berkeley → answers change accordingly.
- **Client:** in the browser, send a chat message → reply renders, view auto-scrolls,
  send disabled while loading. Click a `tel:`/`sms:` hotline → handler opens. Click
  quick-exit → navigates to neutral site (and not recoverable via Back). Click "Get Help
  Now" → crisis sheet opens with working contact links. First visit shows the disclaimer.
- **Key safety:** `grep -ri NEXT_PUBLIC .env.local` finds nothing; view-source / network
  tab confirms the Anthropic key never reaches the browser.
- **a11y / responsive:** keyboard-navigable, labels read by a screen reader, text scales,
  layout holds on a phone-width viewport.
