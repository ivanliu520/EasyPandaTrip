const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ROOT = path.join(process.cwd(), "content");
const GUIDES = path.join(ROOT, "guides");
const PROBLEMS = path.join(ROOT, "problems");
const CITIES = path.join(ROOT, "cities");

let issues = 0;
const log = (sev, file, msg) => {
  issues++;
  console.log(`[${sev}] ${file}: ${msg}`);
};

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isArr = (v) => Array.isArray(v);

function walk(dir) {
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch (e) {
    // Missing, unreadable, or non-directory paths are reported once by
    // checkRequiredDirs(); returning [] here keeps the remaining directories
    // validating instead of aborting with an fs stack trace.
    return [];
  }
}

// Every required content directory must exist, be a directory, be readable,
// and contain at least one Markdown file. A vanished or emptied directory used
// to look like a valid empty collection (walk() returns [] and the loaders
// return []), which let the build succeed with content silently missing.
const REQUIRED_DIRS = [
  { rel: "guides", full: GUIDES },
  { rel: "problems", full: PROBLEMS },
  { rel: "cities", full: CITIES },
];

function checkRequiredDirs() {
  for (const d of REQUIRED_DIRS) {
    let stat;
    try {
      stat = fs.statSync(d.full);
    } catch (e) {
      log("ERR", d.rel, "missing required content directory");
      continue;
    }
    if (!stat.isDirectory()) {
      log("ERR", d.rel, "not a directory");
      continue;
    }
    let entries;
    try {
      entries = fs.readdirSync(d.full);
    } catch (e) {
      log("ERR", d.rel, `cannot read required content directory — ${e.message}`);
      continue;
    }
    // walk() is flat (non-recursive), so the count matches what it will see.
    if (entries.filter((f) => f.endsWith(".md")).length === 0) {
      log("ERR", d.rel, "no Markdown content files found");
    }
  }
}

checkRequiredDirs();

// Parse one Markdown file. A read or parse failure is reported against the
// file and that file is skipped for the remaining checks — it never aborts the
// whole run and never substitutes empty metadata.
function parseFile(dir, f, rel) {
  let raw;
  try {
    raw = fs.readFileSync(path.join(dir, f), "utf-8");
  } catch (e) {
    log("ERR", rel, `unreadable file — ${e.message}`);
    return null;
  }
  try {
    return matter(raw);
  } catch (e) {
    const detail = String((e && (e.reason || e.message)) || e).split("\n")[0].trim();
    log("ERR", rel, `invalid frontmatter — ${detail}`);
    return null;
  }
}

// Slug uniqueness is checked on the frontmatter slug, because that is what
// routes and cross-file references resolve against. Filename-derived slugs can
// never collide within one directory, so they are only collected for the
// reference pass above.
function checkDuplicateSlug(slugs, fm, file, type) {
  if (!isStr(fm.slug)) return;
  if (slugs.has(fm.slug)) log("ERR", file, `duplicate ${type} slug: ${fm.slug}`);
  slugs.add(fm.slug);
}

const guideSlugs = new Set();
const problemSlugs = new Set();
const citySlugs = new Set();
const allGuideSlugs = new Set();
const allProblemSlugs = new Set();

// First pass: filename-derived slugs, used for cross-file reference checks.
for (const f of walk(GUIDES)) allGuideSlugs.add(f.replace(/\.md$/, ""));
for (const f of walk(PROBLEMS)) allProblemSlugs.add(f.replace(/\.md$/, ""));

const VALID_GUIDE_CATS = ["prepare", "get-around", "pay", "daily-life"];
const VALID_PROBLEM_CATS = ["payment","transport","internet","language","emergency","other"];
const VALID_SEVERITY = ["low","medium","high","emergency"];
const VALID_STATUS = ["draft","verified","stale","outdated"];
const VALID_CITY = ["all","beijing","shanghai"];
const VALID_SOURCE_TYPES = ["official","community","news"];
// Phase 2B.3a — option metadata literals (additive, optional)
const VALID_OPTION_TOPICS = ["alipay","wechat_pay","chinese_number","international_card","cash_atm","metro","vpn","maps","staff"];
const VALID_OPTION_REQUIREMENTS = ["alipay_setup","wechat_pay_setup","chinese_phone_number","international_card"];

