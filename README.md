# Know Your Rights — Survivor Support App

Trauma-informed web app helping survivors of sexual assault understand their rights,
find resources, and navigate university Title IX/VI processes. **General information,
not legal advice.** It does not file reports, doubt accounts, advise whether to report,
or store conversations.

Three sections: **Crisis Support** (hotlines), **Legal Help** (grounded "Know Your
Rights" chatbot + legal-aid directory + consultation prep), **University Navigator**
(Cornell / Stanford / Berkeley Title IX policy over the federal baseline).

**My details** (`/vault`) keeps a few personal details in the browser, fills them into drafts
and forms for copy and paste after you approve, and keeps them out of chat requests. **Case
Clock** (`/tracker`, Berkeley timelines and draft emails) is planned. See Progress.

## Stack
Next.js (App Router, TS) · Tailwind v4 · `@anthropic-ai/sdk` · model `claude-sonnet-5`
(server-side route, prompt-cached grounding corpus). No DB, no accounts.

## Run
```bash
npm install
# create .env.local with:  ANTHROPIC_API_KEY=sk-ant-...
npm run dev            # http://localhost:3000
npm test               # unit tests (node:test)
```
Add `?demo=1` to a URL to fill a session vault with fake details. It never touches a saved vault.

## Layout
```
app/            layout + pages + api/chat/route.ts (AI core)
components/      UI (safety buttons, chat, cards, school picker, vault/)
lib/             types.ts, api.ts, crisis.ts, prompts/system.md, vault/
content/corpus/  title-ix-federal.md + cornell/stanford/berkeley.md (grounding)
data/            hotlines, legal aid, consultation prompts, forms/
design/          UI design reference images
CONTRACTS.md     fixed API + data shapes   ·   PLAN.md  full build plan
CASE_CLOCK_PLAN.md  ·  VAULT_PLAN.md  phased plans for the two features in progress
```

## Safety / privacy invariants
- `ANTHROPIC_API_KEY` is server-only — never `NEXT_PUBLIC_`, never in the client bundle.
- Crisis-signal messages escalate to 988 / Crisis Text Line / RAINN before anything else.
- School answers limited to the 3 curated schools; the bot never invents policy.
- Ephemeral chat; not a reporting channel.
- Saved vault values never go to `/api/*` or logs: `chat()` swaps exact matches for
  `{{vault.key}}` tokens. It can't catch partial names, typos, or anything typed while the vault
  is locked.
- The vault is session-only by default. Saving is opt-in, encrypted, and has no passphrase recovery.
- Nothing is auto-submitted. People copy and paste drafts and form details themselves.

## Progress
- [x] **Phase 0 — scaffold:** Next.js + Tailwind, calming theme tokens, nav/layout
      shell, shared contracts (`lib/types.ts`, `lib/api.ts`, `CONTRACTS.md`). *Pushed.*
- [x] **Agent A — AI core:** grounding corpus (federal + 3 schools), trauma-informed
      system prompt / guardrails, `app/api/chat/route.ts` (validation + prompt-cached
      corpus + crisis defense-in-depth), `.env.example`. **Live round-trip verified:**
      grounded replies, "should I report?" guardrail, crisis escalation (988/RAINN),
      school grounding (Stanford office), unknown-school refusal, and prompt cache
      hitting (cacheRead≈8k). Server logs token/cache usage (no message content).
- [x] **Agent B — Crisis + safety:** `/crisis` page (12 lines, text vs call, one-tap
      `tel:`/`sms:`), Get Help Now modal (RAINN / 988 / Crisis Text Line), Quick Exit,
      first-visit Disclaimer (sessionStorage, not localStorage). Numbers verified against
      official sites 2026-11-06 (Trans Lifeline is **not** 24/7 — weekday hours shown).
      E2E (Playwright) passes: nav → /crisis, Get Help Now → sheet → /crisis, mobile.
- [x] **Agent C — Legal chat + legal-aid + consultation prep:** chat UI, directory, and
      question checklist. Tested in a browser against a mock route; **live replies pending
      a real `ANTHROPIC_API_KEY`**.
- [x] **Agent D — University navigator + home:** home page, school picker, policy
      summaries, and school Q&A chat (Cornell / Stanford / Berkeley). Includes the
      gradient-mesh + glass UI redesign.
- [x] **Corpus update:** Cornell and Berkeley grounded in official sources (see the note below).
- [ ] **Case Clock:** not started. One owner, five phases: `CASE_CLOCK_PLAN.md`. Its Berkeley
      citations must be checked against the UC policy PDF before release.
- [ ] **Vault + filing help:** Phases 1–4 and the Phase 5 demo seed are on `main`:
      `VAULT_PLAN.md`. The store and `FilledDraft` are ready for Case Clock's Phase 4. Unit tests and
      a headless Chrome run pass, with `/api/chat` mocked. **Still open:** the full demo with Case
      Clock, a live check that the model repeats `{{vault.key}}` exactly (needs a working
      `ANTHROPIC_API_KEY`), and checking OPHD's real field names and link. Until a person does
      that, filing help lists details under the vault's own names.
- [ ] Phase 2 — integration, a11y pass, verify hotlines/links, demo

> Corpus note: Stanford is grounded in the official policy PDF (1.7.1, 2023-04-13), the SHARE
> FAQ, and the ASSU SHARE procedures infographic. Cornell is grounded in official Cornell Office of
> Civil Rights Policy 6.4 documents (reporting-rights and investigation letters, resolution guide,
> flowchart, No-Contact Order FAQ) and Policies 6.3/6.4. Berkeley is grounded in the UC SVSH Policy
> PDF (effective 2026-01-01) plus OPHD and PATH to Care pages. Federal baseline from the Public
> Counsel manual (as of 2026-04-01) plus ed.gov links.
