import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

// Safety controls + first-visit disclaimer (Agent B).
import QuickExitButton from "@/components/QuickExitButton";
import GetHelpNowButton from "@/components/GetHelpNowButton";
import Disclaimer from "@/components/Disclaimer";
import VaultProvider from "@/components/vault/VaultProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial serif for display headings — soft, warm, feminine.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "Dear Jane Doe — Survivor Support",
  description:
    "Trauma-informed general information about your rights, resources, and university Title IX processes. Not legal advice.",
};

const NAV = [
  { href: "/crisis", label: "Crisis Support" },
  { href: "/legal", label: "Legal Help" },
  { href: "/university", label: "University" },
  { href: "/tracker", label: "Case Clock" },
  { href: "/vault", label: "My details" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Skip link for keyboard / screen-reader users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-contrast"
        >
          Skip to main content
        </a>

        <header className="sticky top-0 z-40 px-3 pt-3">
          <nav
            aria-label="Primary"
            className="glass shadow-soft mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-3 rounded-full px-5 py-3"
          >
            <Link
              href="/"
              className="font-display text-xl font-semibold text-foreground"
            >
              Dear Jane Doe
            </Link>

            <ul className="hidden items-center gap-x-5 text-[0.95rem] sm:flex">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-full px-1 text-foreground/75 transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Two DISTINCT safety controls (Agent B). Do not merge them. */}
            <div className="ml-auto flex items-center gap-2.5">
              <GetHelpNowButton />
              <QuickExitButton />
            </div>
          </nav>
        </header>

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
          <VaultProvider>{children}</VaultProvider>
        </main>

        <footer className="mt-4">
          <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted">
            <p className="mx-auto max-w-2xl text-center text-balance">
              General information, not legal advice. This app does not file any report or
              notify any school or authority. We don&apos;t require accounts and don&apos;t
              store your conversation.
            </p>
          </div>
        </footer>

        {/* First-visit disclaimer modal (Agent B) */}
        <Disclaimer />
      </body>
    </html>
  );
}
