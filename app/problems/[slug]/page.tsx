import { notFound } from "next/navigation";
import Link from "next/link";
import { getProblemBySlug, getAllGuides, getAllProblems } from "@/lib/content";
import { PROBLEM_CATEGORY_INFO } from "@/lib/types";
import { VerificationBadge, SeverityBadge } from "@/components/Shared";
import { ProblemSolver } from "@/components/ProblemSolver";
import type { Metadata } from "next";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllProblems().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const problem = getProblemBySlug(slug);
  if (!problem) return { title: "Not Found" };
  return {
    title: problem.frontmatter.title,
    description: problem.frontmatter.summary,
    alternates: { canonical: `/problems/${problem.slug}` },
  };
}

export default async function ProblemPage({ params }: Params) {
  const { slug } = await params;
  const problem = getProblemBySlug(slug);
  if (!problem) notFound();

  const { frontmatter } = problem;
  const catInfo = PROBLEM_CATEGORY_INFO[frontmatter.category] || {
    label: frontmatter.category,
    icon: "❓",
  };

  const relatedGuides = (frontmatter.related_guides || [])
    .map((slug) => {
      const g = getAllGuides().find((gg) => gg.slug === slug);
      return g ? { slug, title: g.frontmatter.title } : null;
    })
    .filter((x): x is { slug: string; title: string } => x !== null);

  return (
    <article className="container-page py-10 md:py-16">
      <Link
        href="/problems"
        className="text-sm text-[var(--brand-primary)] hover:underline mb-4 inline-block"
      >
        ← All Problems
      </Link>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-2xl">{catInfo.icon}</span>
          <span className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {catInfo.label}
          </span>
          <SeverityBadge severity={frontmatter.severity} />
          <VerificationBadge
            date={frontmatter.last_verified}
            status={frontmatter.status}
            compact
          />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          {frontmatter.title}
        </h1>
        <p className="text-lg text-[var(--text-muted)]">
          {frontmatter.summary}
        </p>
      </header>

      <ProblemSolver
        problem={problem}
        relatedGuides={relatedGuides}
        sources={frontmatter.sources || []}
      />
    </article>
  );
}
