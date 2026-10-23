import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chinatravelguide.app"),
  title: {
    default: "China Travel Guide — Practical Step-by-Step Guide for Foreign Travelers",
    template: "%s | China Travel Guide",
  },
  description:
    "A practical, step-by-step guide for first-time international travelers in China. Alipay, WeChat Pay, internet, DiDi, metro, and more — explained clearly.",
  keywords: [
    "China travel guide",
    "how to use Alipay in China",
    "how to use WeChat Pay in China",
    "China internet",
    "DiDi China",
    "China metro",
    "China payment",
    "China for foreigners",
  ],
  openGraph: {
    title: "China Travel Guide — Practical Step-by-Step Guide",
    description:
      "China is easier when you know how. Action-first guides for payments, internet, transport, and everyday tasks in China.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
        <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container-page flex items-center justify-between h-16">
            <Link
              href="/"
              className="font-bold text-lg tracking-tight hover:opacity-80 transition"
            >
              <span className="text-[var(--brand-primary)]">🇨🇳</span>
              <span> China Travel Guide</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/guides" className="hover:text-[var(--brand-primary)] transition">
                Guides
              </Link>
              <Link href="/problems" className="hover:text-[var(--brand-primary)] transition">
                Fix a Problem
              </Link>
              <Link href="/cities" className="hover:text-[var(--brand-primary)] transition">
                Cities
              </Link>
              <Link href="/ready" className="hover:text-[var(--brand-primary)] transition">
                Get Ready
              </Link>
              <Link href="/search" className="hover:text-[var(--brand-primary)] transition">
                Search
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-[var(--border)] py-10 mt-16">
          <div className="container-page text-sm text-[var(--text-muted)]">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <p className="font-semibold text-[var(--foreground)]">China Travel Guide</p>
                <p className="mt-1">Practical, step-by-step help for foreigners in China.</p>
              </div>
              <div className="flex flex-wrap gap-6">
                <Link href="/guides" className="hover:text-[var(--foreground)]">Guides</Link>
                <Link href="/problems" className="hover:text-[var(--foreground)]">Problems</Link>
                <Link href="/ready" className="hover:text-[var(--foreground)]">Get Ready</Link>
                <Link href="/about" className="hover:text-[var(--foreground)]">About</Link>
              </div>
            </div>
            <p className="mt-6 text-xs">
              Information is verified to the best of our ability. Always check official sources before important decisions.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
