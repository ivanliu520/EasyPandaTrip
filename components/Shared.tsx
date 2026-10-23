"use client";

import { useSyncExternalStore } from "react";
import type { GuideFrontmatter } from "@/lib/types";
import Link from "next/link";

interface GuideCardProps {
  guide: GuideFrontmatter & { slug: string };
  showCategory?: boolean;
}

export function GuideCard({ guide, showCategory = true }: GuideCardProps) {
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="block group rounded-xl border border-[var(--border)] p-5 bg-[var(--card-bg)] hover:border-[var(--brand-primary)] hover:shadow-md transition-all"
    >
      {showCategory && (
        <span className="inline-block text-xs font-medium uppercase tracking-wide text-[var(--brand-primary)] mb-2">
          {guide.category.replace("-", " ")}
        </span>
      )}
      <h3 className="font-semibold text-lg mb-2 group-hover:text-[var(--brand-primary)] transition">
        {guide.title}
      </h3>
      <p className="text-sm text-[var(--text-muted)] mb-3">{guide.summary}</p>
      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <span>⏱ {guide.estimated_minutes} min</span>
        <span>·</span>
        <VerificationBadge date={guide.last_verified} status={guide.status} compact />
      </div>
    </Link>
  );
}

export function VerificationBadge({
  date,
  status = "verified",
  compact = false,
}: {
  date: string;
  status?: "verified" | "stale" | "outdated" | "draft";
  compact?: boolean;
}) {
  // Read Date.now() only on the client (server snapshot = null) to keep prerender stable
  const now = useSyncExternalStore(
    () => () => {},
    () => Date.now(),
    () => null
  );
  const daysAgo =
    now === null
      ? null
      : Math.floor((now - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

  const config = {
    verified: {
      icon: "✓",
      label: compact ? (daysAgo !== null ? `${daysAgo}d` : "Verified") : `Verified${daysAgo !== null ? ` ${daysAgo} days ago` : ""}`,
      color: "bg-green-500/10 text-green-600 border-green-500/20",
    },
    stale: {
      icon: "⚠",
      label: compact ? "stale" : "May need checking",
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    },
    outdated: {
      icon: "✗",
      label: compact ? "old" : "Outdated",
      color: "bg-red-500/10 text-red-600 border-red-500/20",
    },
    draft: {
      icon: "…",
      label: compact ? "draft" : "Draft",
      color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${config.color}`}
      title={`Last verified: ${date}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-block text-xs font-medium uppercase tracking-wide px-2.5 py-1 rounded-md bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
      {category.replace("-", " ")}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    low: "bg-blue-500/10 text-blue-600",
    medium: "bg-yellow-500/10 text-yellow-600",
    high: "bg-orange-500/10 text-orange-600",
    emergency: "bg-red-500/10 text-red-600 animate-pulse",
  };
  return (
    <span
      className={`inline-block text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md ${colors[severity] || colors.medium}`}
    >
      {severity}
    </span>
  );
}
