# Know Your Rights — Survivor Support App

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
      corpus + crisis defense-in-depth), `.env.example`. Route verified: validation +
      error paths pass; **live LLM round-trip pending a real `ANTHROPIC_API_KEY`** in
      `.env.local`.
- [ ] Agent B — Crisis section + safety buttons + disclaimer
- [ ] Agent C — Legal chat + legal-aid + consultation prep
- [ ] Agent D — University navigator + home
- [ ] Phase 2 — integration, a11y pass, verify hotlines/links, demo

> Corpus note: Stanford is grounded in the official policy PDF (1.7.1, 2023-04-13);
> federal baseline from the Public Counsel manual (as of 2026-04-01). Cornell & Berkeley
> are grounded on published office/process info and flagged **VERIFY-BEFORE-DEMO**.
