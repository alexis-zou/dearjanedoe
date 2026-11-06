import { isVaultKey, VAULT_PHRASES } from "./types.ts";
import type { VaultKey, VaultValues } from "./types.ts";

function tokenPattern() {
  return /\{\{\s*vault\.(\w+)\s*\}\}/g;
}

export function tokenFor(key: VaultKey): string {
  return `{{vault.${key}}}`;
}

/** The vault fields a template uses, in order of first use, without repeats. */
export function listKeys(template: string): VaultKey[] {
  const keys = new Set<VaultKey>();
  for (const match of template.matchAll(tokenPattern())) {
    if (isVaultKey(match[1])) keys.add(match[1]);
  }
  return [...keys];
}

/** Fills known tokens from `values`. Tokens with no value stay as tokens and are reported. */
export function fill(
  template: string,
  values: VaultValues,
): { text: string; missing: VaultKey[] } {
  const missing = new Set<VaultKey>();
  // A replacer function, so a "$" in someone's value is taken literally.
  const text = template.replace(tokenPattern(), (token, name: string) => {
    if (!isVaultKey(name)) return token;
    const value = values[name];
    if (value) return value;
    missing.add(name);
    return token;
  });
  return { text, missing: [...missing] };
}

/** For showing text on screen only. Never shows a raw token, even one the AI made up. */
export function fillForDisplay(template: string, values: VaultValues): string {
  return template.replace(tokenPattern(), (_token, name: string) => {
    if (!isVaultKey(name)) return "your details";
    return values[name] || VAULT_PHRASES[name];
  });
}
