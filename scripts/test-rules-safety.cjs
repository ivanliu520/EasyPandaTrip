/**
 * Phase 2B safety invariant test.
 *
 * Asserts that the rules layer NEVER removes, reorders, duplicates, or alters
 * problem-solver options. `applyContextRules(options)` takes only options and
 * returns a shallow copy in original order, so each node is invoked once.
 *
 * Run from the repo root:
 *   node scripts/test-rules-safety.cjs
 *
 * Exit 0 = every invariant holds. Exit 1 = at least one violation.
 * No test framework is used. No files are written.
 */
"use strict";

const fs = require("fs");
const path = require("path");

// Minimal TS->CJS loader: transpiles with the project's own typescript
// package and evaluates with a scoped require for relative imports.
function loadTsModule(entryFile) {
  const ts = require("typescript");
  const cache = {};

  function load(absPath) {
    if (cache[absPath]) return cache[absPath].exports;
    const source = fs.readFileSync(absPath, "utf8");
    const js = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;

    const module = { exports: {} };
    cache[absPath] = module;

    const localRequire = (spec) => {
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

let failures = 0;
function check(desc, ok, detail) {
  if (!ok) {
    failures++;
    console.error(`FAIL  ${desc}${detail ? ` — ${detail}` : ""}`);
  }
}

const { applyContextRules, decorateOptions } = loadTsModule("lib/rules.ts");
check(
  "applyContextRules is exported from lib/rules.ts",
  typeof applyContextRules === "function"
);
check(
  "decorateOptions is exported from lib/rules.ts",
  typeof decorateOptions === "function"
);
if (typeof applyContextRules !== "function" || typeof decorateOptions !== "function") process.exit(1);

const grayMatter = require("gray-matter");

// --- Discovery: parse every problem Markdown file from disk ---
const problemDir = path.join("content", "problems");
const problems = {};
for (const file of fs.readdirSync(problemDir).filter((f) => f.endsWith(".md"))) {
  const parsed = grayMatter(
    fs.readFileSync(path.join(problemDir, file), "utf8")
  );
  problems[parsed.data.slug] = parsed.data.diagnosis || [];
}

// --- Content inventory assertions (deliberate-change tripwires) ---
const EXPECTED_SLUGS = [
  "alipay-payment-failed",
  "cant-find-address",
  "cant-understand-chinese",
  "internet-not-working",
  "metro-payment-failed",
];
for (const slug of EXPECTED_SLUGS) {
  check(
    `expected problem slug discovered: ${slug}`,
    Object.prototype.hasOwnProperty.call(problems, slug) &&
      problems[slug].length > 0,
    `discovered slugs: ${Object.keys(problems).join(", ")}`
  );
}

let nodeCount = 0;
let optionCount = 0;
for (const nodes of Object.values(problems)) {
  for (const node of nodes) {
    nodeCount++;
    optionCount += (node.options || []).length;
  }
}
check("at least 10 diagnostic nodes discovered", nodeCount >= 10, `got ${nodeCount}`);
check("at least 30 options discovered", optionCount >= 30, `got ${optionCount}`);

// --- Preservation invariant: one invocation per node ---
for (const [slug, nodes] of Object.entries(problems)) {
  nodes.forEach((node, nodeIndex) => {
    const original = node.options;
    let out;
    try {
      out = applyContextRules(original);
    } catch (e) {
      check(`${slug} node ${nodeIndex + 1}`, false, `threw: ${e.message}`);
      return;
    }
    check(`${slug} node ${nodeIndex + 1} is array`, Array.isArray(out));
    check(
      `${slug} node ${nodeIndex + 1} non-empty`,
      out.length > 0,
      `got ${out.length} of ${original.length}`
    );
    check(
      `${slug} node ${nodeIndex + 1} count preserved`,
      out.length === original.length,
      `${out.length} !== ${original.length}`
    );
    if (!Array.isArray(out) || out.length !== original.length) return;
    for (let i = 0; i < original.length; i++) {
      check(
        `${slug} node ${nodeIndex + 1} option ${i} identity+order`,
        out[i] === original[i],
        `expected "${original[i].label}" at ${i}, got "${out[i].label}"`
      );
      check(
        `${slug} node ${nodeIndex + 1} option ${i} guidance unchanged`,
        out[i].recommended_action === original[i].recommended_action &&
          out[i].backup_action === original[i].backup_action &&
          out[i].emergency_option === original[i].emergency_option
      );
    }
  });
}

// --- Named regression assertions (content-anchored) ---
const alipay = problems["alipay-payment-failed"];
if (alipay && alipay.length >= 2) {
  const step1Labels = applyContextRules(alipay[0].options).map((o) => o.label);
  check(
    "alipay step-1 retains transaction-rejected option",
    step1Labels.some((l) => /transaction rejected/i.test(l)),
    JSON.stringify(step1Labels)
  );

  const step2 = applyContextRules(alipay[1].options);
  const step2Labels = step2.map((o) => o.label);
  check(
    "alipay step-2 retains both options",
    step2Labels.length === 2 &&
      step2Labels.some((l) => /^yes, it worked/i.test(l)) &&
      step2Labels.some((l) => /^no, still having trouble/i.test(l)),
    JSON.stringify(step2Labels)
  );

  const noOption = step2.find((o) => /^no, still having trouble/i.test(o.label));
  check(
    "alipay step-2 'No' option keeps Alipay support guidance",
    !!noOption && /alipay support/i.test(noOption.recommended_action),
    noOption && noOption.recommended_action
  );
  check(
    "alipay step-2 'No' option keeps WeChat Pay backup",
    !!noOption && /wechat pay/i.test(noOption.backup_action),
    noOption && noOption.backup_action
  );
  check(
    "alipay step-2 'No' option keeps ATM/cash emergency guidance",
    !!noOption && /atm/i.test(noOption.emergency_option) && /cash/i.test(noOption.emergency_option),
    noOption && noOption.emergency_option
  );
} else {
  check("alipay-payment-failed has >= 2 diagnostic nodes", false);
}

const addr = problems["cant-find-address"];
if (addr && addr.length >= 1) {
  const addrLabels = applyContextRules(addr[0].options).map((o) => o.label);
  check(
    "cant-find-address retains GPS option",
    addrLabels.some((l) => /gps is showing the wrong place/i.test(l)),
    JSON.stringify(addrLabels)
  );
} else {
  check("cant-find-address has >= 1 diagnostic node", false);
}

// --- Phase 2B.3c: decorateOptions contract tests ---

// Contract 1: output length === input length
// Contract 2: output[i].option === input[i] (identity per index)
// Contract 3: every original field preserved through nested reference
// Contract 4: hint is null or app-owned string
// Contract 5: default context → all hints null (no personalization on fresh visit)

function assertDecorationContract(original, context, label) {
  let dec;
  try {
    dec = decorateOptions(original, context);
  } catch (e) {
    check(`${label} decorate threw`, false, e.message);
    return;
  }
  check(`${label} length preserved`, dec.length === original.length);
  for (let i = 0; i < original.length; i++) {
    check(`${label}[${i}] identity`, dec[i].option === original[i]);
    check(`${label}[${i}] label`, dec[i].option.label === original[i].label);
    check(`${label}[${i}] recommended_action`, dec[i].option.recommended_action === original[i].recommended_action);
    check(`${label}[${i}] backup_action`, dec[i].option.backup_action === original[i].backup_action);
    check(`${label}[${i}] escalate_to`, dec[i].option.escalate_to === original[i].escalate_to);
    check(`${label}[${i}] emergency_option`, dec[i].option.emergency_option === original[i].emergency_option);
    check(`${label}[${i}] hint null-or-string`, dec[i].hint === null || typeof dec[i].hint === "string");
  }
}

// Default context — every problem, every node should have all-null hints
const defaultCtx = {
  has_visited_china_before: false,
  phone_os: "unknown",
  chinese_phone_number: "unknown",
  alipay: "unknown",
  wechat_pay: "unknown",
  international_card: "unknown",
  travel_cities: [],
};
for (const [slug, nodes] of Object.entries(problems)) {
  nodes.forEach((node, ni) => {
    const dec = decorateOptions(node.options, defaultCtx);
    dec.forEach((d, oi) => {
      check(`${slug}[${ni}].${oi} default ctx → hint=null`, d.hint === null);
    });
  });
}

// With alipay="not_ready" — annotated options in alipay-payment-failed and metro-payment-failed should fire
const notReadyCtx = { ...defaultCtx, alipay: "not_ready", wechat_pay: "not_ready" };
// alipay-payment-failed step-2 "No, still having trouble" has both requirements and should get a hint
if (alipay && alipay[1]) {
  const dec2 = decorateOptions(alipay[1].options, notReadyCtx);
  const noOpt = dec2.find((d) => /^no, still having trouble/i.test(d.option.label));
  check("alipay step-2 'No' option gets hint when alipay=not_ready", !!noOpt && noOpt.hint !== null, noOpt && noOpt.hint);
}

// metro-payment-failed step-1 should produce hints for both annotated options
const metro = problems["metro-payment-failed"];
if (metro && metro[0]) {
  const dec = decorateOptions(metro[0].options, notReadyCtx);
  const gateOpt = dec.find((d) => /at the qr code entry gate/i.test(d.option.label));
  const machineOpt = dec.find((d) => /ticket machine.*won't take my card/i.test(d.option.label));
  check("metro gate option gets hint when alipay=not_ready", !!gateOpt && gateOpt.hint !== null, gateOpt && gateOpt.hint);
  check("metro machine option gets hint when alipay=not_ready", !!machineOpt && machineOpt.hint !== null, machineOpt && machineOpt.hint);
}

// Contract assertions for every node (identity + field preservation)
for (const [slug, nodes] of Object.entries(problems)) {
  nodes.forEach((node, ni) => {
    assertDecorationContract(node.options, notReadyCtx, `${slug}[${ni}]`);
  });
}

// "ready" context should NOT trigger any hint (same as default)
const readyCtx = { ...defaultCtx, alipay: "ready", wechat_pay: "ready" };
for (const [slug, nodes] of Object.entries(problems)) {
  nodes.forEach((node, ni) => {
    const dec = decorateOptions(node.options, readyCtx);
    dec.forEach((d, oi) => {
      check(`${slug}[${ni}].${oi} ready ctx → hint=null`, d.hint === null);
    });
  });
}

// "unknown" context should NOT trigger any hint
for (const [slug, nodes] of Object.entries(problems)) {
  nodes.forEach((node, ni) => {
    const dec = decorateOptions(node.options, defaultCtx);
    dec.forEach((d, oi) => {
      check(`${slug}[${ni}].${oi} unknown ctx → hint=null`, d.hint === null);
    });
  });
}

// Malformed context param → all hints null (no crash, no wrong hints)
for (const [slug, nodes] of Object.entries(problems)) {
  nodes.forEach((node, ni) => {
    try {
      const dec = decorateOptions(node.options, null);
      dec.forEach((d) => check(`${slug}[${ni}] null ctx → hint=null`, d.hint === null));
    } catch (e) {
      check(`${slug}[${ni}] null ctx threw`, false, e.message);
    }
  });
}

// --- Phase 2B.3c.1: Multi-requirement asymmetric matching regression tests ---
// (These closed the 2B.3c audit's "first-match ordering" concern.)

// Test option with multiple requirements where only the SECOND is not_ready
const multiReqOpt = {
  label: "Switch payment methods",
  recommended_action: "Use WeChat Pay instead",
  requires: ["alipay_setup", "wechat_pay_setup"],
};

// alipay=ready, wechat=not_ready → should get WeChat hint (second requirement)
const asymWechatCtx = { ...defaultCtx, alipay: "ready", wechat_pay: "not_ready" };
const asymWechatDec = decorateOptions([multiReqOpt], asymWechatCtx);
check(
  "multi-req: alipay=ready,wechat=not_ready → WeChat hint",
  asymWechatDec[0].hint !== null && /wechat pay/i.test(asymWechatDec[0].hint),
  asymWechatDec[0].hint
);

// alipay=not_ready, wechat=ready → should get Alipay hint (first requirement)
const asymAlipayCtx = { ...defaultCtx, alipay: "not_ready", wechat_pay: "ready" };
const asymAlipayDec = decorateOptions([multiReqOpt], asymAlipayCtx);
check(
  "multi-req: alipay=not_ready,wechat=ready → Alipay hint",
  asymAlipayDec[0].hint !== null && /alipay/i.test(asymAlipayDec[0].hint),
  asymAlipayDec[0].hint
);

// both not_ready → should get first-matching hint (alipay)
const bothNotReadyCtx = { ...defaultCtx, alipay: "not_ready", wechat_pay: "not_ready" };
const bothDec = decorateOptions([multiReqOpt], bothNotReadyCtx);
check(
  "multi-req: both not_ready → first-matching hint",
  bothDec[0].hint !== null && /alipay/i.test(bothDec[0].hint),
  bothDec[0].hint
);

// both ready → null
const bothReadyCtx = { ...defaultCtx, alipay: "ready", wechat_pay: "ready" };
const bothReadyDec = decorateOptions([multiReqOpt], bothReadyCtx);
check(
  "multi-req: both ready → no hint",
  bothReadyDec[0].hint === null
);

// Mix with dormant requirement (not in REQUIREMENT_TO_CONTEXT_FIELD) → skipped
const mixedOpt = {
  label: "Complex option",
  recommended_action: "Do X",
  requires: ["chinese_phone_number", "wechat_pay_setup", "alipay_setup"],
};
const mixedDec = decorateOptions([mixedOpt], { ...defaultCtx, wechat_pay: "not_ready" });
check(
  "multi-req: dormant requirement skipped, active one fires",
  mixedDec[0].hint !== null && /wechat pay/i.test(mixedDec[0].hint),
  mixedDec[0].hint
);

// No requirements at all → null regardless of context
const noReqOpt = { label: "Simple", recommended_action: "Do Y" };
check(
  "no requires → null with not_ready ctx",
  decorateOptions([noReqOpt], notReadyCtx)[0].hint === null
);
check(
  "no requires → null with null ctx",
  decorateOptions([noReqOpt], null)[0].hint === null
);

// Empty requires [] → null regardless of context
const emptyReqOpt = { label: "Empty", recommended_action: "Do Z", requires: [] };
check(
  "empty requires → null with not_ready ctx",
  decorateOptions([emptyReqOpt], notReadyCtx)[0].hint === null
);

// has_visited_china_before never read for hints
const visitorCtx = { ...defaultCtx, has_visited_china_before: true, alipay: "ready" };
const visitorOpt = { label: "Visitor", recommended_action: "Do A", requires: ["alipay_setup"] };
const visitorDec = decorateOptions([visitorOpt], visitorCtx);
check(
  "has_visited_china_before=true with alipay=ready → null (no hint)",
  visitorDec[0].hint === null
);

// --- Phase 2B.3c.1: Malformed input regression tests ---

// null/undefined options array → empty result, no crash
try {
  const nullOpts = decorateOptions(null, defaultCtx);
  check("null options → empty array", Array.isArray(nullOpts) && nullOpts.length === 0);
} catch (e) {
  check("null options threw", false, e.message);
}

try {
  const undefOpts = decorateOptions(undefined, defaultCtx);
  check("undefined options → empty array", Array.isArray(undefOpts) && undefOpts.length === 0);
} catch (e) {
  check("undefined options threw", false, e.message);
}

// Empty options → empty result
check("empty options → empty array", decorateOptions([], defaultCtx).length === 0);

// Wrong-shaped context (string) → defensive fallback to all-null hints
try {
  const wrongCtxDec = decorateOptions([multiReqOpt], "bad-context");
  check("string ctx → hint=null", wrongCtxDec[0].hint === null);
} catch (e) {
  check("string ctx threw", false, e.message);
}

console.log(
  `\nchecked ${nodeCount} nodes, ${optionCount} options, ${Object.keys(problems).length} problem files, 7 named regressions, decoration contract`
);
if (failures > 0) {
  console.error(`RESULT: FAIL — ${failures} assertion(s) violated`);
  process.exit(1);
}
console.log("RESULT: PASS — all safety invariants hold");
process.exit(0);
