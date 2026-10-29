/**
 * Phase 2B.3b — Traveler-context migration + readiness persistence tests.
 *
 * Verifies the tri-state migration invariants against the real
 * lib/traveler-context.ts module. No test framework; asserts and exits 1 on
 * failure. No files written.
 *
 * Run from the repo root:
 *   node scripts/test-traveler-context.cjs
 */
"use strict";

const fs = require("fs");
const path = require("path");

// Reuse the same minimal TS loader as the safety test.
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
        // lib/content.ts uses default imports (`import path from "node:path"`);
        // without this the transpiled `.default` access is undefined.
        esModuleInterop: true,
      },
    }).outputText;
    const module = { exports: {} };
    cache[absPath] = module;
    const localRequire = (spec) => {
      if (!spec.startsWith(".")) return require(spec);
      const resolved = path.resolve(path.dirname(absPath), spec) + ".ts";
      return load(resolved);
    };
    new Function("exports", "require", "module", "__filename", "__dirname", js)(
      module.exports, localRequire, module, absPath, path.dirname(absPath)
    );
    return module.exports;
  }
  return load(path.resolve(entryFile));
}

// Mock window + localStorage BEFORE loading the module.
const store = new Map();
global.window = {};
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const tc = loadTsModule("lib/traveler-context.ts");
const {
  defaultTravelerContext,
  loadTravelerContext,
  updateTravelerContext,
} = tc;

