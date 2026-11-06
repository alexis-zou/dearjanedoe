# CONTRACTS (Phase 0)

Fixed interfaces so the four agents never guess or collide. Types live in
`lib/types.ts`; the client helper in `lib/api.ts`. **Agents import these; nobody edits
scaffold files.**

## Chat API — `POST /api/chat`  (Agent A implements, Agent C consumes via `lib/api.ts`)

Request:

```jsonc
{
  "messages": [{ "role": "user" | "assistant", "content": "string" }],
  "school": "cornell" | "stanford" | "berkeley" // optional
}
```

Response:

```jsonc
{ "reply": "string" }   // 200
{ "error": "string" }   // 4xx / 5xx
```

- Client calls `chat(messages, school?)` from `lib/api.ts` → returns `reply` string.
- Non-streaming. Node runtime. Model `claude-sonnet-5`.
- Key: `process.env.ANTHROPIC_API_KEY`, server-only (never `NEXT_PUBLIC_`).

## Shared types (`lib/types.ts`)

- `Message { role: "user"|"assistant"; content: string }`
- `School = "cornell" | "stanford" | "berkeley"`; `SCHOOLS[]` for the picker (Agent D).
- `Hotline { name; kind: "call"|"text"; contact; smsBody?; description; available? }` — Agent B (`data/hotlines.ts`).
- `LegalAidOrg { name; url; description; phone? }` — Agent C (`data/legalAid.ts`).
- `ConsultationPrompt { category; questions[] }` — Agent C (`data/consultationPrompts.ts`).

## Theme tokens (`app/globals.css`, Tailwind v4 `@theme`)

Use these utility colors: `bg-background`, `bg-surface`, `bg-surface-muted`,
`text-foreground`, `text-muted`, `bg-primary` / `text-primary` / `text-primary-contrast`,
`bg-accent`, `bg-danger` / `text-danger-contrast`, `border-border`.
(Project uses Tailwind v4 — config is CSS-based, there is no `tailwind.config.ts`.)

## File ownership (exclusive)

| Agent | Owns |
|---|---|
| **A — AI core** | `app/api/chat/route.ts`, `lib/prompts/system.md`, `content/corpus/*.md`, `.env.local` |
| **B — Crisis + safety** | `app/crisis/page.tsx`, `data/hotlines.ts`, `components/{ResourceCard,QuickExitButton,GetHelpNowButton,CrisisSheet,Disclaimer}.tsx` |
| **C — Legal chat** | `app/legal/page.tsx`, `components/{ChatWindow,MessageList,Composer,LegalAidCard}.tsx`, `data/{legalAid,consultationPrompts}.ts` |
| **D — University + home** | `app/university/page.tsx`, `components/{SchoolPicker,PolicyView}.tsx`, `app/page.tsx` |
| **Case Clock** | `app/tracker/page.tsx`, `components/caseclock/*`, `lib/caseclock/*`, `data/{timelines,ladders}/*` (see `CASE_CLOCK_PLAN.md`) |

`app/layout.tsx` (scaffold) imports B's `QuickExitButton`, `GetHelpNowButton`, `Disclaimer`.
Page rendering compiles once Agent B provides those three files.
