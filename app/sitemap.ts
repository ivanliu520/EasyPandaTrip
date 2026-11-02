import { MetadataRoute } from "next";
import {
  getPublicGuides,
  getPublicProblems,
  getPublicCities,
  getPublishedCategories,
} from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://easypandatrip.com";
  const now = new Date().toISOString();

  const staticPages = [
    { url: `${baseUrl}/`, lastModified: now },
    { url: `${baseUrl}/ready`, lastModified: now },
    { url: `${baseUrl}/guides`, lastModified: now },
    { url: `${baseUrl}/problems`, lastModified: now },
    { url: `${baseUrl}/cities`, lastModified: now },
    { url: `${baseUrl}/search`, lastModified: now },
    { url: `${baseUrl}/about`, lastModified: now },
  ];

  const guides = getPublicGuides().map((g) => ({
    url: `${baseUrl}/guides/${g.slug}`,
    lastModified: g.frontmatter.last_verified,
  }));

  // Only categories that actually have a published guide are listed.
  const guideCategories = getPublishedCategories().map((category) => ({
    url: `${baseUrl}/guides/category/${category}`,
    lastModified: now,
  }));

  const problems = getPublicProblems().map((p) => ({
    url: `${baseUrl}/problems/${p.slug}`,
    lastModified: p.frontmatter.last_verified,
  }));

  const cities = getPublicCities().map((c) => ({
    url: `${baseUrl}/cities/${c.slug}`,
    lastModified: c.frontmatter.last_verified,
  }));

  return [...staticPages, ...guides, ...guideCategories, ...problems, ...cities];
}
