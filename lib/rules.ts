import type {
  DiagnosisOption,
  DecoratedOption,
  OptionRequirement,
  Readiness,
  TravelerContext,
} from "./types";

/**
 * Phase 2B.2.2 — context-based filtering AND reordering were removed.
 * Phase 2B.3c — hints are additive-only via `decorateOptions` (below).
 * This pass-through is preserved for backwards compatibility; no caller
 * in Phase 2B.3c reads context through this function.
 *
 * Invariant: every input option is returned exactly once, in original order.
 */
export function applyContextRules(
  options: DiagnosisOption[]
): DiagnosisOption[] {
  if (!Array.isArray(options)) return [];
  return options.slice();
}

// --- Phase 2B.3c: context-driven hints ---

/**
 * Map each OptionRequirement literal to its matching TravelerContext field
 * (the Readiness value that drives hint firing).
 *
 * Requires not in this map are silently ignored — a future batch may add the
 * dormant chinese_phone_number / international_card hints once /ready gains
 * UI controls for them.
 */
const REQUIREMENT_TO_CONTEXT_FIELD: Partial<Record<OptionRequirement, keyof TravelerContext>> = {
  alipay_setup: "alipay",
  wechat_pay_setup: "wechat_pay",
  // chinese_phone_number: "chinese_phone_number",   // dormant — no /ready UI yet
  // international_card: "international_card",        // dormant — no /ready UI yet
};

/**
 * App-owned hint strings. Closed set — content Markdown can never inject
 * hint text. When a user's context field is explicitly "not_ready" and an
 * option requires that setup, we surface this explanatory hint.
 */
const HINT_TEXT: Record<OptionRequirement, string> = {
  alipay_setup: "💡 You said you haven't set up Alipay yet — this option needs Alipay to work.",
  wechat_pay_setup: "💡 You said you haven't set up WeChat Pay yet — this option needs WeChat Pay to work.",
  chinese_phone_number: "",     // dormant — no hint text until UI exists
  international_card: "",      // dormant
};

/**
 * Compute the hint for a single option given a validated traveler context.
 *
 * Rules (strict — these are the ONLY cases that produce a non-null hint):
 *   - option.requires[] is inspected (undefined / empty → no hint)
 *   - Each required setup is matched to a context field via REQUIREMENT_TO_CONTEXT_FIELD
 *   - If the context field is EXACTLY "not_ready" → corresponding hint text
 *   - "ready", "unknown", missing field, invalid context → all produce null
 *   - has_visited_china_before, phone_os, travel_cities never trigger hints
 *
 * When multiple requirements fail, we return the first matching hint (short,
 * deterministic). A future batch may combine them.
 */
function computeHint(
  option: DiagnosisOption,
  context: TravelerContext
): string | null {
  const reqs = option.requires;
  if (!reqs || reqs.length === 0) return null;

  for (const req of reqs) {
    const ctxKey = REQUIREMENT_TO_CONTEXT_FIELD[req];
    if (!ctxKey) continue; // dormant requirement — no /ready UI exists yet

    const value = context[ctxKey];
    if (value === "not_ready") {
      const text = HINT_TEXT[req];
      if (text) return text;
    }
    // "ready", "unknown", or any other value → no hint from this requirement
  }
  return null;
}

/**
 * Phase 2B.3c — pure function. Returns DecoratedOption[] without mutating
 * inputs. Original option references are preserved by index. Hints are
 * additive-only: length, order, and every option field are identical to
 * the input when `hint` is stripped.
 *
 * Contract (see docs/phase-2b3-design.md §6):
 *   1. Output length === input length.
 *   2. output[i].option === input[i] (object identity per index).
 *   3. hint is null or an app-owned string from a closed set.
 *   4. context fields not in REQUIREMENT_TO_CONTEXT_FIELD are never read.
 *
 * Context reading rule: only an explicit "not_ready" produces a hint.
 * "ready", "unknown", missing fields, malformed context → all no-op.
 */
export function decorateOptions(
  options: DiagnosisOption[] | null | undefined,
  context: TravelerContext
): DecoratedOption[] {
  const source = Array.isArray(options) ? options : [];
  if (!source.length) return [];

  // Defensive: tolerate a malformed context param gracefully
  const safe =
    context && typeof context === "object"
      ? context
      : ({} as TravelerContext);

  return source.map((opt) => ({
    option: opt,
    hint: computeHint(opt, safe),
  }));
}
