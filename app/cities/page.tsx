import Link from "next/link";
import { getPublicCities } from "@/lib/content";

export const metadata = {
  title: "Cities",
  description: "Practical guides for Beijing and Shanghai — transport, payment, and local tips.",
};

export default function CitiesPage() {
  const cities = getPublicCities();

  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold mb-3">City Guides</h1>
      <p className="text-[var(--text-muted)] mb-10">
        Destination-specific tips, transport, payment, and must-know details.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cities.map((c) => (
          <Link
            key={c.slug}
            href={`/cities/${c.slug}`}
            className="group rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--card-bg)] to-transparent hover:border-[var(--brand-primary)] hover:shadow-lg transition overflow-hidden"
          >
            <div className="p-8">
              <h2 className="text-3xl font-bold mb-2 group-hover:text-[var(--brand-primary)] transition">
                {c.frontmatter.title}
              </h2>
              <p className="text-[var(--text-muted)] mb-4">
                {c.frontmatter.summary}
              </p>
              {c.frontmatter.highlights && (
                <div className="flex flex-wrap gap-1.5">
                  {c.frontmatter.highlights.slice(0, 4).map((h) => (
                    <span
                      key={h}
                      className="text-xs bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2 py-1 rounded-md"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
