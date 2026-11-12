# Phase 2B.4 — Traveler Context Completion Design

Status: CLOSED — design only. No implementation in this document.
This document extends `phase-2b3-design.md` (the personalization design). It does not supersede its constraints.

---

## 0. Verified current-state findings (from source inspection, Oct 28 2026)

### Schema (matches 2B.3 final design)

```ts
export type Readiness = "ready" | "not_ready" | "unknown";
export type PhoneOS = "ios" | "android" | "unknown";
export interface TravelerContext {
  has_visited_china_before: boolean;
  phone_os: PhoneOS;
  chinese_phone_number: Readiness;
  alipay: Readiness;
  wechat_pay: Readiness;
  international_card: Readiness;
  travel_cities: string[];
}
```

Storage key: `ctg-traveler-context-v1` (in-place upgrade, idempotent migration).

### Personalization contract (unchanged from 2B.3)

- `applyContextRules()` preserves all options, order, references. Never filters.
- Hints are additive-only. Fire ONLY on explicit `"not_ready"`.
- `"ready"`, `"unknown"`, missing, malformed → no hint.
- Closed application-owned hint text set.
- No localStorage reads during SSR or hydration.
- `has_visited_china_before`, `phone_os`, `travel_cities` never read for hints.

### Content corpus (verified 5 problem files, 5 guide files, 2 city files)

- Diagnosis metadata: 4 of 30 options annotated with `requires[]` (alipay_setup, wechat_pay_setup). All in alipay-payment-failed.md and metro-payment-failed.md.
- Zero `escalate_to` fields in any diagnosis node.
- Zero `topic_tags` fields in any option (solver-inert, never used; optional).
- Guides mention SMS verification with "Chinese OR international" numbers. Guides mention international Visa/Mastercard as REQUIRED prerequisites.
- Cities (Beijing, Shanghai) have different transport/payment notes but no dynamic routing based on context.

### /ready UI (matches 2B.3c implementation)

- Explicit tri-state controls for **alipay** and **wechat_pay** only.
- Context fields `chinese_phone_number`, `international_card`, `phone_os`, `has_visited_china_before`, `travel_cities` → all display as defaults with no user control.
- Checklist (7 boolean questions) with 2 hidden (has_alipay/has_wechat_pay, replaced by tri-state). 5 remain as checkboxes.
- Profile summary shows all 7 fields including dormant ones.

### Test infrastructure

- 3 plain Node .cjs scripts: safety (decorateOptions contract + named regressions), migration (tri-state + malformed), validator (frontmatter shape).
- No React component test framework (no jest, vitest, @testing-library/react, playwright).
- Browser verification done via manual agent-based checks.

---

## 1. Field-by-field assessment

### B1. `chinese_phone_number` — **DEFER / DORMANT**

| Question | Answer |
|---|---|
| Source of truth | Default `"unknown"` only. No /ready control exists and no migration maps a user-explicit value. |
| Can user set it? | No. |
| Default = real answer? | No — `"unknown"` is correctly treated as unknown (not_ready requires explicit user action). |
| Guides requiring it? | **Zero.** Both Alipay and WeChat Pay guides explicitly state: *"A Chinese number is NOT required"* and *"Your home number works fine."* They require *any* phone that can receive SMS (Chinese SIM or roaming, home number is fine). |
| Diagnosis requiring it? | **Zero.** `cant-find-address.md` mentions "search for the Chinese phone number" — that's the **hotel's** number in Gaode Maps, not the traveler's. |
| Condition to affect recommendation | No content ever branches on this. |
| Risks | If we mistakenly add this, we'd warn travelers they need a Chinese number when they explicitly don't. |
| Decision | **Defer.** Content contradicts the field's reason to exist. Remove from schema when safe (separate cleanup phase). |

### B2. `international_card` — **DEFER / DORMANT — value gate did not find non-trivial use case**

