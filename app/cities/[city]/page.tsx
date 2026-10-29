import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityBySlug, getAllCities, getAllGuides, getAllProblems } from "@/lib/content";
import { Markdown } from "@/components/Markdown";
import type { Metadata } from "next";

interface Params {
  params: Promise<{ city: string }>;
}

export function generateStaticParams() {
  return getAllCities().map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city } = await params;
  const cityData = getCityBySlug(city);
  if (!cityData) return { title: "Not Found" };
  const isPublished = cityData.frontmatter.status === "verified";
  return {
    title: cityData.frontmatter.title,
    description: cityData.frontmatter.summary,
    alternates: { canonical: `/cities/${cityData.slug}` },
    // Unreviewed cities stay directly reachable for internal review but must
    // never be indexed. Independent of sitemap exclusion, same rule as guide
    // and problem detail pages.
    ...(isPublished
      ? {}
      : { robots: { index: false, follow: true } }),
  };
}

export default async function CityPage({ params }: Params) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const relatedGuides = (city.frontmatter.related_guides || [])
    .map((slug) => getAllGuides().find((g) => g.slug === slug))
    .filter(Boolean);
  const relatedProblems = (city.frontmatter.related_problems || [])
    .map((slug) => getAllProblems().find((p) => p.slug === slug))
    .filter(Boolean);

  return (
    <article className="container-page py-10 md:py-16">
      <Link
        href="/cities"
        className="text-sm text-[var(--brand-primary)] hover:underline mb-4 inline-block"
      >
        ← All Cities
      </Link>

      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {city.frontmatter.title}
        </h1>
        <p className="text-lg text-[var(--text-muted)]">
          {city.frontmatter.summary}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Transport notes */}
          {city.frontmatter.transport_notes && (
            <section>
              <h2 className="text-xl font-bold mb-3">🚇 Getting Around</h2>
              <p className="text-[var(--text-muted)] p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border)]">
                {city.frontmatter.transport_notes}
              </p>
            </section>
          )}

          {/* Payment notes */}
          {city.frontmatter.payment_notes && (
            <section>
              <h2 className="text-xl font-bold mb-3">💳 Payment</h2>
              <p className="text-[var(--text-muted)] p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border)]">
                {city.frontmatter.payment_notes}
              </p>
            </section>
          )}

          {/* Body markdown */}
          {city.content && (
            <section>
              <Markdown content={city.content} />
            </section>
          )}
        </div>

        <aside className="lg:col-span-1 space-y-6">
          {/* Highlights */}
          {city.frontmatter.highlights && (
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
              <h3 className="font-semibold mb-3">✨ Highlights</h3>
              <ul className="space-y-2 text-sm">
                {city.frontmatter.highlights.map((h) => (
                  <li key={h}>• {h}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Guides */}
          {relatedGuides.length > 0 && (
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
              <h3 className="font-semibold mb-3">📖 Related Guides</h3>
              <ul className="space-y-2 text-sm">
                {relatedGuides.map((g) => (
                  <li key={g!.slug}>
                    <Link
                      href={`/guides/${g!.slug}`}
                      className="text-[var(--brand-primary)] hover:underline"
                    >
                      → {g!.frontmatter.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Problems */}
          {relatedProblems.length > 0 && (
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
              <h3 className="font-semibold mb-3">🆘 Common Problems</h3>
              <ul className="space-y-2 text-sm">
                {relatedProblems.map((p) => (
                  <li key={p!.slug}>
                    <Link
                      href={`/problems/${p!.slug}`}
                      className="text-red-600 hover:underline"
                    >
                      → {p!.frontmatter.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
