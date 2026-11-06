import { readFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatRequest, Message, School } from "@/lib/types";
import { looksLikeCrisis, CRISIS_REINFORCEMENT } from "@/lib/crisis";

// Route handlers run on the Node.js runtime by default — we rely on that to read the
// corpus from the filesystem and to keep the Anthropic key server-side only
// (never NEXT_PUBLIC_, never sent to the browser). `cacheComponents` in next.config
// disallows an explicit `export const runtime`, so we don't set one.

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 1024;
const MAX_MESSAGES = 40;
const MAX_CHARS_PER_MESSAGE = 8000;

const VALID_SCHOOLS: School[] = ["cornell", "stanford", "berkeley"];

// ---- Build the byte-stable grounding prefix ONCE at module load ----
// Keep this exact string identical across requests so prompt caching hits.
function loadCorpus(): string {
  const root = process.cwd();
  // Literal paths so the bundler statically traces exactly these files
  // (a variable path would cause it to trace/bundle the whole project).
  const system = readFileSync(join(root, "lib/prompts/system.md"), "utf8");
  const federal = readFileSync(join(root, "content/corpus/title-ix-federal.md"), "utf8");
  const cornell = readFileSync(join(root, "content/corpus/cornell.md"), "utf8");
  const stanford = readFileSync(join(root, "content/corpus/stanford.md"), "utf8");
  const berkeley = readFileSync(join(root, "content/corpus/berkeley.md"), "utf8");

  return [
    system,
    "\n\n===== GROUNDING CORPUS (answer only from this) =====\n",
    "## FEDERAL BASELINE\n",
    federal,
    "\n\n## SCHOOL: CORNELL\n",
    cornell,
    "\n\n## SCHOOL: STANFORD\n",
    stanford,
    "\n\n## SCHOOL: BERKELEY\n",
    berkeley,
  ].join("\n");
}

const GROUNDING_PREFIX = loadCorpus();

// Crisis detection lives in lib/crisis.ts (unit-tested). When the latest user message
// matches, we append a non-cached reinforcement system block — keeping the cached prefix
// byte-stable by NOT editing it.

// Replies can quote personal details, so nothing along the way may keep a copy.
const NO_STORE = { "Cache-Control": "no-store" };

function badRequest(error: string) {
  return Response.json({ error }, { status: 400, headers: NO_STORE });
}

export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const { messages, school } = body ?? {};

  // ---- Validate input ----
  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("`messages` must be a non-empty array.");
  }
  if (messages.length > MAX_MESSAGES) {
    return badRequest("Too many messages in one request.");
  }
  const clean: Message[] = [];
  for (const m of messages) {
    if (
      !m ||
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string"
    ) {
      return badRequest("Each message needs role 'user'|'assistant' and string content.");
    }
    const content = m.content.slice(0, MAX_CHARS_PER_MESSAGE).trim();
    if (content) clean.push({ role: m.role, content });
  }
  if (clean.length === 0 || clean[clean.length - 1].role !== "user") {
    return badRequest("The last message must be from the user.");
  }
  if (school !== undefined && !VALID_SCHOOLS.includes(school)) {
    return badRequest("Unknown school.");
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Never echo the key or its absence beyond a generic message.
    return Response.json(
      { error: "Server is not configured. Please try again later." },
      { status: 500, headers: NO_STORE },
    );
  }

  // ---- Tell the model which school via the user turn (keeps the cached prefix stable) ----
  const outgoing = clean.map((m) => ({ ...m }));
  const last = outgoing[outgoing.length - 1];
  const schoolName =
    school === "cornell" ? "Cornell" : school === "stanford" ? "Stanford" : school === "berkeley" ? "Berkeley" : null;
  if (schoolName) {
    last.content = `${last.content}\n\n[School context: ${schoolName}]`;
  }

  // ---- System blocks: cached grounding prefix (+ optional non-cached crisis block) ----
  const systemBlocks: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: GROUNDING_PREFIX,
      cache_control: { type: "ephemeral", ttl: "1h" },
    },
  ];
  if (looksLikeCrisis(last.content)) {
    systemBlocks.push({ type: "text", text: CRISIS_REINFORCEMENT });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const resp = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemBlocks,
        messages: outgoing,
      },
      { headers: { "anthropic-beta": "extended-cache-ttl-2025-04-11" } },
    );

    const reply = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    // Token counts only (no message content) — lets us watch spend + cache hit rate.
    const u = resp.usage;
    console.log(
      `[/api/chat] usage in=${u.input_tokens} out=${u.output_tokens} ` +
        `cacheRead=${u.cache_read_input_tokens ?? 0} cacheWrite=${u.cache_creation_input_tokens ?? 0}`,
    );

    return Response.json({ reply }, { headers: NO_STORE });
  } catch (err) {
    // Name and status only: the full error can include the request, and so the messages.
    const { name, status } = (err ?? {}) as { name?: string; status?: number };
    console.error(`[/api/chat] Anthropic error: name=${name} status=${status}`);
    return Response.json(
      { error: "Sorry — something went wrong generating a response. Please try again." },
      { status: 502, headers: NO_STORE },
    );
  }
}
