# Phase 2B.3 — Structured Personalization Design (Final)

Status: CLOSED — ready for gate decision. Supersedes the previous 2B.3 drafts.
Scope: design only. No implementation in this document.

---

## 1. Current-State Findings (grounded in actual files)

- `lib/types.ts:71-83` — `DiagnosisOption` = `{label, recommended_action, backup_action?, escalate_to?, emergency_option?}`; `DiagnosisNode` = `{slug, question, options[]}`. No relevance metadata.
- `lib/traveler-context.ts` — storage key `ctg-traveler-context-v1`; 7 fields, all-boolean readiness flags defaulting to `false`; `isValidContext` falls back to defaults on any invalid/missing value.
- `lib/rules.ts` — `applyContextRules(options) => options.slice()`. No filtering, no scoring, no context parameter (keyword matching was removed in 2B.2.2 after it deleted recovery options).
- `components/ProblemSolver.tsx` — no context prop; `safeApplyContextRules` count-guard; empty-node fallback panel; no localStorage access.
- `app/ready/page.tsx` — only `alipay_ready` / `wechat_pay_ready` are written (checkbox toggle).
- `app/problems/[slug]/page.tsx` — server component; passes no context to `ProblemSolver`.
- `scripts/test-rules-safety.cjs` — gate: 5 expected slugs, ≥10 nodes, ≥30 options, per-node count/order/object-identity/guidance preservation, 7 named regressions, exit 1 on any failure.
- Content corpus: 5 problems, 10 nodes, 30 options; all options prose-only.

## 2. Final Schema

### 2.1 Option metadata (two fields, two meanings)

```typescript
/** What an option is ABOUT. Informational only; the solver NEVER reads it. */
export type OptionTopic =
  | "alipay" | "wechat_pay" | "chinese_number" | "international_card"
  | "cash_atm" | "metro" | "vpn" | "maps" | "staff";

/** What must hold for the option's recommended_action to be executable. */
export type OptionRequirement =
  | "alipay_setup"
  | "wechat_pay_setup"
  | "chinese_phone_number"
  | "international_card";

export interface DiagnosisOption {
  label: string;
  recommended_action: string;
  backup_action?: string;
  escalate_to?: string;
  emergency_option?: string;
  topic_tags?: OptionTopic[];     // solver-inert; reserved for search/analytics
  requires?: OptionRequirement[]; // drives hints; nothing else
}
```

- `topic_tags` and `requires` are independent. An option can be about Alipay without requiring Alipay ("Contact Alipay support"), and can require Alipay without being about it.
- Missing `requires` ⇒ `[]` ⇒ no hint can fire. Unknown literal ⇒ validator error; runtime ignores it.

### 2.2 Tri-state readiness (final field names)

```typescript
export type Readiness = "ready" | "not_ready" | "unknown";

export interface TravelerContext {
  has_visited_china_before: boolean;              // FINAL name (was first_trip_to_china)
  phone_os: "ios" | "android" | "unknown";
  chinese_phone_number: Readiness;
  alipay: Readiness;
  wechat_pay: Readiness;
  international_card: Readiness;
  travel_cities: string[];
}
```

Semantics:
- `"ready"` — the user explicitly confirmed readiness.
- `"not_ready"` — the user explicitly confirmed NOT ready.
- `"unknown"` — no reliable answer (missing, default, invalid, or migrated-from-false).
- Rules fire ONLY on `"not_ready"`. `"ready"` and `"unknown"` produce no hint.

## 3. Interaction Contract (Issue 1 resolution)

**Decision: `/ready` gets an explicit three-state control for the payment-readiness items.** The design does NOT ship hints that normal interaction cannot trigger.

- Each of the two payment readiness questions becomes a tri-state control: `Yes, ready` / `No, not yet` / (no selection = `unknown`).
- Checking the existing checklist task maps to `"ready"`. Selecting "No, not yet" maps to `"not_ready"`. Neither ⇒ `"unknown"`.
- Unchecking a checked task returns to `"unknown"`, never to `"not_ready"`.
- Rules only fire on explicit `"not_ready"`, and `"not_ready"` is only reachable through this explicit control. Missing fields, legacy `false`, unchecked checkboxes, and defaults all remain `"unknown"` and fire nothing.

