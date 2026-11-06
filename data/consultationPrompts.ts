import type { ConsultationPrompt } from "@/lib/types";

/**
 * Static question templates. Everything here is a question for the person to
 * ask a lawyer or advocate, so the app never needs to collect their details.
 * Keep them neutral: none should push toward reporting or not reporting.
 */
export const consultationPrompts: ConsultationPrompt[] = [
  {
    category: "Cost and fit",
    questions: [
      "Is this first meeting free? What would it cost after that?",
      "Do you offer free or lower-cost help? If not, can you refer me to someone who does?",
      "Have you worked with students on Title IX cases before?",
      "Have you worked with survivors before? How do you make sure I stay in control of decisions?",
    ],
  },
  {
    category: "Privacy and safety",
    questions: [
      "Is what I tell you confidential? Are there any limits to that?",
      "Can I bring a support person to our meetings? Would that affect confidentiality?",
      "Who else in your office would see my information?",
      "Can we agree on a safe way for you to contact me?",
      "Could my records or messages be shared with anyone during a case?",
    ],
  },
  {
    category: "Understanding my options",
    questions: [
      "What are all of my options, including not taking any action right now?",
      "How are a school process, a civil case, and a police report different?",
      "Could I do more than one of these? Would choosing one affect the others?",
      "Are there deadlines that could affect any of my options?",
    ],
  },
  {
    category: "My school",
    questions: [
      "What support can I ask my school for without making a formal complaint?",
      "Could you be my advisor in a school process? What would that involve?",
      "What protections do I have against retaliation? What can I do if it happens?",
      "What can I do if my school isn’t following its own policy?",
    ],
  },
  {
    category: "Next steps",
    questions: [
      "Is there anything I should keep or write down? How can I keep it safe?",
      "What happens after this meeting, and how soon do I need to decide anything?",
      "If I go ahead, what should I expect, and how long might it take?",
    ],
  },
];
