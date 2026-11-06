// Server-rendered view of a curated corpus doc (content/corpus/*.md, owned by Agent A).
// No "use client": parsing + markdown rendering happen on the server, and the rendered
// panels are handed to the client-side SchoolPicker as props.
import type { ReactNode } from "react";
import type { School } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

export interface PolicyDoc {
  /** Value of the `**As of:**` header line, ISO dates spelled out. */
  asOf: string | null;
  /** Markdown of the `**Source:**` / `**Sources:**` / `**Primary sources…:**` field. */
  sources: string | null;
  /** Markdown of the `**Scope:**` field (federal doc). */
  scope: string | null;
  /** Header blockquote (e.g. "General information, not legal advice…"). */
  intro: string | null;
  /** Everything from the first `## ` heading on, with authoring notes removed. */
  body: string;
  /** True when the doc carries a VERIFY-BEFORE-DEMO note or inline "(verify)" markers. */
  unverified: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-11-06" -> "November 6, 2026" (pure string math, no time-zone surprises). */
function spellDates(text: string): string {
  return text.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (whole, y, m, d) => {
    const month = MONTHS[Number(m) - 1];
    return month ? `${month} ${Number(d)}, ${y}` : whole;
  });
}

/** Inline authoring markers that must never reach survivors verbatim. */
function stripAuthoringMarkers(text: string): { text: string; found: boolean } {
  let found = false;
  const out = text
    .split("\n")
    // Defensive: drop any stray line that carries the internal verification flag.
    .filter((line) => {
      if (/VERIFY-BEFORE-DEMO/i.test(line)) {
        found = true;
        return false;
      }
      return true;
    })
    .join("\n")
    // "(607) 255-1111 *(verify)*." -> "(607) 255-1111."
    .replace(/\s*[*_]?\(verify\)[*_]?/gi, () => {
      found = true;
      return "";
    })
    // "(follows the federal Title IX baseline; see title-ix-federal.md)" -> "(follows … baseline)"
    .replace(/[;,]?\s*see\s+[\w-]+\.md\b/gi, "");
  return { text: out, found };
}

/**
 * Parse a corpus file. Real format (Agent A):
 *   # Title
 *   **As of:** …            (one line)
 *   **⚠️ VERIFY-BEFORE-DEMO:** …   (internal note, multi-line — dropped)
 *   **Source:** URL | **Sources:** text | **Primary sources to verify against:** list
 *   **Grounding:** … | **Scope:** …
 *   > General information, not legal advice…
 *   ## Sections…
 * Header fields may wrap onto continuation lines.
 */
