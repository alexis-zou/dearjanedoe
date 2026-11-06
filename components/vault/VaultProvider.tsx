"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import {
  getAll,
  getMode,
  getVersion,
  isLocked,
  lock,
  refresh,
  set,
  subscribe,
} from "@/lib/vault/store";
import type { VaultMode, VaultValues } from "@/lib/vault/types";

const HYDRATING = -1;

/** ?demo=1 fills a session vault with fake details. It never touches a saved vault. */
function seedDemo() {
  if (new URLSearchParams(window.location.search).get("demo") !== "1") return;
  if (getMode() !== "session") return;
  void set("legalName", "Jane Doe");
  void set("studentId", "3031234567");
  void set("caseNumber", "OPHD-2026-0000");
}

/**
 * The vault's current state; re-renders the caller when it changes. While hydrating it reports
 * an empty session vault, to match the server's HTML, even if an effect has already changed it.
 */
export function useVault(): { values: VaultValues; locked: boolean; mode: VaultMode } {
  const version = useSyncExternalStore(subscribe, getVersion, () => HYDRATING);
  if (version === HYDRATING) return { values: {}, locked: false, mode: "session" };
  return { values: getAll(), locked: isLocked(), mode: getMode() };
}

/**
 * Connects the in-memory vault to the page's lifetime. It has to clear memory on `pagehide`,
 * because a browser can restore a page from its back/forward cache with memory intact, which
 * would bring details back after Quick Exit.
 */
export default function VaultProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    refresh();
    seedDemo();
    window.addEventListener("pagehide", lock);
    return () => window.removeEventListener("pagehide", lock);
  }, []);

  return children;
}
