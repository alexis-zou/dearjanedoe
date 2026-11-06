import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import { decrypt, deriveKey, encrypt, newSalt, STORAGE_KEY } from "./crypto.ts";
import type { Envelope } from "./crypto.ts";
import * as store from "./store.ts";

// ---- localStorage doesn't exist under Node, so mock it and record every write ----

const backing = new Map<string, string>();
let writes: string[] = [];

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (name: string) => backing.get(name) ?? null,
    setItem: (name: string, value: string) => {
      writes.push(name);
      backing.set(name, value);
    },
    removeItem: (name: string) => {
      backing.delete(name);
    },
  },
});

function savedEnvelope(): Envelope {
  return JSON.parse(backing.get(STORAGE_KEY) as string) as Envelope;
}

beforeEach(() => {
  store.deleteAll();
  backing.clear();
  writes = [];
  store.refresh();
});

describe("crypto", () => {
  test("encrypt and decrypt round trip", async () => {
    const salt = newSalt();
    const key = await deriveKey("correct horse", salt);
    const data = { values: { studentId: "3031234567" } };
    const envelope = await encrypt(key, salt, data);
    assert.deepEqual(await decrypt(key, envelope), data);
    assert.ok(!envelope.ct.includes("3031234567"));
  });

  test("a wrong passphrase fails", async () => {
    const salt = newSalt();
    const envelope = await encrypt(await deriveKey("correct horse", salt), salt, { a: 1 });
    await assert.rejects(decrypt(await deriveKey("wrong horse", salt), envelope));
  });

  test("the derived key can't be exported", async () => {
    const key = await deriveKey("correct horse", newSalt());
    assert.equal(key.extractable, false);
    await assert.rejects(crypto.subtle.exportKey("raw", key));
  });
});

describe("session mode", () => {
  test("writes nothing to storage, including caseclock records", async () => {
    await store.set("studentId", "3031234567");
    await store.putRecord("caseclock", { stage: "invest" });
    assert.equal(store.getMode(), "session");
    assert.equal(store.get("studentId"), "3031234567");
    assert.deepEqual(await store.getRecord("caseclock"), { stage: "invest" });
    assert.deepEqual(writes, []);
    assert.equal(backing.size, 0);
  });

  test("lock clears memory", async () => {
    await store.set("studentId", "3031234567");
    await store.putRecord("caseclock", { stage: "invest" });
    store.lock();
    assert.equal(store.get("studentId"), undefined);
    assert.equal(await store.getRecord("caseclock"), null);
  });
});

describe("saved mode", () => {
  test("stores only ciphertext, under the expected key", async () => {
    await store.set("studentId", "3031234567");
    assert.equal(await store.createSaved("correct horse"), true);
    assert.equal(store.getMode(), "saved");
    assert.deepEqual([...backing.keys()], [STORAGE_KEY]);
    assert.ok(!(backing.get(STORAGE_KEY) as string).includes("3031234567"));
  });

  test("two saves use different IVs and the same salt", async () => {
    await store.createSaved("correct horse");
    await store.set("studentId", "3031234567");
    const first = savedEnvelope();
    await store.set("studentId", "3031234567");
    const second = savedEnvelope();
    assert.notEqual(first.iv, second.iv);
    assert.equal(first.salt, second.salt);
  });

  test("lock and unlock restores values and records", async () => {
    await store.createSaved("correct horse");
    await store.set("caseNumber", "OPHD-2026-0000");
    await store.putRecord("caseclock", { stage: "invest" });
    store.lock();

    assert.equal(store.isLocked(), true);
    assert.equal(store.get("caseNumber"), undefined);
    assert.equal(await store.getRecord("caseclock"), null);

    assert.equal(await store.unlock("correct horse"), true);
    assert.equal(store.isLocked(), false);
    assert.equal(store.get("caseNumber"), "OPHD-2026-0000");
    assert.deepEqual(await store.getRecord("caseclock"), { stage: "invest" });
  });

  test("a wrong passphrase doesn't unlock and leaves the saved data alone", async () => {
    await store.createSaved("correct horse");
    await store.set("caseNumber", "OPHD-2026-0000");
    store.lock();
    const before = backing.get(STORAGE_KEY);

    assert.equal(await store.unlock("wrong horse"), false);
    assert.equal(store.isLocked(), true);
    assert.equal(store.get("caseNumber"), undefined);
    assert.equal(backing.get(STORAGE_KEY), before);
  });

  test("details added while locked stay in memory and never overwrite saved data", async () => {
    await store.createSaved("correct horse");
    await store.set("legalName", "Real Name");
    store.lock();
    const before = backing.get(STORAGE_KEY);

    await store.set("legalName", "Jane Doe");
    await store.putRecord("caseclock", { stage: "demo" });
    assert.equal(backing.get(STORAGE_KEY), before);
    assert.equal(await store.getRecord("caseclock"), null);

    await store.unlock("correct horse");
    assert.equal(store.get("legalName"), "Real Name");
    assert.equal(await store.getRecord("caseclock"), null);
  });

  test("createSaved refuses to replace an existing saved vault", async () => {
    await store.createSaved("correct horse");
    store.lock();
    const before = backing.get(STORAGE_KEY);
    assert.equal(await store.createSaved("another passphrase"), false);
    assert.equal(backing.get(STORAGE_KEY), before);
  });

  test("a new page load finds the saved vault locked", async () => {
    await store.createSaved("correct horse");
    store.lock();
    store.refresh();
    assert.equal(store.getMode(), "saved");
    assert.equal(store.isLocked(), true);
  });

  test("deleteAll removes everything, even with a save in progress", async () => {
    await store.createSaved("correct horse");
    const pending = store.set("studentId", "3031234567");
    store.deleteAll();
    await pending;
    assert.equal(backing.size, 0);
    assert.equal(store.getMode(), "session");
    assert.equal(store.get("studentId"), undefined);
  });

  test("a save that can't be written is reported", async () => {
    await store.createSaved("correct horse");
    const original = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error("full");
    };
    assert.equal(await store.set("phone", "5105551234"), false);
    assert.equal(store.lastSaveFailed(), true);
    localStorage.setItem = original;
  });
});

describe("fields", () => {
  test("only the allowed fields can be set", () => {
    assert.throws(() => store.set("ssn" as never, "000-00-0000"));
  });

  test("an empty value removes the field", async () => {
    await store.set("phone", "5105551234");
    await store.set("phone", "   ");
    assert.equal(store.get("phone"), undefined);
  });
});
