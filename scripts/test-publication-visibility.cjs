/**
 * Phase 3B.5D–3B.5F — Publication visibility regression test.
 *
 * Asserts the approved publication rule: only `status: "verified"` content is
 * publicly discoverable (listing, search, sitemap), while non-verified content
 * stays directly reachable for review but must not be indexed.
 *
 * Assertions are data-driven against the real content files, so adding a
 * `stale` / `outdated` / `draft` file automatically extends coverage without
 * editing this file. Every content file must also declare an explicit
 * supported status (`draft` | `verified` | `stale` | `outdated`).
 *
 * Route-level assertions inspect the prerendered HTML produced by
 * `npm run build` (actual route output, not source strings).
 *
 * Modes:
 *   node scripts/test-publication-visibility.cjs
 *       Local mode: missing build artifacts print explicit SKIP lines.
 *   REQUIRE_BUILD_ARTIFACTS=1 node scripts/test-publication-visibility.cjs
 *   node scripts/test-publication-visibility.cjs --require-artifacts
 *       Required mode: missing build artifacts, missing route HTML, a sitemap
 *       module that cannot be loaded, or build artifacts older than the
 *       sources they certify are all hard failures. The flag form is
 *       cross-platform (no shell-specific env syntax).
 *
 * Exit 0 = every invariant holds. Exit 1 = at least one violation.
 * No test framework is used. No files are written.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ROOT = process.cwd();
const REQUIRED =
  process.env.REQUIRE_BUILD_ARTIFACTS === "1" ||
  process.argv.includes("--require-artifacts");
// Vercel runs `next build` through the Build Output API: onBuildComplete moves
// the prerendered HTML into .vercel/output/functions/*.func, so the
// `.next/server/app/*.html` artifacts this script certifies do not exist by the
// time `postbuild` runs there. Detecting Vercel lets route-level checks be
// skipped explicitly instead of failing for an infrastructure reason.
const ON_VERCEL = process.env.VERCEL === "1";
const SUPPORTED_STATUSES = ["draft", "verified", "stale", "outdated"];

// Minimal TS->CJS loader (same shape as the other scripts). Adds `@/` alias
// resolution so app/sitemap.ts can be loaded; `next` is type-only there.
function loadTsModule(entryFile) {
  const ts = require("typescript");
  const cache = {};

  function load(absPath) {
    if (cache[absPath]) return cache[absPath].exports;
    const source = fs.readFileSync(absPath, "utf8");
    const js = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        // lib/content.ts uses default imports (path, fs, gray-matter).
        esModuleInterop: true,
      },
    }).outputText;

    const module = { exports: {} };
    cache[absPath] = module;

    const localRequire = (spec) => {
      if (spec === "next") return {};
      if (spec.startsWith("@/")) {
        return load(path.join(ROOT, spec.slice(2)) + ".ts");
      }
      if (!spec.startsWith(".")) return require(spec);
      const resolved = path.resolve(path.dirname(absPath), spec) + ".ts";
      return load(resolved);
    };

    new Function("exports", "require", "module", "__filename", "__dirname", js)(
      module.exports,
      localRequire,
      module,
      absPath,
      path.dirname(absPath)
    );
    return module.exports;
  }

  return load(path.resolve(entryFile));
}

let checks = 0;
let failures = 0;
let skips = 0;

function check(desc, ok, detail) {
  checks++;
  if (!ok) {
    failures++;
    console.error(`FAIL  ${desc}${detail ? ` — ${detail}` : ""}`);
  }
}

// A skipped check is only acceptable in local mode or on Vercel, where route
// artifacts are unavailable by design. Elsewhere in required mode a skip is a
// failure, so a green local run always means the route-level checks executed.
function skip(desc, reason) {
  if (REQUIRED && !ON_VERCEL) {
    check(desc, false, `required build artifacts unavailable — ${reason}`);
    return;
  }
  skips++;
  console.log(`SKIP${ON_VERCEL ? " (vercel)" : ""}  ${desc} — ${reason}`);
}

// --- Ground truth: read every content file from disk ---
const CONTENT_SPECS = [
  { kind: "guide", dir: "guides", basePath: "/guides", artifactDir: "guides" },
  { kind: "problem", dir: "problems", basePath: "/problems", artifactDir: "problems" },
  { kind: "city", dir: "cities", basePath: "/cities", artifactDir: "cities" },
];

const disk = {};
for (const spec of CONTENT_SPECS) {
  const full = path.join(ROOT, "content", spec.dir);
  disk[spec.kind] = fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data } = matter(fs.readFileSync(path.join(full, f), "utf8"));
      return { slug: f.replace(/\.md$/, ""), status: data.status, category: data.category };
    });

  // Every file must declare an explicit, supported status. Missing status is
  // reported here; the runtime loaders now default it to "draft" (fail-closed).
  for (const item of disk[spec.kind]) {
    check(
      `${spec.kind} '${item.slug}' declares a supported status`,
      typeof item.status === "string" &&
        SUPPORTED_STATUSES.includes(item.status),
      `got: ${JSON.stringify(item.status)}`
    );
  }
}

const verifiedOf = (kind) =>
  disk[kind].filter((i) => i.status === "verified").map((i) => i.slug).sort();
const nonVerifiedOf = (kind) =>
  // Anything not exactly "verified" is non-public, including missing status
  // (which the loader now resolves to "draft").
  disk[kind].filter((i) => i.status !== "verified");

const verifiedGuides = verifiedOf("guide");
const verifiedProblems = verifiedOf("problem");
const verifiedCities = verifiedOf("city");

// --- Data-level assertions against the real exported API ---
const content = loadTsModule("lib/content.ts");

const publicProblems = content.getPublicProblems();
const publicProblemSlugs = publicProblems.map((p) => p.slug).sort();

check("at least one public problem exists", publicProblems.length > 0);
check(
  "every public problem reports status 'verified'",
  publicProblems.every((p) => p.frontmatter.status === "verified"),
  publicProblems
    .filter((p) => p.frontmatter.status !== "verified")
    .map((p) => `${p.slug}=${p.frontmatter.status}`)
    .join(", ")
);
check(
  "every verified problem is public",
  verifiedProblems.every((s) => publicProblemSlugs.includes(s)),
  `missing: ${verifiedProblems
    .filter((s) => !publicProblemSlugs.includes(s))
    .join(", ")}`
);
for (const p of nonVerifiedOf("problem")) {
  check(
    `non-verified problem '${p.slug}' (${p.status}) excluded from public set`,
    !publicProblemSlugs.includes(p.slug)
  );
}

const publicGuides = content.getPublicGuides();
const publicGuideSlugs = publicGuides.map((g) => g.slug);
check("at least one public guide exists", publicGuides.length > 0);
check(
  "every public guide reports status 'verified'",
  publicGuides.every((g) => g.frontmatter.status === "verified"),
  publicGuides
    .filter((g) => g.frontmatter.status !== "verified")
    .map((g) => `${g.slug}=${g.frontmatter.status}`)
    .join(", ")
);

const publicCities = content.getPublicCities();
const publicCitySlugs = publicCities.map((c) => c.slug).sort();

check("at least one public city exists", publicCities.length > 0);
check(
  "every public city reports status 'verified'",
  publicCities.every((c) => c.frontmatter.status === "verified"),
  publicCities
    .filter((c) => c.frontmatter.status !== "verified")
    .map((c) => `${c.slug}=${c.frontmatter.status}`)
    .join(", ")
);
check(
  "every verified city is public",
  verifiedCities.every((s) => publicCitySlugs.includes(s)),
  `missing: ${verifiedCities.filter((s) => !publicCitySlugs.includes(s)).join(", ")}`
);
for (const c of nonVerifiedOf("city")) {
  check(
    `non-verified city '${c.slug}' (${c.status}) excluded from public set`,
    !publicCitySlugs.includes(c.slug)
  );
}

// --- Search aggregation ---
const searchable = content.getAllSearchable();
const searchProblemSlugs = searchable
  .filter((item) => item.type === "problem")
  .map((item) => item.slug)
  .sort();
const searchCitySlugs = searchable
  .filter((item) => item.type === "city")
  .map((item) => item.slug)
  .sort();

for (const p of nonVerifiedOf("problem")) {
  check(
    `search excludes non-verified problem '${p.slug}'`,
    !searchProblemSlugs.includes(p.slug)
  );
}
check(
  "search includes every verified problem",
  verifiedProblems.every((s) => searchProblemSlugs.includes(s)),
  `missing: ${verifiedProblems
    .filter((s) => !searchProblemSlugs.includes(s))
    .join(", ")}`
);
check(
  "every searchable problem is in the public set",
  searchProblemSlugs.every((s) => publicProblemSlugs.includes(s)),
  searchProblemSlugs.filter((s) => !publicProblemSlugs.includes(s)).join(", ")
);

for (const c of nonVerifiedOf("city")) {
  check(
    `search excludes non-verified city '${c.slug}'`,
    !searchCitySlugs.includes(c.slug)
  );
}
check(
  "search includes every verified city",
  verifiedCities.every((s) => searchCitySlugs.includes(s)),
  `missing: ${verifiedCities.filter((s) => !searchCitySlugs.includes(s)).join(", ")}`
);

// --- Sitemap ---
try {
  const sitemapModule = loadTsModule("app/sitemap.ts");
  const entries = (sitemapModule.default || sitemapModule)();
  const urls = entries.map((e) => e.url);
  const slugsFrom = (prefix) =>
    urls
      .filter((u) => new RegExp(`/${prefix}/[^/]+$`).test(u))
      .map((u) => u.split("/").pop())
      .sort();

  const sitemapProblems = slugsFrom("problems");
  const sitemapCities = slugsFrom("cities");

  for (const p of nonVerifiedOf("problem")) {
    check(
      `sitemap excludes non-verified problem '${p.slug}'`,
      !sitemapProblems.includes(p.slug)
    );
  }
  check(
    "sitemap includes every verified problem",
    verifiedProblems.every((s) => sitemapProblems.includes(s)),
    `missing: ${verifiedProblems
      .filter((s) => !sitemapProblems.includes(s))
      .join(", ")}`
  );

  for (const c of nonVerifiedOf("city")) {
    check(
      `sitemap excludes non-verified city '${c.slug}'`,
      !sitemapCities.includes(c.slug)
    );
  }
  check(
    "sitemap includes every verified city",
    verifiedCities.every((s) => sitemapCities.includes(s)),
    `missing: ${verifiedCities.filter((s) => !sitemapCities.includes(s)).join(", ")}`
  );
} catch (e) {
  skip("sitemap entries", `could not load app/sitemap.ts: ${e.message}`);
}

// --- Route-level assertions from prerendered output ---
const APP_DIR = path.join(ROOT, ".next", "server", "app");
const NOINDEX_RE = /<meta name="robots" content="noindex, follow"/;

function readArtifact(relPath, desc) {
  const file = path.join(APP_DIR, relPath);
  if (!fs.existsSync(file)) {
    skip(desc, `${relPath} not found in build output`);
    return null;
  }
  checkArtifactFreshness(file, relPath);
  return fs.readFileSync(file, "utf8");
}

function checkListing(spec, listingFile) {
  const html = readArtifact(listingFile, `rendered ${spec.basePath} listing`);
  if (html === null) return;
  for (const slug of verifiedOf(spec.kind)) {
    check(
      `${spec.basePath} listing links verified ${spec.kind} '${slug}'`,
      html.includes(`href="${spec.basePath}/${slug}"`)
    );
  }
  for (const item of nonVerifiedOf(spec.kind)) {
    check(
      `${spec.basePath} listing does not link non-verified ${spec.kind} '${item.slug}'`,
      !html.includes(`${spec.basePath}/${item.slug}`)
    );
  }
}

function checkDetailMetadata(spec, item) {
  const html = readArtifact(
    path.join(spec.artifactDir, `${item.slug}.html`),
    `rendered metadata for ${spec.kind} '${item.slug}'`
  );
  if (html === null) return;

  if (item.status === "verified") {
    check(
      `verified ${spec.kind} '${item.slug}' is not noindex`,
      !html.includes('content="noindex')
    );
  } else {
    check(
      `non-verified ${spec.kind} '${item.slug}' emits noindex, follow`,
      NOINDEX_RE.test(html)
    );
  }
}

// --- Freshness guard ---
// Build artifacts are only meaningful evidence if they were produced after the
// sources they are meant to certify. The rule is deliberately conservative:
// the newest mtime anywhere in the build output must not be older than the
// newest mtime of files that can change rendered output.
//
// Scope choices:
//   - Scanned: content/ (Markdown), app/ (routes), lib/ (data layer),
//     package.json, next.config.ts.
//   - Excluded: .next, node_modules, .git, .screenshots (not sources), and
//     scripts/ (editing a test or the validator does not change build output,
//     so it must not force a rebuild).
//   - docs/ is excluded: it does not affect rendered output.
// Assumption: filesystem mtimes are meaningful; a 2s tolerance absorbs coarse
// timestamp resolution and copy-time skew between files and artifacts.
const FRESHNESS_SOURCE_DIRS = ["content", "app", "lib"];
const FRESHNESS_SOURCE_FILES = ["package.json", "next.config.ts"];
const FRESHNESS_IGNORED = new Set([".next", "node_modules", ".git", ".screenshots"]);
const MTIME_TOLERANCE_MS = 2000;

function newestMtime(target) {
  const stat = fs.statSync(target);
  if (!stat.isDirectory()) return stat.mtimeMs;
  let newest = 0;
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (FRESHNESS_IGNORED.has(entry.name)) continue;
    const full = path.join(target, entry.name);
    const m = entry.isDirectory() ? newestMtime(full) : fs.statSync(full).mtimeMs;
    if (m > newest) newest = m;
  }
  return newest;
}

// Returns { ok, error, newest }. Never swallows a failure: an unreadable
// source directory becomes an error, which is always reported as a failure.
function measureSourceFreshness() {
  try {
    let newest = 0;
    for (const rel of FRESHNESS_SOURCE_DIRS) {
      const full = path.join(ROOT, rel);
      if (fs.existsSync(full)) {
        newest = Math.max(newest, newestMtime(full));
      }
    }
    for (const rel of FRESHNESS_SOURCE_FILES) {
      const full = path.join(ROOT, rel);
      if (fs.existsSync(full)) {
        newest = Math.max(newest, fs.statSync(full).mtimeMs);
      }
    }
    return { ok: true, newest };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Freshness state, populated before any artifact is read:
//   sourceFreshness — newest source mtime, computed once per run
//   staleArtifacts  — local-mode NOTE list; required mode fails per artifact
let sourceFreshness = null;
const staleArtifacts = [];

// Per-artifact freshness. Comparing each required artifact to the newest source
// mtime closes the hole where one freshly written, unrelated artifact made a
// stale route artifact look current. A missing artifact is reported by
// readArtifact (and is a hard failure in required mode), so this function only
// runs for files that exist — no duplicate error for the same file.
function checkArtifactFreshness(file, relPath) {
  if (!sourceFreshness || !sourceFreshness.ok) return; // already reported once
  let mtime;
  try {
    mtime = fs.statSync(file).mtimeMs;
  } catch (e) {
    check(`artifact '${relPath}' timestamp can be read`, false, e.message);
    return;
  }
  if (mtime + MTIME_TOLERANCE_MS >= sourceFreshness.newest) return;

  const detail =
    `artifact ${new Date(mtime).toISOString()} is older than newest source ` +
    `${new Date(sourceFreshness.newest).toISOString()}`;
  if (REQUIRED) {
    check(`artifact '${relPath}' is newer than the sources it certifies`, false, detail);
  } else {
    staleArtifacts.push(`${relPath} — ${detail}`);
  }
}

if (!fs.existsSync(APP_DIR)) {
  skip(
    "rendered route artifacts",
    "no .next build artifacts — run `npm run build` first"
  );
} else {
  sourceFreshness = measureSourceFreshness();
  if (!sourceFreshness.ok) {
    // Timestamps cannot be compared reliably: fail rather than silently pass.
    check(
      "source timestamps can be read for the freshness guard",
      false,
      sourceFreshness.error
    );
  }

  for (const spec of CONTENT_SPECS) {
    checkListing(spec, `${spec.dir}.html`);
    for (const item of disk[spec.kind]) {
      checkDetailMetadata(spec, item);
    }
  }

  // --- Phase 3B.6E: extended route artifact coverage ---
  // Every lookup below goes through readArtifact, so each newly required
  // artifact inherits the existing required-mode failure and the per-artifact
  // freshness rule (no duplicate missing/freshness reports).

  const guideHrefs = (html) => {
    const out = new Set();
    for (const part of html.split('href="/guides/').slice(1)) {
      out.add(part.split('"')[0]);
    }
    return out;
  };
  // "/guides/category/x" -> category path; "/guides/x" -> detail slug.
  const detailHrefs = (set) => [...set].filter((h) => !h.includes("/"));

  // A. Homepage
  const home = readArtifact("index.html", "rendered / homepage");
  if (home !== null) {
    const homeGuides = detailHrefs(guideHrefs(home));
    check(
      "homepage links only public guides",
      homeGuides.every((s) => publicGuideSlugs.includes(s)),
      homeGuides.filter((s) => !publicGuideSlugs.includes(s)).join(", ")
    );
    for (const g of publicGuides.slice(0, 3)) {
      check(`homepage features public guide '${g.slug}'`, homeGuides.includes(g.slug));
    }
    for (const p of nonVerifiedOf("problem")) {
      check(
        `homepage does not link non-verified problem '${p.slug}'`,
        !home.includes(`/problems/${p.slug}`)
      );
    }
  }

  // B. Category pages
  const publishedCategories = content.getPublishedCategories();
  check("at least one published category exists", publishedCategories.length > 0);
  for (const cat of publishedCategories) {
    const html = readArtifact(`guides/category/${cat}.html`, `rendered category '${cat}'`);
    if (html === null) continue;
    const catGuides = detailHrefs(guideHrefs(html));
    check(
      `category '${cat}' links only public guides`,
      catGuides.every((s) => publicGuideSlugs.includes(s)),
      catGuides.filter((s) => !publicGuideSlugs.includes(s)).join(", ")
    );
  }
  // A declared category with no published guides must not have a route
  // artifact. CATEGORY_INFO is the declared list; if it cannot be loaded,
  // fall back to the categories actually present in the corpus.
  let declaredCategories;
  try {
    declaredCategories = Object.keys(loadTsModule("lib/types.ts").CATEGORY_INFO);
  } catch (e) {
    declaredCategories = [...new Set(disk.guide.map((g) => g.category).filter(Boolean))];
  }
  for (const cat of declaredCategories) {
    if (publishedCategories.includes(cat)) continue;
    check(
      `unpublished category '${cat}' has no route artifact`,
      !fs.existsSync(path.join(APP_DIR, "guides", "category", `${cat}.html`))
    );
  }

  // C. Search — the page serialises the searchable corpus into the flight
  // payload, so slug presence/absence there is a reliable structural signal.
  const search = readArtifact("search.html", "rendered /search page");
  if (search !== null) {
    for (const p of nonVerifiedOf("problem")) {
      check(`search payload excludes non-verified problem '${p.slug}'`, !search.includes(p.slug));
    }
    for (const g of nonVerifiedOf("guide")) {
      check(`search payload excludes non-verified guide '${g.slug}'`, !search.includes(g.slug));
    }
    for (const g of publicGuides) {
      check(`search payload includes public guide '${g.slug}'`, search.includes(g.slug));
    }
  }

  // D. Preparation checklist. The static artifact renders the server-side
  // shell only; checklist entries (and their guide links) are computed
  // client-side from stored state, so a draft guide link appears after
  // hydration via lib/checklist.ts, not in this artifact. TASK_MAP links are
  // covered at the data level by scripts/test-traveler-context.cjs.
  const ready = readArtifact("ready.html", "rendered /ready page");
  if (ready !== null) {
    for (const g of nonVerifiedOf("guide")) {
      check(
        `/ready static output does not link non-verified guide '${g.slug}'`,
        !ready.includes(`/guides/${g.slug}`)
      );
    }
  }

  // E. Generated sitemap and robots output (not just the functions behind them)
  const sitemapXml = readArtifact("sitemap.xml.body", "generated sitemap.xml");
  if (sitemapXml !== null) {
    const locs = sitemapXml
      .split("<loc>")
      .slice(1)
      .map((p) => p.split("</loc>")[0]);
    check(
      "sitemap.xml is a urlset with entries",
      sitemapXml.includes("<urlset") && locs.length > 0
    );
    const includes = (path_) => locs.some((u) => u.endsWith(path_));
    for (const s of verifiedGuides) check(`sitemap includes verified guide '${s}'`, includes(`/guides/${s}`));
    for (const s of verifiedProblems) check(`sitemap includes verified problem '${s}'`, includes(`/problems/${s}`));
    for (const s of verifiedCities) check(`sitemap includes verified city '${s}'`, includes(`/cities/${s}`));
    for (const cat of publishedCategories) {
      check(`sitemap includes category '${cat}'`, includes(`/guides/category/${cat}`));
    }
    for (const p of nonVerifiedOf("problem")) {
      check(`sitemap excludes non-verified problem '${p.slug}'`, !includes(`/problems/${p.slug}`));
    }
    for (const g of nonVerifiedOf("guide")) {
      check(`sitemap excludes non-verified guide '${g.slug}'`, !includes(`/guides/${g.slug}`));
    }
    for (const c of nonVerifiedOf("city")) {
      check(`sitemap excludes non-verified city '${c.slug}'`, !includes(`/cities/${c.slug}`));
    }
  }

  const robotsTxt = readArtifact("robots.txt.body", "generated robots.txt");
  if (robotsTxt !== null) {
    check(
      "robots.txt allows crawling",
      /User-Agent:\s*\*/i.test(robotsTxt) && /^\s*Allow:\s*\/\s*$/im.test(robotsTxt)
    );
    check("robots.txt references the sitemap", /^\s*Sitemap:\s*https?:\/\//im.test(robotsTxt));
  }

  if (staleArtifacts.length > 0) {
    console.log(
      `NOTE  ${staleArtifacts.length} artifact(s) may be stale — run \`npm run build\`:\n  ` +
        staleArtifacts.join("\n  ")
    );
  }
}

const totalFiles = disk.guide.length + disk.problem.length + disk.city.length;
console.log(
  `\nchecked ${checks} assertions across ${totalFiles} content files` +
    (skips > 0 ? ` (${skips} route-level check(s) skipped)` : "")
);
if (ON_VERCEL && skips > 0) {
  console.log(
    "NOTE  Vercel build: route-level assertions did not run (prerendered HTML is " +
      "packaged into the Build Output API, not .next/server/app). Every data-level " +
      "assertion above did run."
  );
}

if (failures > 0) {
  console.error(`RESULT: FAIL — ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("RESULT: PASS — all publication-visibility invariants hold");
