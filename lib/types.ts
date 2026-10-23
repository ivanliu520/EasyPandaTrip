// Core content types for China Travel Guide

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

export interface DiagnosisOption {
  label: string;
  recommended_action: string;
  backup_action?: string;
  escalate_to?: string; // next question slug
  emergency_option?: string;
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
