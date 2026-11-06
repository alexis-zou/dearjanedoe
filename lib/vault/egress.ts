// Replaces saved vault values with {{vault.key}} tokens before text leaves the browser.
import { tokenFor } from "./placeholders.ts";
import { VAULT_KEYS } from "./types.ts";
import type { VaultKey, VaultValues } from "./types.ts";

// Word boundaries that also work for accented names, where \b does not.
const BEFORE = "(?<![\\p{L}\\p{N}_])";
const AFTER = "(?![\\p{L}\\p{N}_])";
// Tokens already in the text are matched first and left alone, so a value like "vault"
// can't damage them.
const EXISTING_TOKEN = "\\{\\{\\s*vault\\.\\w+\\s*\\}\\}";
const DIGIT_SEPARATORS = "[\\s().+\\-]*";
const MIN_DIGITS = 4;

const DIGIT_FIELDS: readonly VaultKey[] = ["phone", "studentId"];

function escapeRegex(text: string): string {
  // "-" stays unescaped: it isn't special outside a character class, and escaping it
  // there is a syntax error with the "u" flag.
  return text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

/** Exact text, except that any run of spaces matches any other. */
function literalPattern(value: string): string {
  return value.trim().split(/\s+/).map(escapeRegex).join("\\s+");
}

/** The same digits written any way: 5105551234, 510-555-1234, (510) 555-1234, +1 510... */
function digitsPattern(key: VaultKey, value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.length < MIN_DIGITS) return null;
  const isUsPhone = key === "phone" && digits.length === 11 && digits.startsWith("1");
  if (isUsPhone) digits = digits.slice(1);
  const pattern = digits.split("").join(DIGIT_SEPARATORS);
  return key === "phone" ? `(?:\\+?1${DIGIT_SEPARATORS})?${pattern}` : pattern;
}

type Alternative = { key: VaultKey; pattern: string; length: number };

function alternativesFor(values: VaultValues): Alternative[] {
  const alternatives: Alternative[] = [];
  for (const key of VAULT_KEYS) {
    const value = values[key]?.trim();
    if (!value) continue;
    alternatives.push({ key, pattern: literalPattern(value), length: value.length });
    if (DIGIT_FIELDS.includes(key)) {
      const pattern = digitsPattern(key, value);
      if (pattern) alternatives.push({ key, pattern, length: value.length });
    }
  }
  // Longest first, so "Sam Lee" is replaced whole before "Sam" can match inside it.
  return alternatives.sort((a, b) => b.length - a.length);
}

export function redactOutgoing(text: string, values: VaultValues): string {
  const alternatives = alternativesFor(values);
  if (alternatives.length === 0) return text;

  // One pass over the text, so an inserted token is never scanned again.
  const groups = alternatives.map((a) => `(${a.pattern})`).join("|");
  const regex = new RegExp(`${EXISTING_TOKEN}|${BEFORE}(?:${groups})${AFTER}`, "giu");

  return text.replace(regex, (match, ...captures) => {
    const index = captures.findIndex((capture, i) => i < alternatives.length && capture !== undefined);
    return index === -1 ? match : tokenFor(alternatives[index].key);
  });
}

export function containsVaultValue(text: string, values: VaultValues): boolean {
  return redactOutgoing(text, values) !== text;
}
