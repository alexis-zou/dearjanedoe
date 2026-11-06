import { getRecord, putRecord } from "../vault/store.ts";
import { isIsoDate } from "./businessDays.ts";
import type { CaseClockState } from "./types.ts";

// Case Clock state goes through the vault's record store. In session mode (the default)
// or while locked, it stays in memory only; in saved mode it's encrypted with the vault.
// Everything else calls only load() and save(), never browser storage.

const PROCESSES = ["investigation", "alternative-resolution", "dismissal"];

/** Anything that doesn't look like Case Clock state is treated as "nothing saved". */
function isCaseClockState(x: unknown): x is CaseClockState {
  if (!x || typeof x !== "object") return false;
  const s = x as Record<string, unknown>;
  return (
    s.school === "berkeley" &&
    typeof s.process === "string" &&
    PROCESSES.includes(s.process) &&
    typeof s.startDate === "string" &&
    isIsoDate(s.startDate) &&
    (s.lastUpdateDate === undefined || (typeof s.lastUpdateDate === "string" && isIsoDate(s.lastUpdateDate))) &&
    typeof s.extensionNoticed === "boolean" &&
    typeof s.policeReport === "boolean" &&
    !!s.contacts &&
    typeof s.contacts === "object"
  );
}

export async function load(): Promise<CaseClockState | null> {
  const record = await getRecord("caseclock");
  return isCaseClockState(record) ? record : null;
}

export async function save(state: CaseClockState | null): Promise<void> {
  await putRecord("caseclock", state);
}
