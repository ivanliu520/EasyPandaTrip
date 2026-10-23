"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SearchableItem } from "@/lib/content";
import { initSearch, search } from "@/lib/search";

const TYPE_LABEL: Record<SearchableItem["type"], { label: string; icon: string; color: string }> = {
  guide: { label: "Guide", icon: "📖", color: "text-[var(--brand-primary)] bg-[var(--brand-primary)]/10" },
  problem: { label: "Problem", icon: "🆘", color: "text-red-600 bg-red-500/10" },
  city: { label: "City", icon: "🏙", color: "text-green-600 bg-green-500/10" },
};

const SUGGESTIONS = [
  "how to use alipay",
  "internet in china",
  "didi taxi",
  "metro subway",
  "payment failed",
  "chinese phrases",
  "cannot understand chinese",
];

export function SearchClient({ items }: { items: SearchableItem[] }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    initSearch(items);
  }, [items]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    return search(query);
  }, [query, items]);

  // Group results by type
  const grouped = useMemo(() => {
    const g: Record<string, SearchableItem[]> = {
      guide: [],
      problem: [],
      city: [],
    };
    for (const item of filtered) {
      g[item.type].push(item);
    }
    return g;
  }, [filtered]);

  return (
    <>
      {/* Search input */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: how to pay with card, alipay not working, chinese phrases..."
            className="w-full px-5 py-4 text-lg rounded-xl border border-[var(--border)] bg-[var(--card-bg)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--border)] hover:bg-[var(--text-muted)] text-[var(--foreground)] flex items-center justify-center transition"
            >
              ✕
            </button>
          )}
        </div>

        {/* Suggestions */}
        {!query && (
          <div className="mt-4">
            <p className="text-sm text-[var(--text-muted)] mb-2">Try searching:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="text-sm px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-8">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-2xl mb-2">🔍</p>
            <p className="font-medium">No results found for &quot;{query}&quot;</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Try different keywords or browse all guides and problems
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Link href="/guides" className="text-[var(--brand-primary)] hover:underline">Browse Guides</Link>
              <Link href="/problems" className="text-[var(--brand-primary)] hover:underline">Browse Problems</Link>
            </div>
          </div>
        ) : (
          <>
            {grouped.guide.length > 0 && (
              <section>
                <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)] mb-3">
                  Guides ({grouped.guide.length})
                </h2>
                <div className="space-y-2">
                  {grouped.guide.map((item) => (
                    <LinkItem key={item.slug} item={item} />
                  ))}
                </div>
              </section>
            )}
            {grouped.problem.length > 0 && (
              <section>
                <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)] mb-3">
                  Problems ({grouped.problem.length})
                </h2>
                <div className="space-y-2">
                  {grouped.problem.map((item) => (
                    <LinkItem key={item.slug} item={item} />
                  ))}
                </div>
              </section>
            )}
            {grouped.city.length > 0 && (
              <section>
                <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)] mb-3">
                  Cities ({grouped.city.length})
                </h2>
                <div className="space-y-2">
                  {grouped.city.map((item) => (
                    <LinkItem key={item.slug} item={item} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}

function LinkItem({ item }: { item: SearchableItem }) {
  const label = TYPE_LABEL[item.type];
  return (
    <Link
      href={item.url}
      className="block p-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--brand-primary)] hover:shadow-sm transition"
    >
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${label.color}`}>
          {label.icon} {label.label}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium">{item.title}</h3>
          <p className="text-sm text-[var(--text-muted)]">{item.summary}</p>
        </div>
        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">→</span>
      </div>
    </Link>
  );
}