| Question | Answer |
|---|---|
| Source of truth | Default `"unknown"`. No /ready control. Migration treats legacy `has_international_card: true` → `"ready"`, `false` → `"unknown"`. |
| Can user set it? | No. |
| Default = real answer? | No — `"unknown"` is correct default. |
| Guides requiring it? | **YES (verified).** `use-alipay-china.md` prerequisites list: *"International credit card (Visa/Mastercard/JCB) — required: true"* (line 25). `use-wechat-pay-china.md`: *"International Visa/Mastercard — required: true"* (line 20). |
| Diagnosis requiring it? | **One candidate, but zero non-trivial target population.** Value gate analysis (§0, 2B.4a.1) found exactly one diagnosis path with a genuine international card dependency: `alipay-payment-failed.md` step-2's emergency_option ("Find an ATM and withdraw yuan cash"). However, reaching that node requires the traveler to have Alipay set up (they tried to pay with it), and the Alipay guide lists international card as a `required: true` prerequisite. The `not_ready` population here is near-zero. See §2 matrix for the detailed per-option analysis. |
| Condition to affect recommendation | **Currently none.** A hint requires both: (a) a diagnosis option whose primary/backup/emergency action genuinely depends on international card possession, AND (b) a non-trivial population of `not_ready` travelers reaching that option. Neither condition is met by existing content. |
| Risks of conflation | Schema value means three different things: (a) "possesses an international card", (b) "card is supported in China", (c) "card is bound to Alipay/WeChat Pay". We conflate all three. This conflation would mislead both the hint implementer and the traveler reading the hint. |
| Risks of stale data | Low — card possession is relatively stable. A traveler who loses their card would rarely update the profile. (This risk is trivial compared to the zero-target-population issue.) |
| Risks of incorrect personalization | The metro "ticket machine won't take my card" scenario has a backwards hint direction by definition — users without international cards cannot have that scenario. Any hint there would fire on the wrong users. |
| Decision | **DEFER — keep dormant.** Do NOT add an international_card TriStateControl to /ready. Do NOT annotate diagnosis options with `requires: ["international_card"]`. Do NOT enable the dormant `REQUIREMENT_TO_CONTEXT_FIELD` mapping. Revisit when new diagnosis content creates a non-trivial `not_ready` population. Guide-level prerequisite awareness ("this guide needs an international card") is a legitimate separate product idea — track it as a future feature, not as diagnosis hinting. |

### B3. `phone_os` — **DEFER / DORMANT**

| Question | Answer |
|---|---|
| Source of truth | Default `"unknown"`. No /ready control. No migration for it (schema was always `"unknown"` on missing). |
| Can user set it? | No. |
| Materially different iOS/Android instructions? | **Zero.** Every guide uses generic phrasing: *"Search in your app store"*, *"Set up a VPN"*, *"Download Alipay"*. The only mentions are: eSIM support ("most modern iPhones and Android phones"), VPN installation (no platform-specific steps), and generic app store references. |
| Condition to affect recommendation | Nothing in content branches on OS. |
| Risks | Adding a UI control with zero downstream value wastes screen real estate and collects information without use. |
| Decision | **Defer.** Remove from schema when safe. If future content adds platform-specific steps, re-evaluate. |

### B4. `travel_cities` — **DEFER — SEPARATE FEATURE**

| Question | Answer |
|---|---|
| Source of truth | Default `[]`. No /ready control (no city selection UI exists). |
| Can user set it? | No. |
| Affects guides/options? | Content has city-specific facts (Maglev in Shanghai, Daxing Airport in Beijing, different metro notes). But the site already has `/cities/[city]` pages. No guide or diagnosis option branches on this field. |
| Affects diagnosis hints? | No existing diagnosis option mentions a city. Even if it did, the answer ("you're in Shanghai → try Maglev if maglev-payment-failed") is too broad. |
| Affects guide recommendations? | Yes — a user visiting Shanghai could skip Beijing-specific tips. But this is **content discovery/prioritization**, not hinting. It requires a different mechanism (guide filtering/prioritization on `/guides` and `/ready`). |
| Risks | Broad context rules without demonstrated benefit. Could hide useful generic content. Could create maintenance burden (every new guide/problem needs city tagging). |
| Decision | **Defer.** Treat as a separate feature (Phase 2C or later). When implemented, it's about guide filtering/prioritization, not diagnosis hints. |

### B5. `has_visited_china_before` — **DEFER / COSMETIC ONLY**

