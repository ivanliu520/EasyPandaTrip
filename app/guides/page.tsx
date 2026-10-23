import Link from "next/link";
import { getAllGuides } from "@/lib/content";
import { GuideCard } from "@/components/Shared";

export const metadata = {
  title: "All Guides — China Travel Guide",
  description:
    "Complete step-by-step guides for Alipay, WeChat Pay, internet, DiDi, metro, and more for foreigners in China.",
};

export default function GuidesPage() {
  const guides = getAllGuides();

  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold mb-3">All Guides</h1>
      <p className="text-[var(--text-muted)] mb-10">
        Practical, verified step-by-step instructions for everything you need
        to do in China.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {guides.map((g) => (
          <GuideCard
            key={g.slug}
            guide={{ ...g.frontmatter, slug: g.slug }}
          />
        ))}
      </div>
    </div>
  );
}
