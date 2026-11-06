# VAULT_PLAN.md — Agent F brief (core only)

> For a coding agent. Base: `main` @ `66948cf`. Tight timeline: ship the core below, working,
> before anything else. Read `AGENTS.md` (Next.js here differs from your training data — check
> `node_modules/next/dist/docs/`), `CONTRACTS.md`, and **`CASE_CLOCK_PLAN.md`** (Agent E) first.

## What to build

1. **Secret management (Phase A — must work first):** a browser-only vault for her details,
   encrypted if saved; a guard that keeps those details out of anything sent to our server or the
   AI; and server hygiene for the API key and logs.
2. **Form filling (Phase B — only after Phase A works):** drafts and forms that fill in her
   details from the vault, after she approves, for her to copy and paste herself.

Idea (from judge feedback on Instinct's Vault): the AI never sees the secret. It writes
`{{vault.studentId}}`; her browser fills in the real value.

**Works with Case Clock:** Case Clock's email templates use `{{vault.*}}` tokens and render through
your `FilledDraft`. Case Clock saves its state through your store, so one passphrase, one lock and
one delete cover both.

## Rules (must follow)

1. Vault values never leave the browser — not to `/api/*`, not to logs.
2. Vault fields are only: `legalName`, `preferredName`, `studentId`, `schoolEmail`, `phone`,
   `caseNumber`, `investigatorName`. Nothing about what happened, the other person, health, DOB,
   SSN, or money. Form fields like "what happened" show "Only you should write this."
3. Default is **session-only** (memory only, gone when the tab closes or Quick Exit). Saving is
   opt-in with a passphrase. No passphrase recovery — say so at setup.
4. She approves before values are filled ("This will fill in: Name, Case number").
5. Never auto-submit, never drive a browser. Copy-and-paste only.
6. Don't invent form labels or URLs. No new dependencies. Don't edit other agents' files except
   the touch points below.

## Files you own

```
app/vault/page.tsx
components/vault/{VaultProvider,FilledDraft,FormAssist}.tsx
lib/vault/{types,crypto,store,placeholders,egress}.ts
lib/vault/vault.test.ts
data/forms/berkeley.ts
```

Touch points (small diffs):
- `app/layout.tsx`: wrap children in `<VaultProvider>`, add `{ href: "/vault", label: "My details" }` to `NAV` (one combined commit with Agent E's nav entry).
- `components/ChatWindow.tsx` (Agent C): run outgoing text through `redactOutgoing()` before `chat()`.
- `app/api/chat/route.ts` (Agent A): log `err?.name`/`err?.status` only, not the full error; add `Cache-Control: no-store`.
- `CONTRACTS.md`: add a row for Agent F.

## Phase A — secret management

- **`crypto.ts`**: WebCrypto only. PBKDF2-SHA-256 (600,000 iterations, random 16-byte salt) →
  AES-GCM 256, new random 12-byte IV per save. Store `{salt, iv, ct}` in `localStorage` key
  `app.cache.v1`. Key is non-extractable and kept in memory only.
- **`store.ts`**: `mode: "session" | "saved"`, `unlock(passphrase)`, `lock()`, `deleteAll()`,
  `get/set(key)`, plus `getRecord/putRecord("caseclock", data)` for Case Clock (encrypted with
  the vault in saved mode; `sessionStorage` in session mode). Wrap storage calls in try/catch.
- **`egress.ts`**: `redactOutgoing(text, values)` replaces any saved value (also digits-only
  versions of phone/ID) with its `{{vault.key}}` token. Show "We kept your details on this device
  and sent placeholders instead."
- **Server**: the error-log and no-store fixes above; confirm the API key is server-only
  (`next build`, then search `.next/static` for `sk-ant` → none).

**Gate:** tests below pass + manual check in DevTools (Network tab shows tokens, not values;
session mode leaves nothing in storage). Report results before starting Phase B.

## Phase B — form filling

- **`placeholders.ts`**: `listKeys(template)`, `fill(template, values)` → `{ text, missing }`.
  Missing values show "Add your student ID".
- **`FilledDraft.tsx`**: shows the draft with tokens as chips → "Fill in my details" → approval
  list → filled text → Copy / Open in email. Case Clock's DraftPanel uses this.
- **`FormAssist.tsx` + `data/forms/berkeley.ts`**: one form ("Report to OPHD") as a list of fields,
  each mapped to a vault key, a Case Clock date, or "Only you should write this", with a Copy
  button. Banner: "Field names may not match the live form exactly." No official URL until a human
  adds it.
- **`/vault` page**: choose session/saved, edit fields, lock, delete.

## Tests (`node:test`)

- Encrypt/decrypt round trip; wrong passphrase fails; two saves give different IVs.
- Session mode writes nothing vault-related to storage.
- Mock `fetch`: chat messages containing saved values → request body has tokens, not values.
- `fill()` fills known keys, reports missing ones.

## Demo seed (`?demo=1`, shared with Case Clock)

Session vault with fake values: Jane Doe, student ID 3031234567, case OPHD-2026-0000. Flow:
Case Clock draft → approve → filled → copy · type the student ID in chat → Network tab shows
`{{vault.studentId}}` · Form Assist fills name/ID · Quick Exit → reopen → vault empty.

## Done when

Phase A gate passed first, then Phase B works in the demo flow; `npm run build` and tests pass.

**Later, not now:** idle auto-lock timer, server-side regex scrub, Stanford/Cornell forms,
export/import, masked display.