export function parsePolicyDoc(raw: string): PolicyDoc {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const firstSection = lines.findIndex((l) => /^##\s/.test(l));
  const headerEnd = firstSection === -1 ? lines.length : firstSection;

  const fields: { key: string; value: string[] }[] = [];
  const quote: string[] = [];
  let current: { key: string; value: string[] } | null = null;

  for (const line of lines.slice(0, headerEnd)) {
    if (/^#\s/.test(line)) continue; // document title; the page supplies its own heading
    if (/^\s*>/.test(line)) {
      quote.push(line.replace(/^\s*>\s?/, ""));
      current = null;
      continue;
    }
    const field = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    if (field) {
      current = { key: field[1].toLowerCase(), value: field[2] ? [field[2]] : [] };
      fields.push(current);
    } else if (current && line.trim()) {
      current.value.push(line);
    } else if (!line.trim()) {
      current = null;
    }
  }

  let unverified = false;
  let asOf: string | null = null;
  let sources: string | null = null;
  let scope: string | null = null;

  for (const f of fields) {
    const value = f.value.join("\n").trim();
    if (/verify-before-demo/.test(f.key)) {
      unverified = true; // internal authoring note: never displayed
    } else if (/^as of$/.test(f.key)) {
      asOf = spellDates(value.replace(/\s+/g, " ").replace(/\.\s*$/, ""));
    } else if (/source/.test(f.key)) {
      sources = value;
    } else if (/^scope$/.test(f.key)) {
      scope = value;
    }
    // "Grounding" and any other authoring fields are intentionally not shown.
  }

  const cleaned = stripAuthoringMarkers(lines.slice(headerEnd).join("\n"));
  if (cleaned.found) unverified = true;

  return {
    asOf,
    sources,
    scope,
    intro: quote.length ? quote.join(" ").trim() : null,
    body: cleaned.text.trim(),
    unverified,
  };
}

/* ------------------------------------------------------------------ */
/* Tiny safe markdown renderer (React elements only, never raw HTML).  */
/* Handles what the corpus uses: ## headings, nested -/1. lists with   */
/* wrapped continuation lines, > quotes, paragraphs, **bold**,         */
/* *italic*, `code`, [text](url), bare URLs; plus pipe tables and ---. */
/* ------------------------------------------------------------------ */

const LINK_CLASS =
  "text-primary underline underline-offset-2 hover:text-primary-hover break-words";

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re =
    /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*([^*\s][^*]*?)\*|(https?:\/\/[^\s<>)\]]+)/g;
  let last = 0;
  let n = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${n++}`;
    if (m[1] !== undefined) {
      out.push(<strong key={key}>{renderInline(m[1], key)}</strong>);
    } else if (m[2] !== undefined) {
      const href = m[3];
      out.push(
        /^https?:\/\//i.test(href) ? (
          <ExternalLink key={key} href={href}>
            {m[2]}
          </ExternalLink>
        ) : (
          m[2]
        ),
      );
    } else if (m[4] !== undefined) {
      out.push(
        <code key={key} className="rounded bg-surface-muted px-1 font-mono text-[0.9em]">
          {m[4]}
        </code>,
      );
    } else if (m[5] !== undefined) {
      out.push(<em key={key}>{renderInline(m[5], key)}</em>);
    } else if (m[6] !== undefined) {
      const url = m[6].replace(/[.,;:]+$/, "");
      out.push(
        <ExternalLink key={key} href={url}>
          {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        </ExternalLink>,
      );
      if (url.length < m[6].length) out.push(m[6].slice(url.length));
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

interface ListNode {
  ordered: boolean;
  items: { text: string; sub: ListNode | null }[];
}

const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const HEADING = /^\s*(#{1,6})\s+(.*)$/;
const RULE = /^\s*(-{3,}|\*{3,})\s*$/;
const QUOTE = /^\s*>/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;

function isBlockStart(line: string) {
  return HEADING.test(line) || RULE.test(line) || QUOTE.test(line) || LIST_ITEM.test(line) || TABLE_ROW.test(line);
}

/** Parse a (possibly nested) list starting at `start`; returns the tree and next index. */
function parseList(lines: string[], start: number): { list: ListNode; next: number } {
  const first = lines[start].match(LIST_ITEM)!;
  const root: ListNode = { ordered: /\d/.test(first[2]), items: [] };
  const stack: { indent: number; list: ListNode }[] = [{ indent: first[1].length, list: root }];
  let i = start;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) break;
    const m = line.match(LIST_ITEM);
    if (m) {
      const indent = m[1].length;
      while (stack.length > 1 && indent < stack[stack.length - 1].indent) stack.pop();
      const top = stack[stack.length - 1];
      const parent = top.list.items[top.list.items.length - 1];
      if (indent > top.indent && parent) {
        const sub: ListNode = { ordered: /\d/.test(m[2]), items: [{ text: m[3], sub: null }] };
        parent.sub = sub;
        stack.push({ indent, list: sub });
      } else {
        top.list.items.push({ text: m[3], sub: null });
      }
    } else if (HEADING.test(line) || RULE.test(line) || QUOTE.test(line) || TABLE_ROW.test(line)) {
      break;
    } else {
      // Wrapped continuation of the most recent (deepest) item.
      const top = stack[stack.length - 1].list;
      const item = top.items[top.items.length - 1];
      item.text += " " + line.trim();
    }
    i++;
  }
  return { list: root, next: i };
}

function ListView({ list, keyPrefix }: { list: ListNode; keyPrefix: string }) {
  const Tag = list.ordered ? "ol" : "ul";
  return (
    <Tag className={`flex flex-col gap-1.5 pl-6 ${list.ordered ? "list-decimal" : "list-disc"}`}>
      {list.items.map((item, j) => {
        const key = `${keyPrefix}-${j}`;
        return (
          <li key={key}>
            {renderInline(item.text, key)}
            {item.sub && (
              <div className="mt-1.5">
                <ListView list={item.sub} keyPrefix={`${key}s`} />
              </div>
            )}
          </li>
        );
      })}
    </Tag>
  );
}

function splitRow(line: string) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

const HEADING_CLASS: Record<number, string> = {
  2: "mt-6 text-2xl font-semibold text-foreground",
  3: "mt-6 text-xl font-semibold text-foreground",
  4: "mt-4 text-lg font-semibold text-foreground",
  5: "mt-3 font-semibold text-foreground",
  6: "mt-3 font-semibold text-foreground",
};

/**
 * Render markdown. `headingOffset` shifts `#` levels to fit the page outline
 * (default 1: a doc's `##` becomes an h3 under the page's h2).
 */