| Question | Answer |
|---|---|
| Source of truth | Default `false`. Legacy migration: `first_trip_to_china: true` (v1 default) → `has_visited_china_before: false`. Never explicitly set by UI. |
| Can user set it? | No. |
| Currently affects anything? | Only the profile summary badge on /ready ("First trip" / "Returning visitor"). |
| Affects guides/options? | Zero. No guide or diagnosis distinguishes first-time vs returning visitor. A returning visitor might skip beginner content or want refresher tips, but no content currently offers this. |
| Inferring from migration? | **NO.** Legacy default was `true` = "first trip". We migrated that to `false` = "has NOT visited". This is a correct migration of a default assumption, not a factual claim. But a returning visitor who never set `first_trip_to_china` in v1 would be incorrectly labeled "First trip" in v2. This is a **pre-existing** limitation (v1 had no explicit setting either), not a migration defect. |
| Risks of collecting without use | Users might be confused why a site asks this but never uses it. |
| Decision | **Defer.** Remove from schema when safe (along with chinese_phone_number, phone_os). If future content distinguishes first-time vs returning, re-evaluate. When/if we add a control, default must remain "unknown" semantics — `false` must be renamed or re-typed to `"unknown"` to match tri-state honesty. |

---

## 2. Context-to-recommendation matrix

Grounded in actual repository content. All references include exact file paths and option labels.

### Deferred — international_card (value gate 2B.4a.1 analysis)

The value gate completed a six-step per-option analysis of every diagnosis path that mentions international cards. Below is a summary of why none pass the dual bar of: (a) a genuine card dependency in primary/backup/emergency actions, AND (b) a non-trivial population of `not_ready` travelers that would reach the option. Estimated target population sizes are **product inferences**, not measured user data.

| Diagnosis option | Card dependency in primary/backup | Card dependency in emergency | Estimated `not_ready` population | Hint assessment |
|---|---|---|---|---|
| alipay step-2 "No, still having trouble" | **None** — primary is in-app support contact; backup is WeChat Pay switch | **YES — completely** ("Find an ATM and withdraw yuan cash... accept international cards") | **Near-zero (inference)** — reaching this node requires Alipay set up; Alipay guide lists international card as `required: true`. Only edge cases: travelers who topped up Alipay Balance via non-card means. | Hint would be HIGHLY useful IF it fired, but fires on almost no one. |
| alipay step-1 "'Transaction rejected' or 'Insufficient balance'" | **None** — recommendation is "Check bank cards OR balance is empty" (two independent causes); backup is WeChat Pay or cash | N/A | Unknown but the card mention is diagnostic ("merchant doesn't support international cards"), not prescriptive | Don't annotate — international card is a CAUSE of the error, not a REQUIREMENT for the fix. |
| metro "At the ticket machine — it won't take my card" | **None** — scenario itself requires user HAS a card; primary fix is different machine or Alipay/WeChat Pay; backup is customer service counter | N/A | **Impossible (definition)** — a traveler without an international card cannot have "my card was declined" | Hint direction is backwards by definition. Would fire on exactly the wrong users. |
| metro "At the QR code entry gate" | **None** — no international card mentioned in option text at all | N/A | N/A | Not a candidate. |

**Guide-level prerequisite awareness (separate product idea, not diagnosis hinting):**
Both `use-alipay-china.md` and `use-wechat-pay-china.md` mark "International Visa/Mastercard" as `required: true` prerequisites. A traveler without an international card landing on either guide page would waste time reading before realizing the prerequisite excludes them. A banner like *"This guide requires an international Visa/Mastercard. Not sure if you have one?"* would be genuinely useful. However, this requires client-side context loading on server-rendered static pages — architecturally distinct from diagnosis hinting. Track as a future product idea (e.g., Phase 2C), not as an item in this implementation.

### Already-implemented: alipay_setup, wechat_pay_setup

| Context field | Actual guide/problem | Exact option or instruction | Required value | Hint | Confidence |
|---|---|---|---|---|---|
| `alipay` | alipay-payment-failed.md step-1 option "'Transaction rejected' or 'Insufficient balance'" | `recommended_action`: "Check bank cards in Alipay" | `"not_ready"` | Already fires correctly | HIGH |
| `alipay` | alipay-payment-failed.md step-2 option "No, still having trouble" | `recommended_action`: "Contact Alipay support" | `"not_ready"` | Already fires correctly | HIGH |
| `alipay` | metro-payment-failed.md step-1 option "At the QR code entry gate" | `recommended_action`: "Use metro-specific Alipay QR code" | `"not_ready"` | Already fires correctly | HIGH |
| `alipay` | metro-payment-failed.md step-1 option "Ticket machine won't take my card" | `recommended_action`: "Pay with Alipay/WeChat at scanner" | `"not_ready"` | Already fires correctly | HIGH |
| `wechat_pay` | alipay-payment-failed.md step-2 option "No, still having trouble" | `backup_action`: "Switch to WeChat Pay for now" | `"not_ready"` | Already fires correctly | HIGH |

