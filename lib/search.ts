"use client";

import Fuse from "fuse.js";
import type { SearchableItem } from "./content";

let fuseInstance: Fuse<SearchableItem> | null = null;
let indexedItems: SearchableItem[] = [];

// Filler words that carry no search meaning in this context
const STOPWORDS = new Set([
  "a", "an", "the", "how", "to", "do", "does", "doesn", "doesnt", "don", "dont",
  "is", "are", "am", "was", "were", "be", "my", "i", "me", "you", "your",
  "in", "on", "at", "for", "of", "with", "and", "or", "it", "its",
  "not", "no", "cant", "cannot", "work", "works", "working", "use", "using",
  "what", "when", "where", "which", "this", "that", "there", "here",
]);

function keyOf(item: SearchableItem) {
  return `${item.type}:${item.slug}`;
}

export function initSearch(items: SearchableItem[]) {
  indexedItems = items;
  fuseInstance = new Fuse(items, {
    keys: [
      { name: "title", weight: 2 },
      { name: "summary", weight: 1.5 },
      { name: "keywords", weight: 1.5 },
      { name: "category", weight: 0.5 },
    ],
    threshold: 0.4,
    includeScore: true,
    useExtendedSearch: true,
  });
}

export function search(query: string): SearchableItem[] {
  if (!fuseInstance) return indexedItems;
  const trimmed = query.trim();
  if (!trimmed) return indexedItems;

  const direct = fuseInstance.search(trimmed);
  if (direct.length > 0) return direct.map((r) => r.item);

  // Natural-language fallback: search the meaningful words individually
  const tokens = Array.from(
    new Set(
      trimmed
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    )
  );
  if (tokens.length === 0) return [];

  const matches = new Map<
    string,
    { item: SearchableItem; hits: number; score: number }
  >();

  for (const token of tokens) {
    for (const r of fuseInstance.search(token)) {
      const key = keyOf(r.item);
      const score = r.score ?? 1;
      const existing = matches.get(key);
      if (existing) {
        existing.hits += 1;
        existing.score = Math.min(existing.score, score);
      } else {
        matches.set(key, { item: r.item, hits: 1, score });
      }
    }
  }

  return [...matches.values()]
    .sort((a, b) => b.hits - a.hits || a.score - b.score)
    .map((m) => m.item);
}
