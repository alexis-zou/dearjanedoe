import type { LegalAidOrg } from "@/lib/types";

/** Date every entry below was last checked against the organization's own site. */
export const LEGAL_AID_CHECKED_ON = "November 6, 2026";

/**
 * The shared contract, plus what this directory needs to be honest about each
 * entry. Coverage matters: someone shouldn't call a Massachusetts-only office
 * from another state without knowing that first.
 */
export interface LegalAidEntry extends LegalAidOrg {
  coverage: string;
  textNumber?: string;
}

/**
 * Keep the wording honest: say what each group really does, and where.
 * Most of these connect people to lawyers or information rather than taking
 * cases themselves, and the page should never imply otherwise.
 */
export const legalAidOrgs: LegalAidEntry[] = [
  {
    name: "Legal Network for Gender Equity",
    coverage: "Nationwide",
    description:
      "Run by the National Women’s Law Center. Connects people with lawyers for sex discrimination and harassment, including at school. Lawyers in the network agree to a free first meeting. Some offer free or lower-cost help, and others charge after that. A lawyer taking your case isn’t guaranteed.",
    url: "https://nwlc.org/legal-assistance/",
    phone: "(202) 319-3053",
  },
  {
    name: "VictimConnect Resource Center",
    coverage: "Nationwide · 24 hours a day",
    description:
      "A helpline where trained specialists offer emotional support, explain rights and options, and refer you to services, including legal ones. It doesn’t represent you itself.",
    url: "https://victimconnect.org/",
    phone: "855-484-2846",
    textNumber: "855-484-2846",
  },
  {
    name: "LawHelp.org",
    coverage: "Choose your state",
    description:
      "Pick your state or territory to reach nonprofit legal aid groups near you, along with guides on your legal rights.",
    url: "https://www.lawhelp.org/find-help",
  },
  {
    name: "Legal Services Corporation: find legal aid",
    coverage: "Search by address or city",
    description:
      "Finds the government-funded civil legal aid office that serves your area. These offices often have income limits, so ask whether you qualify.",
    url: "https://www.lsc.gov/about-lsc/what-legal-aid/i-need-legal-help",
  },
  {
    name: "Victim Rights Law Center",
    coverage: "Massachusetts only",
    description:
      "Free civil legal services for survivors of sexual assault in Massachusetts, including help with staying in school or at work and protecting your privacy.",
    url: "https://victimrights.org/how-vrlc-can-help/",
    phone: "(617) 399-6720",
  },
  {
    name: "Know Your IX",
    coverage: "Information · nationwide",
    description:
      "A survivor- and youth-led project of Advocates for Youth, with plain-language guides to Title IX and the legal options available. It shares information and doesn’t represent people.",
    url: "https://www.advocatesforyouth.org/legal-action-for-title-ix/",
  },
  {
    name: "Equal Rights Advocates: Survivor Toolkit",
    coverage: "Information · college students",
    description:
      "A guide for college students going through a Title IX process, covering evidence review, hearings, appeals, and self-care.",
    url: "https://www.equalrights.org/issue/student-survivor-toolkit/",
  },
];
