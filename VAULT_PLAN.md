# VAULT_PLAN.md — Vault and filing help

> **Owner:** one person, working through the phases below in order. **Case Clock** is owned by
> someone else: see `CASE_CLOCK_PLAN.md`. Read `AGENTS.md` (Next.js here differs from your training
> data, so check `node_modules/next/dist/docs/`) and `CONTRACTS.md` first. Tight timeline: ship this
> core, working, before anything else.

## What to build

1. **Vault:** browser-only storage for the user's details, encrypted if saved, plus a guard that
   keeps those details out of anything sent to our server or the AI. Filing help needs this first.
2. **Filing help:** drafts and form fields that fill in the user's details from the vault after they
   approve, for them to copy and paste themselves.

The idea: the AI never sees the secret. It writes `{{vault.studentId}}`; the browser fills in the
real value.

## Rules (must follow)

1. Vault values never leave the browser: not to `/api/*`, not to logs.
2. Vault fields are only: `legalName`, `preferredName`, `studentId`, `schoolEmail`, `phone`,
   `caseNumber`, `investigatorName`. Nothing about what happened, the other person, health, DOB,
   SSN, or money. Form fields like "what happened" show "Only you should write this."
3. Default is **session-only**: memory only, gone when the tab closes or on Quick Exit. Saving is
   opt-in with a passphrase. No passphrase recovery; say so at setup.
4. The user approves before values are filled ("This will fill in: Name, Case number").
5. Never auto-submit, never drive a browser. Copy-and-paste only.
6. Don't invent form labels or URLs. No new dependencies. Don't edit files outside the lists below.
   UI copy addresses the user as "you".

## Case Clock depends on you

