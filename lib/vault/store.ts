// The vault's state lives in this module, in memory. Session mode never touches browser
// storage. Saved mode writes only the encrypted envelope, and only while unlocked.
// Only call the mutating functions from the browser (event handlers and effects): on the
// server this module is shared between requests.
import {
  clearEnvelope,
  decrypt,
  deriveKey,
  encrypt,
  newSalt,
  readEnvelope,
  writeEnvelope,
} from "./crypto.ts";
import { isVaultKey } from "./types.ts";
import type { RecordName, VaultKey, VaultMode, VaultRecords, VaultValues } from "./types.ts";

type Payload = { values: VaultValues; records: VaultRecords };

let values: VaultValues = {};
let records: VaultRecords = {};
let key: CryptoKey | null = null;
let salt: string | null = null;
let hasSaved = false;
let saveFailed = false;

// Bumped by lock and deleteAll, so a save already in progress can't write old data back.
let generation = 0;
let saveQueue: Promise<unknown> = Promise.resolve();

// ---- Change notifications (for useSyncExternalStore) ----

let version = 0;
const listeners = new Set<() => void>();

function changed() {
  version++;
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVersion(): number {
  return version;
}

// ---- Status ----

/** Checks storage for a saved vault. Call this from an effect once in the browser. */
export function refresh(): void {
  const found = readEnvelope() !== null;
  if (found !== hasSaved) {
    hasSaved = found;
    changed();
  }
}

export function getMode(): VaultMode {
  return key || hasSaved ? "saved" : "session";
}

export function isLocked(): boolean {
  return hasSaved && !key;
}

/** True if the most recent save couldn't be written to this browser. */
export function lastSaveFailed(): boolean {
  return saveFailed;
}

// ---- Saving ----

function persist(): Promise<boolean> {
  const writeKey = key;
  const writeSalt = salt;
  if (!writeKey || !writeSalt) return Promise.resolve(true);
  const startedIn = generation;

  // One at a time and in order, so an older save can't land after a newer one.
  const job = saveQueue.then(async () => {
    if (startedIn !== generation) return false;
    const payload: Payload = { values, records };
    const envelope = await encrypt(writeKey, writeSalt, payload);
    if (startedIn !== generation) return false;
    const saved = writeEnvelope(envelope);
    saveFailed = !saved;
    return saved;
  });
  saveQueue = job.catch(() => false);
  return job.catch(() => {
    saveFailed = true;
    return false;
  });
}

/** Starts saving, keeping what's already in memory. Refuses if a saved vault already exists. */
export async function createSaved(passphrase: string): Promise<boolean> {
  if (readEnvelope()) return false;
  try {
    const newVaultSalt = newSalt();
    const newKey = await deriveKey(passphrase, newVaultSalt);
    salt = newVaultSalt;
    key = newKey;
  } catch {
    return false;
  }
  const saved = await persist();
  if (saved) {
    hasSaved = true;
  } else {
    key = null;
    salt = null;
  }
  changed();
  return saved;
}

/**
 * Opens the saved vault. Returns false for a wrong passphrase or damaged data, and changes
 * nothing. The saved contents replace whatever was in memory, so details added while locked
 * (including demo details) never overwrite saved data.
 */
export async function unlock(passphrase: string): Promise<boolean> {
  const envelope = readEnvelope();
  if (!envelope) return false;
  try {
    const openedKey = await deriveKey(passphrase, envelope.salt);
    const payload = (await decrypt(openedKey, envelope)) as Payload;
    values = payload.values ?? {};
    records = payload.records ?? {};
    key = openedKey;
    salt = envelope.salt;
    hasSaved = true;
    changed();
    return true;
  } catch {
    return false;
  }
}

function clearMemory() {
  generation++;
  values = {};
  records = {};
  key = null;
  salt = null;
  saveFailed = false;
}

/** Forgets the key and everything in memory. A saved vault stays encrypted in storage. */
export function lock(): void {
  clearMemory();
  changed();
}

/** Erases the vault from memory and from this browser. */
export function deleteAll(): boolean {
  clearMemory();
  const removed = clearEnvelope();
  hasSaved = !removed;
  changed();
  return removed;
}

// ---- Vault fields ----

export function get(field: VaultKey): string | undefined {
  return values[field];
}

/** A copy of every value in memory. Empty when the vault is locked. */
export function getAll(): VaultValues {
  return { ...values };
}

/** Sets one field; an empty value removes it. Resolves false if it couldn't be saved. */
export function set(field: VaultKey, value: string): Promise<boolean> {
  if (!isVaultKey(field)) throw new Error("Not a vault field.");
  const trimmed = value.trim();
  const next = { ...values };
  if (trimmed) next[field] = trimmed;
  else delete next[field];
  values = next;
  changed();
  return persist();
}

// ---- Records for other features (shared interface; see VAULT_PLAN.md) ----

export async function getRecord(name: RecordName): Promise<unknown | null> {
  if (isLocked()) return null;
  const record = records[name];
  return record === undefined ? null : structuredClone(record);
}

export async function putRecord(name: RecordName, data: unknown): Promise<void> {
  records = { ...records, [name]: structuredClone(data) };
  await persist();
}
