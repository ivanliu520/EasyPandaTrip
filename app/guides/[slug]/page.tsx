import { notFound } from "next/navigation";
import Link from "next/link";
import { getGuideBySlug, getAllGuides, getAllProblems } from "@/lib/content";
import { CATEGORY_INFO } from "@/lib/types";
import { Markdown } from "@/components/Markdown";
import {
  VerificationBadge,
  CategoryBadge,
} from "@/components/Shared";
import type { Metadata } from "next";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: "Not Found" };
  const isPublished = guide.frontmatter.status === "verified";
  return {
    title: guide.frontmatter.title,
    description: guide.frontmatter.summary,
    alternates: { canonical: `/guides/${guide.slug}` },
    // Unreviewed content stays directly reachable for internal review but
    // must never be indexed. This is independent of sitemap exclusion.
    ...(isPublished
      ? {}
      : { robots: { index: false, follow: true } }),
    openGraph: {
      title: guide.frontmatter.title,
      description: guide.frontmatter.summary,
      type: "article",
      publishedTime: guide.frontmatter.last_verified,
    },
  };
}

export default async function GuidePage({ params }: Params) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const { frontmatter } = guide;
  const problemMap = new Map(getAllProblems().map((p) => [p.slug, p]));

  return (
    <article className="container-page py-10 md:py-16">
      <Link
        href="/guides"
        className="text-sm text-[var(--brand-primary)] hover:underline mb-4 inline-block"
      >
        ← All Guides
      </Link>

      {/* Header */}
      <header className="mb-10">
        <div className="flex flex-wrap gap-2 mb-3">
          <CategoryBadge category={frontmatter.category} />
          <VerificationBadge
            date={frontmatter.last_verified}
            status={frontmatter.status}
          />
          <span className="text-sm text-[var(--text-muted)]">
            ⏱ {frontmatter.estimated_minutes} min read
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          {frontmatter.title}
        </h1>
        <p className="text-lg text-[var(--text-muted)]">{frontmatter.summary}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Prerequisites */}
          {frontmatter.prerequisites && frontmatter.prerequisites.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                📋 What You Need
              </h2>
              <ul className="space-y-2">
                {frontmatter.prerequisites.map((p) => (
                  <li
                    key={p.item}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--border)]"
                  >
                    <span className="text-lg">
                      {p.required ? "✅" : "☑️"}
                    </span>
                    <div>
                      <span className="font-medium">{p.item}</span>
                      {!p.required && (
                        <span className="text-xs text-[var(--text-muted)] ml-2">
                          (optional)
                        </span>
                      )}
                      {p.note && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {p.note}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Steps */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🚶 Step-by-Step Instructions
            </h2>
            <ol className="space-y-4">
              {frontmatter.steps.map((step) => (
                <li
                  key={step.order}
                  className="relative p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--brand-primary)] text-white font-bold flex items-center justify-center text-sm">
                      {step.order}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {step.title}
                      </h3>
                      <p className="text-[var(--text-muted)] mb-3 leading-relaxed">
                        {step.instruction}
                      </p>
                      {step.visual_cue && (
                        <div className="text-sm bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/20 rounded-md p-3 mb-2">
                          <span className="font-medium text-[var(--brand-primary)]">
                            👁 You should see:{" "}
                          </span>
                          <span className="text-[var(--foreground)]">
                            {step.visual_cue}
                          </span>
                        </div>
                      )}
                      {step.failure_guidance && (
                        <div className="text-sm bg-orange-500/5 border border-orange-500/20 rounded-md p-3 mb-2">
                          <span className="font-medium text-orange-600">
                            ⚠ If this fails:{" "}
                          </span>
                          <span className="text-[var(--foreground)]">
                            {step.failure_guidance}
                          </span>
                        </div>
                      )}
                      {step.linked_problem && problemMap.get(step.linked_problem) && (
                        <Link
                          href={`/problems/${step.linked_problem}`}
                          className="inline-block text-sm text-red-600 hover:underline"
                        >
                          🆘 Help! → {problemMap.get(step.linked_problem)?.frontmatter.title}
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Expected Result */}
          {frontmatter.expected_result && (
            <section>
              <h2 className="text-xl font-bold mb-4">🎯 Done when...</h2>
              <p className="text-[var(--text-muted)] p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                {frontmatter.expected_result}
              </p>
            </section>
          )}

          {/* Backup Options */}
          {frontmatter.backup_options && frontmatter.backup_options.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4">🔄 Backup Plan</h2>
              <div className="space-y-3">
                {frontmatter.backup_options.map((b, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border)]"
                  >
                    <p className="font-medium text-sm mb-1">
                      If <span className="text-red-600">{b.condition}</span>
                    </p>
                    <p className="text-[var(--text-muted)]">→ {b.action}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Common Problems */}
          {frontmatter.common_problems && frontmatter.common_problems.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4">🆘 Common Problems</h2>
              <div className="space-y-2">
                {frontmatter.common_problems.map((slug) => {
                  const p = problemMap.get(slug);
                  if (!p) return null;
                  return (
                    <Link
                      key={slug}
                      href={`/problems/${slug}`}
                      className="block p-3 rounded-lg border border-[var(--border)] hover:border-[var(--brand-primary)] hover:bg-[var(--card-bg)] transition"
                    >
                      <span className="font-medium">{p.frontmatter.title}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Body markdown */}
          {guide.content && (
            <section>
              <Markdown content={guide.content} />
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Sources */}
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
            <h3 className="font-semibold mb-3">📚 Sources</h3>
            <ul className="space-y-2 text-sm">
              {frontmatter.sources?.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--brand-primary)] hover:underline break-all"
                  >
                    {s.name}
                  </a>
                  <span className="ml-2 text-xs text-[var(--text-muted)]">
                    ({s.type})
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Related Guides */}
          {frontmatter.related_guides && frontmatter.related_guides.length > 0 && (
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
              <h3 className="font-semibold mb-3">📖 Related Guides</h3>
              <ul className="space-y-2 text-sm">
                {frontmatter.related_guides.map((slug) => {
                  const g = getAllGuides().find((gg) => gg.slug === slug);
                  if (!g) return null;
                  return (
                    <li key={slug}>
                      <Link
                        href={`/guides/${slug}`}
                        className="text-[var(--brand-primary)] hover:underline"
                      >
                        → {g.frontmatter.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Verification note */}
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-sm">
            <p className="text-xs text-[var(--text-muted)]">
              Last verified {frontmatter.last_verified}
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}