Nothing here waits on Case Clock. **Case Clock needs two things from you, so tell its owner when each
is merged to `main`:** the store (Phase 1) and `FilledDraft` (Phase 3).

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
app/vault/page.tsx
components/vault/{VaultProvider,FilledDraft,FormAssist}.tsx
lib/vault/{types,crypto,store,placeholders,egress}.ts
lib/vault/vault.test.ts
data/forms/berkeley.ts
```

### Shared files (small diffs; pull first)

| File | Your change | When |
|---|---|---|
| `package.json` | scripts: `"test": "node --test --experimental-strip-types"` | Phase 1 (the Case Clock owner makes the identical change) |
| `tsconfig.json` | compilerOptions: `"allowImportingTsExtensions": true` | Phase 1 (identical change) |
| `lib/api.ts` | `chat()` redacts every message before `fetch` | Phase 2 |
| `components/MessageList.tsx` | show the notice; fill tokens in replies for display only | Phase 2 |
| `lib/prompts/system.md` | add the placeholder instruction | Phase 2 |
| `app/api/chat/route.ts` | log `err?.name`/`err?.status` only; add `Cache-Control: no-store` | Phase 2 |
| `app/layout.tsx` | wrap children in `<VaultProvider>`; add `{ href: "/vault", label: "My details" }` to `NAV` | Phase 3 |
| `app/page.tsx` | add a `/vault` card to `QUICK_LINKS` (nav links are hidden on phones); change the "Nothing is saved" chip to "Nothing saved unless you choose" | Phase 3 |
| `CONTRACTS.md` | add a Vault row to File ownership; note that `chat()` redacts | Phase 5 |

## How to work

Work on a branch named `vault`. At the end of each phase: pull `main`, merge it in, run `npm test`
and `npm run build`, merge to `main`, and push. Tests use `node:test`, relative imports ending in
`.ts` (Node can't resolve `@/`), and TypeScript syntax Node can strip (no `enum`). WebCrypto is
available under Node, but `localStorage` isn't, so mock it in tests.

---

## Phase 1 — Vault storage (no dependencies)

- [ ] Add the `test` script and the `tsconfig.json` option from the shared files table.
- [ ] `crypto.ts`: WebCrypto only. PBKDF2-SHA-256 (600,000 iterations, random 16-byte salt) →
  AES-GCM 256, new random 12-byte IV per save. Store `{salt, iv, ct}` in `localStorage` key
  `app.cache.v1`. The key is non-extractable and kept in memory only.
- [ ] `store.ts`: module-level state, `mode: "session" | "saved"`, `unlock(passphrase)`, `lock()`,
  `deleteAll()`, `get/set(key)`, plus `getRecord/putRecord` from the shared interface. Session mode
  uses memory only, with no `sessionStorage`. Wrap storage calls in try/catch.
- [ ] Tests: encrypt/decrypt round trip; wrong passphrase fails; two saves give different IVs; session
  mode writes nothing to storage, including `caseclock` records.

**Done when:** tests and build pass. **Tell the Case Clock owner the store is merged.**

## Phase 2 — Keep details out of chat

- [ ] `placeholders.ts`: `listKeys(template)`, `fill(template, values)` → `{ text, missing }`.
- [ ] `egress.ts`: `redactOutgoing(text, values)` replaces any saved value (also digits-only versions
  of phone/ID) with its `{{vault.key}}` token. Match on word boundaries and replace the longest values
  first, so "Sam" doesn't change "Samantha" or "same". Skip empty values.
- [ ] `lib/api.ts`: `chat()` redacts every message, so **both** chat windows are covered:
  `ChatWindow` and the school chat in `SchoolPicker`. Resent history is redacted too.
- [ ] `lib/prompts/system.md`: tell the AI that `{{vault.key}}` is a private placeholder to repeat
  exactly when needed, and never to ask for its real value.
- [ ] `MessageList`: both chats use it. Where a user message contains a vault value, show "We kept
  your details on this device and sent placeholders instead." Fill tokens in replies for display
  only. If a value is missing or locked, show a readable phrase such as "your student ID", never the
  raw token.
- [ ] `route.ts`: the error-log and no-store changes.
- [ ] Tests: mock `fetch`; messages containing saved values, sent with and without a `school` → the
  request body has tokens, not values. `fill()` fills known keys and reports missing ones.
- [ ] Run `next build`, then search `.next/static` for `sk-ant`. Expect no matches.

**Done when:** tests pass, and in DevTools, both chats show tokens rather than values in the Network
tab, and session mode leaves no vault or Case Clock data in browser storage. The disclaimer's own
`sessionStorage` flag is expected. Report these results before starting Phase 3.

## Phase 3 — My details page and draft filling

- [ ] `VaultProvider`, plus the `app/layout.tsx` and `app/page.tsx` changes.
- [ ] `/vault` page: choose session/saved, edit fields, lock, delete. State at setup that there's no
  passphrase recovery.
- [ ] `FilledDraft.tsx`, matching the shared interface. Missing values show "Add your student ID".

**Done when:** a sample template goes through chips → approval → filled text → copy, and Quick Exit
then reopening leaves a session vault empty. **Tell the Case Clock owner `FilledDraft` is merged.**

## Phase 4 — Filing help

**Needs a person:** real field names from OPHD's live report form. Without them, list each detail
under its own vault name (for example "Student ID") and don't present the list as the form's fields.

- [ ] `data/forms/berkeley.ts`: one form ("Report to OPHD") as a list of fields, each mapped to a
  vault key or to "Only you should write this". No mapping to Case Clock data. No official URL until a
  person adds one.
- [ ] `FormAssist.tsx`, on the `/vault` page: a Copy button per field, the approval step from Rule 4,
  and the banner "Field names may not match the live form exactly."

**Done when:** after approval, each mapped field copies its value, and "what happened"-type fields
offer no fill or copy.

## Phase 5 — Demo, finish

- [ ] Demo seed: `VaultProvider` handles `?demo=1` with a session vault of fake values: Jane Doe,
  student ID 3031234567, case OPHD-2026-0000. Never overwrite saved data. Case Clock seeds its own
  dates.
- [ ] Add the `CONTRACTS.md` row.
- [ ] With the Case Clock owner, once both are merged, run the full demo: Case Clock draft → approve →
  filled → copy · type the student ID in chat → Network tab shows `{{vault.studentId}}` · filing help
  fills name/ID · Quick Exit → reopen → vault empty.

**Done when:** `npm run build` and `npm test` pass, and the full demo works.

**Later, not now:** idle auto-lock timer, server-side regex scrub, Stanford/Cornell forms,
export/import, masked display.
