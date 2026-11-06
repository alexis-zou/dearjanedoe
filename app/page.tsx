import Link from "next/link";
import ChatWindow from "@/components/ChatWindow";

const QUICK_LINKS = [
  {
    href: "/crisis",
    title: "Crisis Support",
    body: "Talk to someone now — call or text lines, available any time.",
    accent: "from-[#f6a6c6] to-[#f4b78f]",
    icon: (
      <path d="M12 21s-7.5-4.6-10-9.3C.2 8.3 2 4.8 5.3 4.8c1.9 0 3.4 1.1 4.2 2.6.8-1.5 2.3-2.6 4.2-2.6 3.3 0 5.1 3.5 3.3 6.9C19.5 16.4 12 21 12 21z" />
    ),
  },
  {
    href: "/legal",
    title: "Legal Help",
    body: "Know your rights, find legal aid, and prep for a consultation.",
    accent: "from-[#b49cf0] to-[#8db7f0]",
    icon: (
      <path d="M12 3v18M5 7l-3 6a4 4 0 0 0 6 0L5 7zm14 0-3 6a4 4 0 0 0 6 0l-3-6zM4 20h16M8 4h8" />
    ),
  },
  {
    href: "/university",
    title: "Your University",
    body: "Cornell, Stanford, or Berkeley Title IX offices and process.",
    accent: "from-[#9ed9b8] to-[#8db7f0]",
    icon: (
      <path d="M12 3 2 8l10 5 10-5-10-5zM6 10.5V15c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
    ),
  },
  {
    href: "/tracker",
    title: "Case Clock",
    body: "Track UC Berkeley's published timeline and draft a follow-up if things run long.",
    accent: "from-[#c9a7f2] to-[#f4a9c8]",
    icon: (
      <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    ),
  },
  {
    href: "/vault",
    title: "My details",
    body: "Keep your details on this device and fill them into drafts and forms.",
    accent: "from-[#8db7f0] to-[#b49cf0]",
    icon: <path d="M6 11h12v9H6zM9 11V7a3 3 0 0 1 6 0v4" />,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* ---------- Hero: chatbot front and center ---------- */}
      <section className="relative w-full max-w-3xl pt-2 text-center">
        {/* soft radial glow behind the hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-3rem] -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-br from-accent/40 via-primary/30 to-transparent blur-3xl"
        />

        <p className="font-medium tracking-wide text-primary">You are not alone.</p>
        <h1 className="mt-2 text-balance text-4xl font-semibold leading-tight sm:text-5xl">
          Let&apos;s walk through your rights, together.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-muted">
          Ask anything about Title&nbsp;IX, your options, or what happens next. Gentle,
          judgment-free, general information — <span className="whitespace-nowrap">not legal advice.</span>
        </p>

        {/* The chatbot — the centerpiece of the app */}
        <div className="glass shadow-soft mt-8 rounded-[var(--radius)] p-2 text-left sm:p-3">
          <ChatWindow />
        </div>

        {/* Reassurance chips */}
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-muted">
          {["No account needed", "Nothing saved unless you choose","Leave anytime"].map((t) => (
            <li
              key={t}
              className="rounded-full border border-border bg-surface/60 px-3 py-1"
            >
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Quick links to the three sections ---------- */}
      <section className="mt-14 w-full" aria-label="Explore support">
        <h2 className="text-center text-2xl font-semibold">Where would you like to go?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="glass shadow-soft group flex flex-col gap-3 rounded-[var(--radius)] p-6 transition-transform hover:-translate-y-1"
            >
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${card.accent} text-white`}
                aria-hidden
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  {card.icon}
                </svg>
              </span>
              <span className="font-display text-xl font-semibold text-foreground">
                {card.title}
              </span>
              <span className="text-sm text-muted">{card.body}</span>
              <span className="mt-1 text-sm font-medium text-primary group-hover:underline">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
