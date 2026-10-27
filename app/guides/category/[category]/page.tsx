import { notFound } from "next/navigation";
import Link from "next/link";
import { getGuidesByCategory } from "@/lib/content";
import { CATEGORY_INFO, type GuideCategory } from "@/lib/types";
import { GuideCard } from "@/components/Shared";

interface Params {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return Object.keys(CATEGORY_INFO).map((category) => ({ category }));
}

export async function generateMetadata({ params }: Params) {
  const { category } = await params;
  const slug = category as GuideCategory;
  const info = CATEGORY_INFO[slug];
  if (!info) return { title: "Not Found" };
  return {
    title: `${info.label} Guides`,
    description: info.description,
    alternates: { canonical: `/guides/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { category } = await params;
  const slug = category as GuideCategory;
  const info = CATEGORY_INFO[slug];

  if (!info) notFound();

  const guides = getGuidesByCategory(slug);

  return (
    <div className="container-page py-12 md:py-16">
      <Link
        href="/guides"
        className="text-sm text-[var(--brand-primary)] hover:underline mb-4 inline-block"
      >
        ← All Guides
      </Link>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{info.icon}</span>
        <h1 className="text-3xl md:text-4xl font-bold">{info.label}</h1>
      </div>
      <p className="text-[var(--text-muted)] mb-10">{info.description}</p>

      {guides.length === 0 ? (
        <p className="text-[var(--text-muted)]">
          No guides yet in this category. Check back soon!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {guides.map((g) => (
            <GuideCard
              key={g.slug}
              guide={{ ...g.frontmatter, slug: g.slug }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