function checkBase(fm, file, kind) {
  if (!isStr(fm.slug)) log("ERR", file, "missing slug");
  if (!isStr(fm.title)) log("ERR", file, "missing title");
  if (!isStr(fm.summary)) log("ERR", file, "missing summary");
  if (!isStr(fm.last_verified)) log("ERR", file, "missing last_verified");
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(fm.last_verified)) log("ERR", file, `last_verified not YYYY-MM-DD: ${fm.last_verified}`);
  if (!isStr(fm.status)) log("ERR", file, "missing status");
  else if (!VALID_STATUS.includes(fm.status)) log("ERR", file, `invalid status: ${fm.status}`);
}

function checkSources(sources, file) {
  if (sources === undefined) return;
  if (!isArr(sources)) { log("ERR", file, "sources not array"); return; }
  for (const s of sources) {
    if (!isStr(s.name)) log("ERR", file, "source missing name");
    if (!isStr(s.url)) log("ERR", file, `source "${s.name}" missing url`);
    else if (!/^https?:\/\//.test(s.url)) log("ERR", file, `source "${s.name}" url not http(s): ${s.url}`);
    if (s.type !== undefined && !VALID_SOURCE_TYPES.includes(s.type))
      log("ERR", file, `source "${s.name}" invalid type: ${s.type}`);
  }
}

// GUIDES
for (const f of walk(GUIDES)) {
  const file = `guides/${f}`;
  const parsed = parseFile(GUIDES, f, file);
  if (!parsed) continue;
  const { data: fm, content } = parsed;
  const slug = f.replace(/\.md$/, "");
  checkDuplicateSlug(guideSlugs, fm, file, "guide");

  checkBase(fm, file, "guide");
  if (fm.slug !== slug) log("ERR", file, `slug mismatch: file=${slug} fm=${fm.slug}`);
  if (!VALID_GUIDE_CATS.includes(fm.category)) log("ERR", file, `invalid category: ${fm.category}`);
  if (!isArr(fm.target_audience)) log("ERR", file, "target_audience not array");
  if (typeof fm.estimated_minutes !== "number") log("ERR", file, "estimated_minutes not number");
  checkSources(fm.sources, file);

  // city_scope
  if (fm.city_scope !== undefined) {
    const sc = fm.city_scope;
    if (typeof sc === "string") {
      if (!VALID_CITY.includes(sc)) log("ERR", file, `invalid city_scope: ${sc}`);
    } else if (isArr(sc)) {
      for (const c of sc) if (!VALID_CITY.includes(c)) log("ERR", file, `invalid city_scope item: ${c}`);
    } else log("ERR", file, "city_scope not string/array");
  }

  if (fm.prerequisites !== undefined) {
    if (!isArr(fm.prerequisites)) log("ERR", file, "prerequisites not array");
    else for (const p of fm.prerequisites) {
      if (!isStr(p.item)) log("ERR", file, "prerequisite missing item");
      if (typeof p.required !== "boolean") log("ERR", file, `prerequisite "${p.item}" required not boolean`);
    }
  }

  if (!isArr(fm.steps)) log("ERR", file, "steps not array");
  else {
    fm.steps.forEach((s, i) => {
      if (typeof s.order !== "number") log("ERR", file, `step[${i}] order not number`);
      if (!isStr(s.title)) log("ERR", file, `step[${i}] missing title`);
      if (!isStr(s.instruction)) log("ERR", file, `step[${i}] missing instruction`);
    });
  }

  if (fm.common_problems !== undefined) {
    if (!isArr(fm.common_problems)) log("ERR", file, "common_problems not array");
    else for (const p of fm.common_problems)
      if (!allProblemSlugs.has(p)) log("ERR", file, `common_problems refs missing problem: ${p}`);
  }
  if (fm.related_guides !== undefined) {
    if (!isArr(fm.related_guides)) log("ERR", file, "related_guides not array");
    else for (const g of fm.related_guides)
      if (!allGuideSlugs.has(g)) log("ERR", file, `related_guides refs missing guide: ${g}`);
  }

  // No H1 in body
  if (/^#\s/m.test(content)) log("ERR", file, "body contains H1 heading");
}

// PROBLEMS
for (const f of walk(PROBLEMS)) {
  const file = `problems/${f}`;
  const parsed = parseFile(PROBLEMS, f, file);
  if (!parsed) continue;
  const { data: fm, content } = parsed;
  const slug = f.replace(/\.md$/, "");
  checkDuplicateSlug(problemSlugs, fm, file, "problem");

  checkBase(fm, file, "problem");
  if (fm.slug !== slug) log("ERR", file, `slug mismatch: file=${slug} fm=${fm.slug}`);
  if (!VALID_PROBLEM_CATS.includes(fm.category)) log("ERR", file, `invalid category: ${fm.category}`);
  if (!VALID_SEVERITY.includes(fm.severity)) log("ERR", file, `invalid severity: ${fm.severity}`);
  checkSources(fm.sources, file);

  if (fm.trigger_keywords !== undefined && !isArr(fm.trigger_keywords))
    log("ERR", file, "trigger_keywords not array");

  if (!isArr(fm.diagnosis)) log("ERR", file, "diagnosis not array");
  else for (const d of fm.diagnosis) {
    if (!isStr(d.slug)) log("ERR", file, "diagnosis node missing slug");
    if (!isStr(d.question)) log("ERR", file, `diagnosis[${d.slug}] missing question`);
    if (!isArr(d.options)) log("ERR", file, `diagnosis[${d.slug}] options not array`);
    else for (const o of d.options) {
      if (!isStr(o.label)) log("ERR", file, `diagnosis[${d.slug}] option missing label`);
      if (!isStr(o.recommended_action)) log("ERR", file, `diagnosis[${d.slug}] option "${o.label}" missing recommended_action`);
      // Phase 2B.3a — optional metadata validation
      if (o.topic_tags !== undefined) {
        if (!isArr(o.topic_tags)) log("ERR", file, `diagnosis[${d.slug}] option "${o.label}" topic_tags not array`);
        else for (const t of o.topic_tags)
          if (!VALID_OPTION_TOPICS.includes(t)) log("ERR", file, `diagnosis[${d.slug}] option "${o.label}" invalid topic_tags value: ${t}`);
      }
      if (o.requires !== undefined) {
        if (!isArr(o.requires)) log("ERR", file, `diagnosis[${d.slug}] option "${o.label}" requires not array`);
        else for (const r of o.requires)
          if (!VALID_OPTION_REQUIREMENTS.includes(r)) log("ERR", file, `diagnosis[${d.slug}] option "${o.label}" invalid requires value: ${r}`);
      }
    }
  }

  if (fm.related_guides !== undefined) {
    if (!isArr(fm.related_guides)) log("ERR", file, "related_guides not array");
    else for (const g of fm.related_guides)
      if (!allGuideSlugs.has(g)) log("ERR", file, `related_guides refs missing guide: ${g}`);
  }

  if (/^#\s/m.test(content)) log("ERR", file, "body contains H1 heading");
}

// CITIES
for (const f of walk(CITIES)) {
  const file = `cities/${f}`;
  const parsed = parseFile(CITIES, f, file);
  if (!parsed) continue;
  const { data: fm, content } = parsed;
  const slug = f.replace(/\.md$/, "");
  checkDuplicateSlug(citySlugs, fm, file, "city");
  checkBase(fm, file, "city");
  if (fm.slug !== slug) log("ERR", file, `slug mismatch: file=${slug} fm=${fm.slug}`);
  checkSources(fm.sources, file);
  if (fm.highlights !== undefined && !isArr(fm.highlights))
    log("ERR", file, "highlights not array");

  if (fm.related_guides !== undefined) {
    if (!isArr(fm.related_guides)) log("ERR", file, "related_guides not array");
    else for (const g of fm.related_guides)
      if (!allGuideSlugs.has(g)) log("ERR", file, `related_guides refs missing guide: ${g}`);
  }
  if (fm.related_problems !== undefined) {
    if (!isArr(fm.related_problems)) log("ERR", file, "related_problems not array");
    else for (const p of fm.related_problems)
      if (!allProblemSlugs.has(p)) log("ERR", file, `related_problems refs missing problem: ${p}`);
  }

  if (/^#\s/m.test(content)) log("ERR", file, "body contains H1 heading");
}

const total = walk(GUIDES).length + walk(PROBLEMS).length + walk(CITIES).length;
console.log(`\nFILES_PARSED=${total} (guides=${walk(GUIDES).length}, problems=${walk(PROBLEMS).length}, cities=${walk(CITIES).length})`);
console.log(`TOTAL_ISSUES=${issues}`);
process.exit(issues > 0 ? 1 : 0);
