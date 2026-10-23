"use client";

import Fuse from "fuse.js";
import type { SearchableItem } from "./content";

let fuseInstance: Fuse<SearchableItem> | null = null;
let indexedItems: SearchableItem[] = [];

export function initSearch(items: SearchableItem[]) {
  indexedItems = items;
  fuseInstance = new Fuse(items, {
    keys: [
      { name: "title", weight: 2 },
      { name: "summary", weight: 1.5 },
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

  const results = fuseInstance.search(trimmed);
  return results.map((r) => r.item);
}