### No verified current use — dormant fields

| Context field | Evidence of lack of use | Decision |
|---|---|---|
| `chinese_phone_number` | Guides explicitly say not required; content never branches on it | Defer |
| `phone_os` | Zero platform-specific instructions | Defer |
| `travel_cities` | No guide/diagnosis branches on city; existing /cities/[city] pages serve this | Defer (separate content-discovery feature) |
| `has_visited_china_before` | Cosmetic only; no content distinguishes | Defer |

---

## 3. /ready UX assessment

### Current state (verified)

| What | How it's collected | Default | Can distinguish "not ready" from "not sure"? |
|---|---|---|---|
| alipay | TriStateControl (Ready / Not ready / Not sure) | "unknown" | ✅ Yes — three explicit buttons |
| wechat_pay | TriStateControl (Ready / Not ready / Not sure) | "unknown" | ✅ Yes |
| chinese_phone_number | Not collected | "unknown" | ❌ No |
| international_card | Not collected | "unknown" | ❌ No |
| phone_os | Not collected | "unknown" | ❌ No |
| has_visited_china_before | Not collected | `false` (conflated: false = default assumption, not user answer) | ❌ No — boolean can't express "unknown" |
| travel_cities | Not collected | `[]` | ❌ No |
| 7 checklist items | Checkboxes (done / not done) | all false | ❌ No — unchecked always means "not done" (no tri-state) |

### Recommended smallest useful change

**None for now.** The value gate did not find a non-trivial use case for the international_card field in diagnosis hinting. No new TriStateControls should be added to /ready at this time. The page remains lean with two controls (alipay, wechat_pay) — exactly the two fields that have proven downstream value.

A future review should re-assess if and when:
1. New diagnosis content adds options whose actions genuinely depend on international card possession, with a non-trivial `not_ready` population, OR
2. Guide-level prerequisite awareness is scoped and approved as a separate feature (tracked above in §2).

### What would NOT help

Adding controls for: chinese_phone_number, phone_os, has_visited_china_before — no downstream value. Would increase cognitive load without benefit.

### Checklist + tri-state interaction

Current interaction: TriStateControl writes to both `TravelerContext` AND `ChecklistAnswers` (checklist boolean = true ONLY when tri-state is "ready"). Unchecking a checklist item maps to "unknown" (never "not_ready"). This is correct per design doc §3. **No change needed.**

---

## 4. Prioritized implementation plan

### P0 — Required for correctness

None. All existing invariants hold. No blocker for future implementation.

### P1 — Clear user benefit

None in this phase. The alipay/wechat_pay hinting from Phase 2B.3c is already complete and correct. The international_card value gate did not find a non-trivial diagnosis hint use case.

### P2 — Useful but requires content changes or further validation

None in this phase. No remaining context fields have sufficient demonstrated diagnosis-hinting value to merit UI collection at this time.

### Defer — No demonstrated value or insufficient evidence

| Item | Why deferred |
|---|---|
| Add international_card control + annotation | Value gate analysis found zero non-trivial `not_ready` population for diagnosis hints (see §2 matrix). Guide-level prerequisite awareness is a separate feature. |
| Add chinese_phone_number control | Content explicitly says not required |
| Add phone_os control | Zero platform-specific instructions |
| Add travel_cities control | Separate content-discovery feature, not diagnosis hints |
| Add has_visited_china_before control | No content distinguishes; would require schema re-type to tri-state |
| Remove dormant fields from schema | Low priority; schema cleanup can be done in a single dedicated phase |

### Non-goals (explicitly excluded from P1-P2)

