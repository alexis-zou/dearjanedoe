import type { CaseClockState } from "./types.ts";

// Temporary stand-in (Phase 3): state lives in this module only, so a reload starts
// empty. Phase 4 swaps the bodies for getRecord/putRecord("caseclock") from the vault.
// Everything else calls only load() and save(), never browser storage.

let memory: CaseClockState | null = null;

export async function load(): Promise<CaseClockState | null> {
  return memory;
}

export async function save(state: CaseClockState | null): Promise<void> {
  memory = state;
}
