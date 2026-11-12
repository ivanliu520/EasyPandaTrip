"use strict";
// Probe: validator logic for topic_tags/requires (mirrors scripts/validate-content.cjs)
const VALID_OPTION_TOPICS = ["alipay","wechat_pay","chinese_number","international_card","cash_atm","metro","vpn","maps","staff"];
const VALID_OPTION_REQUIREMENTS = ["alipay_setup","wechat_pay_setup","chinese_phone_number","international_card"];
let issues = 0;
const log = (f, m) => { issues++; console.log(`[ERR] ${f}: ${m}`); };
function checkOption(o, file, node) {
  if (o.topic_tags !== undefined) {
    if (!Array.isArray(o.topic_tags)) log(file, `diagnosis[${node}] option "${o.label}" topic_tags not array`);
    else for (const t of o.topic_tags) if (!VALID_OPTION_TOPICS.includes(t)) log(file, `diagnosis[${node}] option "${o.label}" invalid topic_tags value: ${t}`);
  }
  if (o.requires !== undefined) {
    if (!Array.isArray(o.requires)) log(file, `diagnosis[${node}] option "${o.label}" requires not array`);
    else for (const r of o.requires) if (!VALID_OPTION_REQUIREMENTS.includes(r)) log(file, `diagnosis[${node}] option "${o.label}" invalid requires value: ${r}`);
  }
}
let fails = 0;
function expect(name, got, want) { const ok = got === want; if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${name}: issues=${got} expected=${want}`); }

issues = 0; checkOption({ label: "A", recommended_action: "x" }, "p.md", "n1");
expect("missing metadata", issues, 0);

issues = 0; checkOption({ label: "B", recommended_action: "x", topic_tags: ["alipay", "cash_atm"], requires: ["alipay_setup"] }, "p.md", "n1");
expect("valid metadata", issues, 0);

issues = 0; checkOption({ label: "C", recommended_action: "x", topic_tags: ["bitcoin"], requires: ["has_visa"] }, "p.md", "n1");
expect("invalid literals", issues, 2);

issues = 0; checkOption({ label: "D", recommended_action: "x", topic_tags: "alipay", requires: "alipay_setup" }, "p.md", "n1");
expect("wrong types", issues, 2);

process.exit(fails === 0 ? 0 : 1);
