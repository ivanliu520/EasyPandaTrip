import { getAllSearchable } from "@/lib/content";
import { SearchClient } from "@/components/SearchClient";

export const metadata = {
  title: "Search — China Travel Guide",
  description:
    "Search guides, problem solvers, and city tips for China travel.",
};

export default function SearchPage() {
  const items = getAllSearchable();

  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold mb-3">
        Search China Travel Guide
      </h1>
      <p className="text-[var(--text-muted)] mb-8">
        Find guides, problem solvers, and city tips. Try: &quot;how to use alipay&quot;,
        &quot;internet&quot;, &quot;metro&quot;, &quot;taxi&quot;
      </p>

      <SearchClient items={items} />
    </div>
  );
}
