// The only details the vault may hold. Nothing about what happened, the other person,
// health, date of birth, SSN, or money.
export const VAULT_KEYS = [
  "legalName",
  "preferredName",
  "studentId",
  "schoolEmail",
  "phone",
  "caseNumber",
  "investigatorName",
] as const;

export type VaultKey = (typeof VAULT_KEYS)[number];
export type VaultValues = Partial<Record<VaultKey, string>>;
export type VaultMode = "session" | "saved";
export type RecordName = "caseclock";
export type VaultRecords = Partial<Record<RecordName, unknown>>;

/** Field labels, as shown on forms and in approval lists. */
export const VAULT_LABELS: Record<VaultKey, string> = {
  legalName: "Name",
  preferredName: "Preferred name",
  studentId: "Student ID",
  schoolEmail: "School email",
  phone: "Phone",
  caseNumber: "Case number",
  investigatorName: "Investigator's name",
};

/** Readable stand-ins for a value that is missing or locked. */
export const VAULT_PHRASES: Record<VaultKey, string> = {
  legalName: "your name",
  preferredName: "your preferred name",
  studentId: "your student ID",
  schoolEmail: "your school email",
  phone: "your phone number",
  caseNumber: "your case number",
  investigatorName: "your investigator's name",
};

export function isVaultKey(key: string): key is VaultKey {
  return (VAULT_KEYS as readonly string[]).includes(key);
}
