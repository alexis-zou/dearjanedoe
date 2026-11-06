# Dear Jane Doe — Survivor Support App

Trauma-informed web app helping survivors of sexual assault understand their rights,
find resources, and navigate university Title IX/VI processes. **General information,
not legal advice.** It does not file reports, doubt accounts, advise whether to report,
or store conversations.

Three sections: **Crisis Support** (hotlines), **Legal Help** (grounded "Know Your
Rights" chatbot + legal-aid directory + consultation prep), **University Navigator**
(Cornell / Stanford / Berkeley Title IX policy over the federal baseline).

## Stack
Next.js (App Router, TS) · Tailwind v4 · `@anthropic-ai/sdk` · model `claude-sonnet-5`
(server-side route, prompt-cached grounding corpus). No DB, no accounts.

## Run
```bash
npm install
# create .env.local with:  ANTHROPIC_API_KEY=sk-ant-...
npm run dev            # http://localhost:3000
```

## Layout
```
app/            layout + pages + api/chat/route.ts (AI core)
components/      UI (safety buttons, chat, cards, school picker)
lib/             types.ts, api.ts, prompts/system.md
content/corpus/  title-ix-federal.md + cornell/stanford/berkeley.md (grounding)
data/            hotlines, legal aid, consultation prompts
CONTRACTS.md     fixed API + data shapes   ·   PLAN.md  full build plan
```

## Safety / privacy invariants
- `ANTHROPIC_API_KEY` is server-only — never `NEXT_PUBLIC_`, never in the client bundle.
- Crisis-signal messages escalate to 988 / Crisis Text Line / RAINN before anything else.
- School answers limited to the 3 curated schools; the bot never invents policy.
- Ephemeral chat; not a reporting channel.

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
- [ ] Agent D — University navigator + home
- [ ] Phase 2 — integration, a11y pass, verify hotlines/links, demo

> Corpus note: Stanford is grounded in the official policy PDF (1.7.1, 2023-04-13), the SHARE
> FAQ, and the ASSU SHARE procedures infographic. Cornell is grounded in official Cornell Office of
> Civil Rights Policy 6.4 documents (reporting-rights and investigation letters, resolution guide,
> flowchart, No-Contact Order FAQ) and Policies 6.3/6.4. Berkeley is grounded in the UC SVSH Policy
> PDF (effective 2026-01-01) plus OPHD and PATH to Care pages. Federal baseline from the Public
> Counsel manual (as of 2026-04-01) plus ed.gov links.