const KEY = "ctg-traveler-context-v1";
let failures = 0;
function check(name, ok, detail) {
  if (!ok) { failures++; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
  else console.log(`PASS  ${name}`);
}
function setStored(obj) { store.set(KEY, JSON.stringify(obj)); }

// 1. Legacy TRUE -> ready
setStored({ first_trip_to_china: true, phone_os: "ios", has_chinese_phone_number: true, alipay_ready: true, wechat_pay_ready: true, has_international_card: true, travel_cities: ["beijing"] });
let c = loadTravelerContext();
check("legacy alipay_ready:true -> ready", c.alipay === "ready", c.alipay);
check("legacy wechat_pay_ready:true -> ready", c.wechat_pay === "ready", c.wechat_pay);
check("legacy has_chinese_phone_number:true -> ready", c.chinese_phone_number === "ready", c.chinese_phone_number);
check("legacy has_international_card:true -> ready", c.international_card === "ready", c.international_card);
check("legacy first_trip:true -> has_visited:false", c.has_visited_china_before === false);
check("legacy phone_os preserved", c.phone_os === "ios");
check("legacy travel_cities preserved", JSON.stringify(c.travel_cities) === '["beijing"]');

// 2. Legacy FALSE -> unknown (never not_ready)
setStored({ alipay_ready: false, wechat_pay_ready: false, has_chinese_phone_number: false, has_international_card: false });
c = loadTravelerContext();
check("legacy alipay_ready:false -> unknown", c.alipay === "unknown", c.alipay);
check("legacy wechat_pay_ready:false -> unknown", c.wechat_pay === "unknown");
check("legacy has_chinese_phone_number:false -> unknown", c.chinese_phone_number === "unknown");
check("legacy has_international_card:false -> unknown", c.international_card === "unknown");

// 3. Missing fields -> unknown
setStored({});
c = loadTravelerContext();
check("missing alipay -> unknown", c.alipay === "unknown");
check("missing phone_os -> unknown", c.phone_os === "unknown");
check("missing travel_cities -> []", Array.isArray(c.travel_cities) && c.travel_cities.length === 0);

// 4. Valid tri-state survives repeated loads unchanged (idempotent)
updateTravelerContext({ alipay: "not_ready", wechat_pay: "ready" });
const once = loadTravelerContext();
const twice = loadTravelerContext();
check("tri-state not_ready survives reload", once.alipay === "not_ready" && twice.alipay === "not_ready");
check("tri-state ready survives reload", once.wechat_pay === "ready" && twice.wechat_pay === "ready");
check("idempotent: unrelated readiness stays unknown", twice.chinese_phone_number === "unknown");

// 5. Valid unrelated fields preserved during update
store.clear();
updateTravelerContext({ phone_os: "android", travel_cities: ["shanghai", "beijing"] });
updateTravelerContext({ alipay: "not_ready" });
c = loadTravelerContext();
check("update preserves phone_os", c.phone_os === "android");
check("update preserves travel_cities", JSON.stringify(c.travel_cities) === '["shanghai","beijing"]');
check("update sets alipay", c.alipay === "not_ready");

// 6. Malformed storage does not crash
setStored(null); // JSON "null"
try { c = loadTravelerContext(); check("malformed null -> defaults", c.alipay === "unknown"); }
catch (e) { check("malformed null threw", false, e.message); }
store.set(KEY, "{not json");
try { c = loadTravelerContext(); check("malformed JSON -> defaults", c.alipay === "unknown"); }
catch (e) { check("malformed JSON threw", false, e.message); }
store.set(KEY, JSON.stringify([1, 2, 3]));
try { c = loadTravelerContext(); check("array top-level -> defaults", c.alipay === "unknown"); }
catch (e) { check("array top-level threw", false, e.message); }

// 7. No localStorage key -> defaults
store.clear();
c = loadTravelerContext();
check("empty storage -> default context", JSON.stringify(c) === JSON.stringify(defaultTravelerContext()));

// 8. Explicit not_ready is preserved (not overwritten by legacy absence)
store.clear();
updateTravelerContext({ alipay: "not_ready" });
c = loadTravelerContext();
check("explicit not_ready never becomes unknown", c.alipay === "not_ready");

// 9. Checklist task definitions must never link to an unpublished guide.
//    The checklist renders client-side, so a draft guideSlug here becomes a
//    live draft link in /ready after hydration even though the static HTML
//    artifact (checked in test-publication-visibility.cjs) has none.
store.clear();
const {
  TASK_MAP,
  QUESTIONS: checklistQuestions,
  getMissingTasks,
  getProgress,
  defaultAnswers,
} = loadTsModule("lib/checklist.ts");
const publishedGuides = new Set(
  loadTsModule("lib/content.ts").getPublicGuides().map((g) => g.slug)
);

// Guard against a vacuous pass if the content loader ever returns nothing.
check(
  "public guide set is non-empty for checklist link validation",
  publishedGuides.size > 0,
  `got ${publishedGuides.size} published guides`
);

const phrasesTask = TASK_MAP.has_chinese_phrases;
check(
  "checklist task 'has_chinese_phrases' still exists",
  !!phrasesTask && typeof phrasesTask.label === "string" && phrasesTask.label.length > 0,
  "missing TASK_MAP entry"
);
check(
  "checklist question 'has_chinese_phrases' still exists",
  checklistQuestions.some((q) => q.key === "has_chinese_phrases"),
  "missing QUESTIONS entry"
);
check(
  "checklist task 'has_chinese_phrases' does not link to a draft guide",
  !phrasesTask || !phrasesTask.guideSlug,
  phrasesTask && phrasesTask.guideSlug
    ? `still links to '${phrasesTask.guideSlug}'`
    : undefined
);

// Completion behavior is unchanged: reported while incomplete, dropped when done.
const incomplete = defaultAnswers();
check(
  "incomplete checklist still reports task 'has_chinese_phrases'",
  getMissingTasks(incomplete).some((m) => m.key === "has_chinese_phrases"),
  "task disappeared from the missing list"
);
check(
  "completing 'has_chinese_phrases' removes it from the missing list",
  !getMissingTasks({ ...incomplete, has_chinese_phrases: true }).some(
    (m) => m.key === "has_chinese_phrases"
  ),
  "task still reported as missing when answered"
);
const progressBase = getProgress(incomplete);
const progressWithPhrases = getProgress({ ...incomplete, has_chinese_phrases: true });
check(
  "task 'has_chinese_phrases' still counts toward progress",
  progressWithPhrases.done === progressBase.done + 1 &&
    progressWithPhrases.total === progressBase.total,
  `done ${progressBase.done}->${progressWithPhrases.done}, total ${progressBase.total}->${progressWithPhrases.total}`
);

// Every remaining guide link must resolve to a currently published guide.
for (const [key, task] of Object.entries(TASK_MAP)) {
  if (!task.guideSlug) continue;
  check(
    `checklist task '${key}' links only published guides`,
    publishedGuides.has(task.guideSlug),
    `task '${key}' links '${task.guideSlug}', which is not currently published`
  );
}

console.log("");
if (failures > 0) { console.error(`RESULT: FAIL — ${failures} assertion(s)`); process.exit(1); }
console.log("RESULT: PASS — all migration/readiness invariants hold");
process.exit(0);