- DecorateOptions runtime logic changes (any-match already correct per 2B.3c.1 verification)
- New diagnosis options, labels, actions, backups, escalations, or emergency guidance
- New guides or city content
- New checklist items
- Server-side content discovery (guide filtering by travel_cities)
- React component test framework installation
- Browser test automation framework

---

## 5. Open questions and assumptions

1. **Schema cleanup debt:** `chinese_phone_number`, `phone_os`, `international_card`, and `has_visited_china_before` are dormant schema fields. Collectively they waste ~50 lines of types/migration code. When is the right time to remove them? A dedicated cleanup phase after the guide-level prerequisite awareness feature is approved and implemented is recommended — otherwise international_card might still be needed.

2. **has_visited_china_before type mismatch:** The schema is `boolean` but tri-state semantics ("ready"/"not_ready"/"unknown") doesn't fit. The field conflates "has visited" with "has answered this question". If we ever want to collect this, it should be re-typed. **Not a blocker for any currently planned work.**

3. **international_card semantic conflation (documented, deferred):** We conflate three distinct things under one field: (a) "possesses an international card", (b) "card works in China", (c) "card is bound to Alipay/WeChat Pay". The value gate analysis found this conflation *in addition to* the zero-target-population issue — both contribute to the decision to defer. If a future feature (guide-level prerequisite awareness) needs this field, it should be re-designed with narrower semantics before any UI collection.

4. **Guide-level prerequisite awareness — separate phase needed:** Both payment guides require international cards. A context-aware prerequisite banner on guide pages would be genuinely useful. But this requires client-side context loading in server-rendered static pages — architecturally distinct from diagnosis hinting. This needs its own design phase with separate acceptance criteria. Track as a candidate for Phase 2C.

5. **When should we re-reassess international_card for diagnosis hinting?** Re-visit when new diagnosis content is added that: (a) includes options whose primary/backup/emergency actions genuinely depend on international card possession, and (b) targets a non-trivial `not_ready` traveler population. Until then, the field remains dormant.

---

## 6. No international_card implementation phase — acceptance gate closed

The value gate analysis (2B.4a.1) closed the implementation gate for international_card diagnosis hints. There is no 2B.4b implementation phase for this field at this time. The decision is recorded above in §1 B2 and §2 matrix.

**What must be verified before any future implementation can start:**
1. New diagnosis content must be written that includes at least one option whose primary/backup/emergency action genuinely depends on international card possession.
2. That option must target a non-trivial (verifiable, not just inferred) population of `international_card: "not_ready"` travelers.
3. A follow-up value gate must confirm the dual bar above is met.

**What must always remain true after any future international_card implementation:**
- Hints fire ONLY when `international_card === "not_ready"`.
- `REQUIREMENT_TO_CONTEXT_FIELD` remains a closed map — no dynamically-added requirements.
- `applyContextRules()` remains a pass-through — never filters or reorders.
- Option preservation contract still holds (length, order, identity, all fields).
- Malformed storage still falls back to defaults (existing migration test covers this).
- Hint text is in closed `HINT_TEXT` map — never from Markdown content.
- All existing verifications pass (build, tsc, lint, safety, migration, validator).
- No new dependencies introduced.

**What is closed in this phase (non-negotiable until re-opened):**
- No international_card TriStateControl on /ready.
- No `requires: ["international_card"]` annotations in diagnosis content.
- No uncommenting of `international_card` in `REQUIREMENT_TO_CONTEXT_FIELD` (lib/rules.ts).

---

## 7. Explicit non-goals and closed items

Items that are explicitly excluded from this design and any near-future implementation:

- No international_card TriStateControl on /ready (DEFERRED — no diagnosis hint value)
- No `requires: ["international_card"]` annotations in diagnosis content
- No uncommenting of `international_card` in `REQUIREMENT_TO_CONTEXT_FIELD` (lib/rules.ts)
- No new diagnosis options, labels, actions, backups, escalations, or emergency guidance
- No new guides or city content
- No checklist changes
- No schema removal of dormant fields (separate cleanup phase)
- No guide-level prerequisite hinting (separate future feature — track as Phase 2C candidate)
- No `escalate_to` content annotation
- No `topic_tags` annotation (solver-inert, optional)
- No React component test framework
- No browser test automation framework
- No changes to `/problems/[slug]/page.tsx` server component
- No changes to city pages