Acceptance criteria:
- A fresh visitor (or migrated legacy user) sees zero hints on every problem.
- A user who selects "No, not yet" for Alipay on `/ready`, then opens an annotated problem and interacts with it, sees the Alipay-setup hint on the matching options.
- No interaction path can produce a hint without an explicit `"not_ready"` selection.

## 4. Legacy Migration Table (Issue 2 resolution)

Storage strategy (final): **same key `ctg-traveler-context-v1`, upgraded in place.** The loader migrates on read and writes the upgraded shape back on the next save. Migration is idempotent: already-migrated data validates as the new shape and passes through unchanged. Malformed JSON or wrong-shaped data ⇒ full default context (all readiness `"unknown"`).

| Legacy field (v1) | Valid legacy value | Migrated value | Missing | Invalid type |
|---|---|---|---|---|
| `first_trip_to_china: boolean` | `true` / `false` | `has_visited_china_before = !value` | `has_visited_china_before = false` | `false` |
| `phone_os` | `"ios"` / `"android"` / `"unknown"` | preserved | `"unknown"` | `"unknown"` |
| `has_chinese_phone_number: boolean` | `true` | `chinese_phone_number: "ready"` | `"unknown"` | `"unknown"` |
| 〃 | `false` | `"unknown"` — legacy false carried no signal (it was the universal default) | 〃 | 〃 |
| `alipay_ready: boolean` | `true` | `alipay: "ready"` | `"unknown"` | `"unknown"` |
| 〃 | `false` | `"unknown"` (never `"not_ready"`) | 〃 | 〃 |
| `wechat_pay_ready: boolean` | `true` | `wechat_pay: "ready"` | `"unknown"` | `"unknown"` |
| 〃 | `false` | `"unknown"` | 〃 | 〃 |
| `has_international_card: boolean` | `true` | `international_card: "ready"` | `"unknown"` | `"unknown"` |
| 〃 | `false` | `"unknown"` | 〃 | 〃 |
| `travel_cities` | `string[]` | preserved | `[]` | `[]` |

The naming inconsistency is resolved: the schema uses `has_visited_china_before: boolean` exclusively; `first_trip_to_china` exists only as the legacy key read during migration.

## 5. Client Rendering State Transition (Issue 3 resolution)

Exact sequence:

1. **Server render** — `ProblemSolver` receives only content. No context is read. Options render in content order with no hints.
2. **Client hydration** — initial client state matches the server render exactly. No `useEffect`, `setTimeout`, or localStorage read runs during or before hydration.
3. **User interaction** — the traveler selects an option (an event handler).
4. **Context read + state update in the same handler** — the handler calls `loadTravelerContext()` (validated, migrates legacy data), computes decorations, and calls `setState`. **Reading localStorage without updating React state is insufficient** — decoration must flow through state, not a mutable side channel.
5. **Subsequent render** — hints may appear on the rendered answer/options. Option set, order, labels, actions, backups, escalation targets, and emergency guidance are unchanged; only hint lines are added.

Testable acceptance criteria (replacing the byte-identical HTML requirement):
- No React hydration errors or warnings for any problem page.
- Initial render (pre-interaction) shows all original options in original order with original text.
- Context loading never hides, reorders, or rewrites an option.
- After interaction, the only DOM difference attributable to personalization is the addition of hint elements.

## 6. Presentation Safety Contract (Issue 4 resolution)

```typescript
export interface DecoratedOption {
  option: DiagnosisOption;   // ORIGINAL object reference, nested, unmodified
  hint: string | null;       // app-owned UI string or null
}

export function decorateOptions(
  options: DiagnosisOption[],
  context: TravelerContext
): DecoratedOption[];
```

Contract:
1. Output length equals input length, always.
2. `output[i].option === input[i]` — identity, per index (order preserved).
3. Every original field is verified through the nested reference: `label`, `recommended_action`, `backup_action`, `escalate_to`, `emergency_option`.
4. `hint` is `null` or a string from a closed set defined in application code; content cannot inject hint text.
5. `emergency_option` renders from `decorated.option.emergency_option` — the decoration layer never reads or alters it.

