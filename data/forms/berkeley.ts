import type { VaultKey } from "../../lib/vault/types.ts";

/** Either fills from one vault field, or is something only the person should write. */
export type FormField =
  | { label: string; vaultKey: VaultKey }
  | { label: string; onlyYou: true };

export type FormGuide = {
  title: string;
  /** Left empty until a person has confirmed the official link. */
  url?: string;
  /** False until a person has checked the labels against the live form. */
  labelsMatchLiveForm: boolean;
  fields: FormField[];
};

// These labels are the vault's own names for each detail, not the live form's field names.
// A person needs to check them against OPHD's form before changing labelsMatchLiveForm.
export const reportToOphd: FormGuide = {
  title: "Report to OPHD",
  labelsMatchLiveForm: false,
  fields: [
    { label: "Name", vaultKey: "legalName" },
    { label: "Preferred name", vaultKey: "preferredName" },
    { label: "Student ID", vaultKey: "studentId" },
    { label: "School email", vaultKey: "schoolEmail" },
    { label: "Phone", vaultKey: "phone" },
    { label: "Case number", vaultKey: "caseNumber" },
    { label: "What happened", onlyYou: true },
    { label: "Who was involved", onlyYou: true },
    { label: "When and where it happened", onlyYou: true },
  ],
};
