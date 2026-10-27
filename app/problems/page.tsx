import Link from "next/link";
import { getAllProblems } from "@/lib/content";
import { PROBLEM_CATEGORY_INFO } from "@/lib/types";
import { SeverityBadge } from "@/components/Shared";

export const metadata = {
  title: "Fix a Problem",
  description:
    "Diagnose and resolve common issues in China. Alipay payment failed? Internet not working? Can't communicate? Step-by-step troubleshooting.",
};

export default function ProblemsPage() {
  const problems = getAllProblems();

  // Group by category
  const grouped = problems.reduce<Record<string, typeof problems>>(
    (acc, p) => {
      const cat = p.frontmatter.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    },
    {}
  );

  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold mb-3">Fix a Problem</h1>
      <p className="text-[var(--text-muted)] mb-10">
        Something went wrong? Tell us what&apos;s happening and we&apos;ll help you fix it
        step by step.
      </p>

      <div className="space-y-8">
        {Object.entries(grouped).map(([cat, items]) => {
          const info = PROBLEM_CATEGORY_INFO[cat as keyof typeof PROBLEM_CATEGORY_INFO] || {
            label: cat,
            icon: "❓",
          };
          return (
            <section key={cat}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">{info.icon}</span>
                {info.label}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/problems/${p.slug}`}
                    className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--brand-primary)] hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold">
                        {p.frontmatter.title}
                      </h3>
                      <SeverityBadge severity={p.frontmatter.severity} />
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      {p.frontmatter.summary}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
