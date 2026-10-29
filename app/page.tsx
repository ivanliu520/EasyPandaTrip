import Link from "next/link";
import {
  getPublicGuides,
  getPublicProblems,
  getPublicCities,
} from "@/lib/content";
import { CATEGORY_INFO } from "@/lib/types";

export default function HomePage() {
  const guides = getPublicGuides();
  const problems = getPublicProblems();
  const cities = getPublicCities();

  const categorySlugs: (keyof typeof CATEGORY_INFO)[] = [
    "prepare",
    "get-around",
    "pay",
    "daily-life",
  ];

  // Top 3 featured guides
  const featured = guides.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="py-16 md:py-24 border-b border-[var(--border)] bg-gradient-to-b from-[var(--card-bg)] to-transparent">
        <div className="container-page text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--brand-primary)] mb-3">
            Practical guide for foreigners in China
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
            China is easier <br className="hidden md:block" />
            <span className="text-[var(--brand-primary)]">when you know how.</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10">
            Step-by-step guides for payments, internet, transportation, and
            everyday tasks. Verified information for first-time travelers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ready"
              className="inline-flex items-center justify-center px-6 py-3 bg-[var(--brand-primary)] text-white rounded-lg font-semibold hover:bg-[var(--brand-primary-dark)] transition"
            >
              🎯 Get Ready for China
            </Link>
            <Link
              href="/guides"
              className="inline-flex items-center justify-center px-6 py-3 border border-[var(--border)] rounded-lg font-semibold hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition"
            >
              📖 Browse Guides
            </Link>
            <Link
              href="/problems"
              className="inline-flex items-center justify-center px-6 py-3 border border-[var(--border)] rounded-lg font-semibold hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition"
            >
              🆘 Fix a Problem
            </Link>
          </div>
        </div>
      </section>

      {/* Five Categories */}
      <section className="py-16">
        <div className="container-page">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Everything you need, organized by what you&apos;re doing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categorySlugs.map((slug) => {
              const info = CATEGORY_INFO[slug];
              const count = guides.filter(
                (g) => g.frontmatter.category === slug
              ).length;
              if (count === 0) return null;
              return (
                <Link
                  key={slug}
                  href={`/guides/category/${slug}`}
                  className="group p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--brand-primary)] hover:shadow-md transition"
                >
                  <div className="text-3xl mb-3">{info.icon}</div>
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-[var(--brand-primary)] transition">
                    {info.label}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-3">
                    {info.description}
                  </p>
                  <span className="text-xs font-medium text-[var(--brand-primary)]">
                    {count} guide{count !== 1 ? "s" : ""} →
                  </span>
                </Link>
              );
            })}
            <Link
              href="/problems"
              className="group p-6 rounded-xl border border-red-200 bg-red-500/5 hover:bg-red-500/10 transition"
            >
              <div className="text-3xl mb-3">🆘</div>
              <h3 className="font-semibold text-lg mb-1 group-hover:text-red-600 transition">
                Fix a Problem
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-3">
                Something went wrong? Diagnose and resolve it step by step.
              </p>
              <span className="text-xs font-medium text-red-600">
                {problems.length} problem{problems.length !== 1 ? "s" : ""} →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Guides */}
      <section className="py-16 bg-[var(--card-bg)]/50">
        <div className="container-page">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Most popular guides
              </h2>
              <p className="text-[var(--text-muted)]">
                Essential reading for your first trip
              </p>
            </div>
            <Link
              href="/guides"
              className="text-sm font-medium text-[var(--brand-primary)] hover:underline"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featured.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="p-6 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--brand-primary)] hover:shadow-md transition"
              >
                <span className="text-xs font-medium uppercase text-[var(--brand-primary)]">
                  {CATEGORY_INFO[g.frontmatter.category]?.label || g.frontmatter.category}
                </span>
                <h3 className="font-semibold text-lg mt-2 mb-2">
                  {g.frontmatter.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  {g.frontmatter.summary}
                </p>
                <span className="text-xs text-[var(--text-muted)]">
                  ⏱ {g.frontmatter.estimated_minutes} min • Verified {g.frontmatter.last_verified}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-16">
        <div className="container-page">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            City-specific help
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cities.map((c) => (
              <Link
                key={c.slug}
                href={`/cities/${c.slug}`}
                className="group p-8 rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--card-bg)] to-transparent hover:border-[var(--brand-primary)] hover:shadow-md transition"
              >
                <h3 className="font-bold text-2xl mb-2 group-hover:text-[var(--brand-primary)] transition">
                  {c.frontmatter.title}
                </h3>
                <p className="text-[var(--text-muted)]">
                  {c.frontmatter.summary}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
