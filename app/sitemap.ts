import { MetadataRoute } from "next";
import { getAllGuides, getAllProblems, getAllCities } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://chinatravelguide.app";
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

  const guides = getAllGuides().map((g) => ({
    url: `${baseUrl}/guides/${g.slug}`,
    lastModified: g.frontmatter.last_verified,
  }));

  const guideCategories = [
    { url: `${baseUrl}/guides/category/prepare`, lastModified: now },
    { url: `${baseUrl}/guides/category/get-around`, lastModified: now },
    { url: `${baseUrl}/guides/category/pay`, lastModified: now },
    { url: `${baseUrl}/guides/category/daily-life`, lastModified: now },
  ];

  const problems = getAllProblems().map((p) => ({
    url: `${baseUrl}/problems/${p.slug}`,
    lastModified: p.frontmatter.last_verified,
  }));

  const cities = getAllCities().map((c) => ({
    url: `${baseUrl}/cities/${c.slug}`,
    lastModified: c.frontmatter.last_verified,
  }));

  return [...staticPages, ...guides, ...guideCategories, ...problems, ...cities];
}
