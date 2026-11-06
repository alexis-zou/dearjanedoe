import Link from "next/link";

const SECTIONS = [
  {
    href: "/crisis",
    title: "Crisis support",
    description:
      "Talk or text with someone right now. Free, confidential hotlines, available any time.",
  },
  {
    href: "/legal",
    title: "Legal help",
    description:
      "Learn about your rights in plain language and prepare questions for a lawyer, at your own pace.",
  },
  {
    href: "/university",
    title: "University navigator",
    description:
      "Understand how Title IX works at your school: your options, supports, and what each process looks like.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="welcome-heading" className="flex flex-col gap-4">
        <h1
          id="welcome-heading"
          className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl"
        >
          You deserve support, and you get to decide what happens next.
        </h1>
        <p className="max-w-2xl text-lg text-foreground">
          This is a calm space for anyone who has experienced sexual assault or
          harassment, whatever your gender, identity, or background, and
          whether it happened recently or long ago. Take what is useful and
          leave the rest. There is no right or wrong way to use this.
        </p>
        <p className="max-w-2xl text-muted">
          If you need someone right now, the <strong>Get Help Now</strong>{" "}
          button at the top of every page shows crisis lines you can call or
          text. If you need to leave quickly, use the <strong>Quick Exit</strong>{" "}
          button.
        </p>
      </section>

      <section aria-labelledby="sections-heading">
        <h2 id="sections-heading" className="sr-only">
          Where would you like to start?
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="flex h-full flex-col gap-2 rounded-xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-primary hover:bg-primary-soft"
              >
                <span className="text-xl font-semibold text-primary">
                  {s.title}
                </span>
                <span className="text-foreground">{s.description}</span>
                <span aria-hidden="true" className="mt-auto pt-2 text-primary">
                  Go &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="good-to-know-heading"
        className="rounded-xl border border-border bg-surface-muted p-5"
      >
        <h2
          id="good-to-know-heading"
          className="mb-3 text-xl font-semibold text-foreground"
        >
          Good to know before you start
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-foreground">
          <li>
            This is <strong>general information, not legal advice</strong>. For
            advice about your situation, a lawyer or advocate can help.
          </li>
          <li>
            This app <strong>does not file a report</strong> or notify anyone:
            not your school, not the police, not anyone else.
          </li>
          <li>
            There are <strong>no accounts</strong>, and we don&apos;t save your
            conversations. Refreshing or leaving the page clears them.
          </li>
          <li>
            When you use a chat box, your messages are{" "}
            <strong>sent to an AI service</strong> to generate answers. Share
            only what you are comfortable sharing.
          </li>
        </ul>
      </section>
    </div>
  );
}