export function Markdown({ source, headingOffset = 1 }: { source: string; headingOffset?: number }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = `b${k++}`;

    if (!line.trim()) {
      i++;
      continue;
    }

    const h = line.match(HEADING);
    if (h) {
      const level = Math.min(6, Math.max(2, h[1].length + headingOffset));
      const Tag = `h${level}` as "h2";
      blocks.push(
        <Tag key={key} className={HEADING_CLASS[level]}>
          {renderInline(h[2].replace(/\s*#+\s*$/, ""), key)}
        </Tag>,
      );
      i++;
      continue;
    }

    if (RULE.test(line)) {
      blocks.push(<hr key={key} className="my-2 border-border" />);
      i++;
      continue;
    }

    if (LIST_ITEM.test(line)) {
      const { list, next } = parseList(lines, i);
      blocks.push(<ListView key={key} list={list} keyPrefix={key} />);
      i = next;
      continue;
    }

    if (QUOTE.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote key={key} className="border-l-4 border-accent pl-4">
          {renderInline(quote.join(" "), key)}
        </blockquote>,
      );
      continue;
    }

    if (TABLE_ROW.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(lines[i++]);
      const hasHeader = rows.length > 1 && /^[\s|:-]+$/.test(rows[1]);
      const head = hasHeader ? splitRow(rows[0]) : null;
      const bodyRows = (hasHeader ? rows.slice(2) : rows).map(splitRow);
      blocks.push(
        <div key={key} className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-base">
            {head && (
              <thead>
                <tr>
                  {head.map((c, j) => (
                    <th key={j} scope="col" className="border border-border bg-surface-muted px-3 py-2 font-semibold">
                      {renderInline(c, `${key}h${j}`)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {bodyRows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, j) => (
                    <td key={j} className="border border-border px-3 py-2 align-top">
                      {renderInline(c, `${key}r${ri}c${j}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push(<p key={key}>{renderInline(para.join(" "), key)}</p>);
  }

  return <div className="flex flex-col gap-3 text-foreground">{blocks}</div>;
}

/* ------------------------------------------------------------------ */
/* School policy panel                                                 */
/* ------------------------------------------------------------------ */

/**
 * Official Title IX office pages. URLs are the ones the corpus cites (checked live
 * 2026-11-06: titleix.stanford.edu redirects to share.stanford.edu, the
 * "SHARE Title IX and Title VI Office").
 */
export const TITLE_IX_OFFICES: Record<School, { label: string; url: string }> = {
  cornell: { label: "Cornell's Title IX office", url: "https://titleix.cornell.edu/" },
  stanford: { label: "Stanford's SHARE Title IX Office", url: "https://titleix.stanford.edu/" },
  berkeley: {
    label: "UC Berkeley's Office for the Prevention of Harassment & Discrimination (OPHD)",
    url: "https://ophd.berkeley.edu/",
  },
};

export default function PolicyView({
  school,
  schoolName,
  doc,
}: {
  school: School;
  schoolName: string;
  doc: PolicyDoc | null;
}) {
  const office = TITLE_IX_OFFICES[school];
  const headingId = `policy-heading-${school}`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm"
    >
      <div className="flex flex-col gap-3">
        <h2 id={headingId} className="text-2xl font-semibold text-foreground">
          {schoolName}: Title IX overview
        </h2>
        <p className="text-muted">
          {doc?.asOf ? (
            <>
              {/^policy\b/i.test(doc.asOf) ? "Summary based on the " : "Summary as of "}
              <strong className="text-foreground">{doc.asOf}</strong>.{" "}
            </>
          ) : null}
          Policies change, so the school&apos;s own office has the latest details.
        </p>
        {doc?.unverified && (
          <p className="rounded-lg border border-border bg-accent-soft p-3 text-foreground">
            Some details here (like office names and phone numbers) may have changed. Please
            confirm them with {office.label} before relying on them.
          </p>
        )}
        <p>
          <a
            href={office.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
          >
            Visit {office.label}
            <span className="sr-only"> (opens in a new tab)</span>
            <span aria-hidden="true">↗</span>
          </a>
        </p>
      </div>

      {doc?.intro && (
        <blockquote className="border-l-4 border-accent pl-4">{renderInline(doc.intro, `${school}-intro`)}</blockquote>
      )}

      {doc?.body ? (
        <Markdown source={doc.body} />
      ) : (
        <p className="rounded-lg bg-surface-muted p-4 text-foreground">
          A summary for {schoolName} isn&apos;t available right now. {office.label} lists
          reporting options, confidential resources, and supportive measures.
        </p>
      )}

      {doc?.sources && (
        <div className="flex flex-col gap-2 border-t border-border pt-4 text-base">
          <h3 className="font-semibold text-foreground">Where this summary comes from</h3>
          <Markdown source={doc.sources} />
        </div>
      )}

      <p className="border-t border-border pt-4 text-muted">
        Reading this does not file a report with {schoolName} or tell anyone anything.
        Whether to report, and when, is your choice. You can ask for supportive measures
        (like housing or class changes) without making a formal complaint.
      </p>
    </section>
  );
}
