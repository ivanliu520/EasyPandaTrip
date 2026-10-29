import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type {
  Guide,
  GuideFrontmatter,
  Problem,
  ProblemFrontmatter,
  City,
  CityFrontmatter,
} from "./types";
import { CATEGORY_INFO } from "./types";

const CONTENT_ROOT = path.join(process.cwd(), "content");

function loadFromDir<TFrontmatter>(
  dir: string,
  validate: (fm: unknown) => TFrontmatter
): { frontmatter: TFrontmatter; content: string; slug: string }[] {
  const fullDir = path.join(CONTENT_ROOT, dir);
  if (!fs.existsSync(fullDir)) return [];

  const files = fs
    .readdirSync(fullDir)
    .filter((f) => f.endsWith(".md"));

  return files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(fullDir, file), "utf-8");
    const { data, content } = matter(raw);
    return {
      frontmatter: validate({ ...data, slug }),
      content: content.trim(),
      slug,
    };
  });
}

// --- Guides ---

export function getAllGuides(): Guide[] {
  const items = loadFromDir<GuideFrontmatter>("guides", (fm) => {
    const f = fm as Record<string, unknown>;
    return {
      slug: f.slug as string,
      title: f.title as string,
      summary: f.summary as string,
      category: f.category as GuideFrontmatter["category"],
      city_scope: (f.city_scope ?? "all") as GuideFrontmatter["city_scope"],
      target_audience: (f.target_audience ?? []) as string[],
      estimated_minutes: (f.estimated_minutes ?? 5) as number,
      last_verified: f.last_verified as string,
      status: (f.status ?? "draft") as GuideFrontmatter["status"],
      sources: (f.sources ?? []) as GuideFrontmatter["sources"],
      prerequisites: (f.prerequisites ?? []) as GuideFrontmatter["prerequisites"],
      steps: f.steps as GuideFrontmatter["steps"],
      expected_result: f.expected_result as string | undefined,
      backup_options: f.backup_options as GuideFrontmatter["backup_options"],
      common_problems: (f.common_problems ?? []) as string[],
      related_guides: (f.related_guides ?? []) as string[],
    };
  });
  return items;
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return getAllGuides().find((g) => g.slug === slug);
}

// --- Public visibility ---

/**
 * Only `verified` content is eligible for public discovery: site search,
 * sitemap, and listing pages. Draft/stale/outdated content stays reachable
 * by direct URL (and from related links) so it can be reviewed before
 * publication, but it must not be indexed or surfaced in listings.
 */
function isPublished(status: string): boolean {
  return status === "verified";
}

export function getPublicGuides(): Guide[] {
  return getAllGuides().filter((g) => isPublished(g.frontmatter.status));
}

export function getPublicGuidesByCategory(
  category: GuideFrontmatter["category"]
): Guide[] {
  return getPublicGuides().filter((g) => g.frontmatter.category === category);
}

export function getPublicProblems(): Problem[] {
  return getAllProblems().filter((p) => isPublished(p.frontmatter.status));
}

export function getPublicCities(): City[] {
  return getAllCities().filter((c) => isPublished(c.frontmatter.status));
}

/** Categories that have at least one publicly listed guide. */
export function getPublishedCategories(): GuideFrontmatter["category"][] {
  const published = getPublicGuides();
  return (Object.keys(CATEGORY_INFO) as GuideFrontmatter["category"][]).filter(
    (category) => published.some((g) => g.frontmatter.category === category)
  );
}

// --- Problems ---

export function getAllProblems(): Problem[] {
  return loadFromDir<ProblemFrontmatter>("problems", (fm) => {
    const f = fm as Record<string, unknown>;
    return {
      slug: f.slug as string,
      title: f.title as string,
      summary: f.summary as string,
      category: f.category as ProblemFrontmatter["category"],
      severity: (f.severity ?? "medium") as ProblemFrontmatter["severity"],
      last_verified: f.last_verified as string,
      status: (f.status ?? "draft") as ProblemFrontmatter["status"],
      sources: (f.sources ?? []) as ProblemFrontmatter["sources"],
      trigger_keywords: (f.trigger_keywords ?? []) as string[],
      diagnosis: f.diagnosis as ProblemFrontmatter["diagnosis"],
      related_guides: (f.related_guides ?? []) as string[],
    };
  });
}

export function getProblemBySlug(slug: string): Problem | undefined {
  return getAllProblems().find((p) => p.slug === slug);
}

// --- Cities ---

export function getAllCities(): City[] {
  return loadFromDir<CityFrontmatter>("cities", (fm) => {
    const f = fm as Record<string, unknown>;
    return {
      slug: f.slug as string,
      title: f.title as string,
      summary: f.summary as string,
      highlights: (f.highlights ?? []) as string[],
      transport_notes: f.transport_notes as string | undefined,
      payment_notes: f.payment_notes as string | undefined,
      last_verified: f.last_verified as string,
      status: (f.status ?? "draft") as CityFrontmatter["status"],
      related_guides: (f.related_guides ?? []) as string[],
      related_problems: (f.related_problems ?? []) as string[],
    };
  });
}

export function getCityBySlug(slug: string): City | undefined {
  return getAllCities().find((c) => c.slug === slug);
}

// --- All content for search ---

export interface SearchableItem {
  type: "guide" | "problem" | "city";
  slug: string;
  title: string;
  summary: string;
  category?: string;
  keywords?: string[];
  url: string;
}

export function getAllSearchable(): SearchableItem[] {
  const guides = getPublicGuides().map((g) => {
    const fm = g.frontmatter;
    // Reuse existing frontmatter fields as search keywords (no new content written).
    // Kept as short separate phrases so Fuse scores each one without position penalty.
    const keywords = [
      ...(fm.prerequisites ?? []).map((p) => p.item),
      ...(fm.steps ?? []).map((s) => s.title),
      ...(fm.backup_options ?? []).map((b) => b.condition),
      ...(fm.backup_options ?? []).map((b) => b.action),
      fm.expected_result ?? "",
    ].filter(Boolean);
    return {
      type: "guide" as const,
      slug: g.slug,
      title: fm.title,
      summary: fm.summary,
      category: fm.category,
      keywords,
      url: `/guides/${g.slug}`,
    };
  });
  const problems = getPublicProblems().map((p) => ({
    type: "problem" as const,
    slug: p.slug,
    title: p.frontmatter.title,
    summary: p.frontmatter.summary,
    category: p.frontmatter.category,
    keywords: p.frontmatter.trigger_keywords ?? [],
    url: `/problems/${p.slug}`,
  }));
  const cities = getPublicCities().map((c) => ({
    type: "city" as const,
    slug: c.slug,
    title: c.frontmatter.title,
    summary: c.frontmatter.summary,
    keywords: c.frontmatter.highlights ?? [],
    url: `/cities/${c.slug}`,
  }));
  return [...guides, ...problems, ...cities];
}
