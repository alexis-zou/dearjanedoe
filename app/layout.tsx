import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Safety controls + first-visit disclaimer.
// These three component files are OWNED BY AGENT B — Phase 0 only imports them.
// Until Agent B implements them, page rendering won't compile; the /api/chat
// route handler (Agent A) is independent of this layout and stays testable.
import QuickExitButton from "@/components/QuickExitButton";
import GetHelpNowButton from "@/components/GetHelpNowButton";
import Disclaimer from "@/components/Disclaimer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Know Your Rights — Survivor Support",
  description:
    "Trauma-informed general information about your rights, resources, and university Title IX processes. Not legal advice.",
};

const NAV = [
  { href: "/", label: "Home" },
  { href: "/crisis", label: "Crisis Support" },
  { href: "/legal", label: "Legal Help" },
  { href: "/university", label: "University" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Skip link for keyboard / screen-reader users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-contrast"
        >
          Skip to main content
        </a>

        <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
          <nav
            aria-label="Primary"
            className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3"
          >
            <Link href="/" className="text-lg font-semibold text-primary">
              Know Your Rights
            </Link>

            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-base">
              {NAV.slice(1).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-foreground/80 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Two DISTINCT safety controls (Agent B). Do not merge them. */}
            <div className="ml-auto flex items-center gap-3">
              <GetHelpNowButton />
              <QuickExitButton />
            </div>
          </nav>
        </header>

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>

        <footer className="border-t border-border bg-surface-muted">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
            <p>
              General information, not legal advice. This app does not file any
              report or notify any school or authority. We don&apos;t require
              accounts and don&apos;t store your conversation.
            </p>
          </div>
        </footer>

        {/* First-visit disclaimer modal (Agent B) */}
        <Disclaimer />
      </body>
    </html>
  );
}
