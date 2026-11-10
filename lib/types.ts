// Core content types for EasyPandaTrip

export type ContentStatus = "draft" | "verified" | "stale" | "outdated";

export type GuideCategory = "prepare" | "get-around" | "pay" | "daily-life";

export type ProblemCategory =
  | "payment"
  | "transport"
  | "internet"
  | "language"
  | "emergency"
  | "other";

export type Severity = "low" | "medium" | "high" | "emergency";

export type CityCode = "all" | "beijing" | "shanghai";

export interface Source {
  name: string;
  url: string;
  type: "official" | "community" | "news";
  accessed_at?: string;
}

export interface Step {
  order: number;
  title: string;
  instruction: string;
  visual_cue?: string;
  failure_guidance?: string;
  linked_problem?: string;
}

export interface Prerequisite {
  item: string;
  required: boolean;
  note?: string;
}

export interface BackupOption {
  condition: string;
  action: string;
}

export interface GuideFrontmatter {
  slug: string;
  title: string;
  summary: string;
  category: GuideCategory;
  city_scope: CityCode | CityCode[];
  target_audience: string[];
  estimated_minutes: number;
  last_verified: string; // ISO date
  status: ContentStatus;
  sources: Source[];
  prerequisites?: Prerequisite[];
  steps: Step[];
  expected_result?: string;
  backup_options?: BackupOption[];
  common_problems?: string[]; // problem slugs
  related_guides?: string[]; // guide slugs
}

export interface Guide {
  frontmatter: GuideFrontmatter;
  content: string; // markdown body
  slug: string;
}

/**
 * What a diagnosis option is ABOUT. Informational only — the solver never
 * reads this field. Reserved for future search facets / analytics.
 */
export type OptionTopic =
  | "alipay"
  | "wechat_pay"
  | "chinese_number"
  | "international_card"
  | "cash_atm"
  | "metro"
  | "vpn"
  | "maps"
  | "staff";

/**
 * What must hold for an option's recommended_action to be executable.
 * Drives hint attachment ONLY (Phase 2B.3c+). Never filters, reorders,
 * or rewrites an option. Hints fire only on an explicit "not_ready".
 */
export type OptionRequirement =
  | "alipay_setup"
  | "wechat_pay_setup"
  | "chinese_phone_number"
  | "international_card";

export interface DiagnosisOption {
  label: string;
  recommended_action: string;
  backup_action?: string;
  escalate_to?: string; // next question slug
  emergency_option?: string;
  topic_tags?: OptionTopic[]; // solver-inert; informational only
  requires?: OptionRequirement[]; // hint-driving; additive only
}

export interface DiagnosisNode {
  slug: string;
  question: string;
  options: DiagnosisOption[];
}

export interface ProblemFrontmatter {
  slug: string;
  title: string;
  summary: string;
  category: ProblemCategory;
  severity: Severity;
  last_verified: string;
  status: ContentStatus;
  sources?: Source[];
  trigger_keywords?: string[];
  diagnosis: DiagnosisNode[]; // diagnosis tree, ordered
  related_guides?: string[];
}

export interface Problem {
  frontmatter: ProblemFrontmatter;
  content: string;
  slug: string;
}

export interface CityFrontmatter {
  slug: string;
  title: string;
  summary: string;
  highlights?: string[];
  transport_notes?: string;
  payment_notes?: string;
  last_verified: string;
  status: ContentStatus;
  /** Optional provenance for factual claims. Backward-compatible: files without it still validate. */
  sources?: Source[];
  related_guides?: string[];
  related_problems?: string[];
}

export interface City {
  frontmatter: CityFrontmatter;
  content: string;
  slug: string;
}

// Category display info
export const CATEGORY_INFO: Record<
  GuideCategory,
  { label: string; description: string; icon: string }
> = {
  prepare: {
    label: "Prepare",
    description: "Get ready before you leave",
    icon: "📋",
  },
  "get-around": {
    label: "Get Around",
    description: "Navigate cities and travel between them",
    icon: "🚇",
  },
  pay: {
    label: "Pay",
    description: "Use China's payment ecosystem",
    icon: "💳",
  },
  "daily-life": {
    label: "Daily Life",
    description: "Restaurants, hotels, shopping, and more",
    icon: "🏪",
  },
};

export const PROBLEM_CATEGORY_INFO: Record<
  ProblemCategory,
  { label: string; icon: string }
> = {
  payment: { label: "Payment", icon: "💳" },
  transport: { label: "Transport", icon: "🚇" },
  internet: { label: "Internet", icon: "📶" },
  language: { label: "Language", icon: "🗣️" },
  emergency: { label: "Emergency", icon: "🆘" },
  other: { label: "Other", icon: "❓" },
};

// Phase 2: Traveler Context

/**
 * Tri-state readiness. Hints fire ONLY on an explicit "not_ready".
 * "unknown" means no reliable answer (missing, default, invalid, or
 * migrated-from-false). Never infer "not_ready" from any of those.
 */
export type Readiness = "ready" | "not_ready" | "unknown";

export type PhoneOS = "ios" | "android" | "unknown";

export interface TravelerContext {
  /** FINAL name (legacy key was first_trip_to_china; see migration). */
  has_visited_china_before: boolean;
  phone_os: PhoneOS;
  chinese_phone_number: Readiness;
  alipay: Readiness;
  wechat_pay: Readiness;
  international_card: Readiness;
  travel_cities: string[];
}

/**
 * Presentation decoration from Phase 2B.3c. `option` is the ORIGINAL
 * DiagnosisOption reference — never mutated, never reordered. `hint` is
 * null (no personalization) or an app-owned UI string (never from content).
 */
export interface DecoratedOption {
  option: DiagnosisOption;
  hint: string | null;
}
