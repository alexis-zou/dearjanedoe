// WebCrypto only. PBKDF2-SHA-256 -> AES-GCM 256, with a new random IV for every save.
// The derived key is non-extractable and is only ever held in memory.

export const STORAGE_KEY = "app.cache.v1";
const ITERATIONS = 600_000;

export type Envelope = { salt: string; iv: string; ct: string };

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function newSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function deriveKey(passphrase: string, salt: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: fromBase64(salt), iterations: ITERATIONS },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(key: CryptoKey, salt: string, data: unknown): Promise<Envelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(data)),
  );
  return { salt, iv: toBase64(iv), ct: toBase64(new Uint8Array(ct)) };
}

/** Throws if the key is wrong or the data has been changed. */
export async function decrypt(key: CryptoKey, envelope: Envelope): Promise<unknown> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(envelope.iv) },
    key,
    fromBase64(envelope.ct),
  );
  return JSON.parse(new TextDecoder().decode(plain));
}

// Storage can throw in private modes and doesn't exist on the server.

export function readEnvelope(): Envelope | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Envelope;
    return parsed?.salt && parsed.iv && parsed.ct ? parsed : null;
  } catch {
    return null;
  }
}

export function writeEnvelope(envelope: Envelope): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function clearEnvelope(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