Test contract (extends `scripts/test-rules-safety.cjs`, weakens nothing):

```javascript
const decorated = decorateOptions(original, ctx);
check(decorated.length === original.length);
for (let i = 0; i < original.length; i++) {
  check(decorated[i].option === original[i]);
  check(decorated[i].option.label === original[i].label);
  check(decorated[i].option.recommended_action === original[i].recommended_action);
  check(decorated[i].option.backup_action === original[i].backup_action);
  check(decorated[i].option.escalate_to === original[i].escalate_to);
  check(decorated[i].option.emergency_option === original[i].emergency_option);
  check(decorated[i].hint === null || typeof decorated[i].hint === "string");
}
```

The existing content-inventory tripwires (5 slugs, ≥10 nodes, ≥30 options) and 7 named regressions remain in force.

**Test-level honesty:** these are unit-level decoration tests. **No browser test infrastructure exists in the project** and none will be added in the design phase. Minimum justified verification for hydration behavior: (a) unit test asserting the pre-interaction render path passes no context (hint output is all-`null` for default context); (b) one manual browser pass over all 5 problem pages checking for hydration warnings and initial-render fidelity, documented in the batch report. If a browser harness is adopted later, it is a separate, justified decision.

## 7. Final Implementation Gate

### Final decisions
- **Schema:** `topic_tags` (solver-inert) + `requires` (hint-driving); tri-state `Readiness`; `has_visited_china_before` replaces `first_trip_to_china`.
- **Storage:** same key, idempotent in-place migration; legacy `false` ⇒ `"unknown"` everywhere; malformed ⇒ all-defaults.
- **Interaction:** explicit three-state control on `/ready`; rules fire only on explicit `"not_ready"`.
- **Rendering:** context read only inside user event handlers; hydration carries no personalization.
- **Hints:** additive-only presentation via `DecoratedOption`; original option object nested by reference.

### Supported vs deferred
| Supported in 2B.3 | Deferred |
|---|---|
| Setup hints for `alipay_setup`, `wechat_pay_setup` (only fields with UI) | Hints keyed on `chinese_phone_number`, `international_card` (no UI yet) |
| Additive hint rendering | Reordering / ranking of options |
| `topic_tags` as inert metadata | Any solver effect from `topic_tags` |
| Unit-level safety tests | Browser-level hydration harness |

### Acceptance criteria per batch
- **2B.3a (schema + validator):** types added; validator accepts/validates new fields and rejects unknown literals; safety test extended with decorated-output fixtures; zero behavior change; all existing checks pass.
- **2B.3b (context migration + `/ready` tri-state):** migration table implemented; idempotent re-reads; legacy-false ⇒ `unknown` verified by test; `/ready` writes all three states explicitly; solver rendering unchanged.
- **2B.3c (rules + rendering):** `decorateOptions` implemented to the §6 contract; context read only in event handlers; no hydration errors; hints appear only for explicit `"not_ready"` on annotated options.
- **2B.3d (incremental annotation):** annotate `requires` only where unambiguous (start: `alipay-payment-failed`, `metro-payment-failed`); unannotated options render identically to today; validator 0 errors after each file.

### Remaining risks / blockers
- **Dormant requirements:** `chinese_phone_number` and `international_card` hints cannot fire until `/ready` grows controls for them (separate product decision).
- **Manual hydration verification:** acceptable for MVP; a real browser harness is the proper long-term fix.
- **Hint wording** is app-owned English UI strings, consistent with the Phase 1 English-only constraint.

### Unresolved product decisions
1. Whether `/ready` should gain tri-state controls for `chinese_phone_number` and `international_card` in 2B.3b or a later batch. (Default assumption if unanswered: later batch; the two tags stay dormant.)

### Gate recommendation

**GO for Phase 2B.3a.** The four open issues are closed: topic ≠ prerequisite; tri-state readiness with explicit-only `not_ready`; hydration-pure rendering with interaction-triggered hints; and a reference-identity presentation contract verified by an extended (not weakened) safety gate.
