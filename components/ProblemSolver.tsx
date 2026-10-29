"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  DiagnosisNode,
  DiagnosisOption,
  DecoratedOption,
  ProblemFrontmatter,
  Source,
  TravelerContext,
} from "@/lib/types";
import { applyContextRules, decorateOptions } from "@/lib/rules";
import { defaultTravelerContext, loadTravelerContext } from "@/lib/traveler-context";

/**
 * Defensive wrapper: context processing must never drop, duplicate, or
 * reorder options. If it returns anything unexpected, fall back to the
 * original options in their original order.
 */
function safeApplyContextRules(
  options: DiagnosisOption[]
): DiagnosisOption[] {
  if (options.length === 0) return options;
  try {
    const processed = applyContextRules(options);
    if (!Array.isArray(processed) || processed.length !== options.length) {
      return options;
    }
    return processed;
  } catch {
    return options;
  }
}

/**
 * Safe decorator: wraps decorateOptions with the same defensive guarantees
 * as safeApplyContextRules. If decoration throws or mismatches, fall back to
 * the original options with hint=null for every one.
 */
function safeDecorate(
  options: DiagnosisOption[],
  context: TravelerContext
): DecoratedOption[] {
  if (options.length === 0) return [];
  try {
    const decorated = decorateOptions(options, context);
    if (
      Array.isArray(decorated) &&
      decorated.length === options.length &&
      decorated.every(
        (d, i) => d.option === options[i] && (d.hint === null || typeof d.hint === "string")
      )
    ) {
      return decorated;
    }
    // Mismatch — fall back to all-null hints
  } catch {
    // Throw — fall back
  }
  return options.map((o) => ({ option: o, hint: null }));
}

interface Props {
  problem: {
    slug: string;
    frontmatter: ProblemFrontmatter;
  };
  relatedGuides: { slug: string; title: string }[];
  sources: Source[];
  children?: React.ReactNode;
}

export function ProblemSolver({
  problem,
  relatedGuides,
  sources,
  children,
}: Props) {
  const diagnosis = problem.frontmatter.diagnosis;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<{
    nodeSlug: string;
    action: string;
    backup?: string;
    emergency?: string;
  } | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  /**
   * Phase 2B.3c: decorated options for the CURRENT node.
   * null means "context has not been loaded yet" — render raw options (no hints,
   * identical to the server render). Set only inside user event handlers that
   * first call loadTravelerContext(). No localStorage reads during SSR or
   * hydration. See docs/phase-2b3-design.md §5.
   */
  const [decorated, setDecorated] = useState<DecoratedOption[] | null>(null);

  const currentNode: DiagnosisNode | undefined = diagnosis[currentIndex];
  const rawOptions = currentNode?.options ?? [];
  const contextOptions = safeApplyContextRules(rawOptions);

  /**
   * Phase 2B.3c helper: load context from localStorage and compute decorations
   * for the node at `nodeIndex`. Safe to call during server render (returns
   * null context, all-null hints). Must be called inside user event handlers
   * so hydration stays pure.
   */
  function refreshDecorations(nodeIndex: number) {
    if (typeof window === "undefined") return;
    const ctx = loadTravelerContext();
    const node = diagnosis[nodeIndex];
    setDecorated(safeDecorate(node?.options ?? [], ctx));
  }

  function handleOptionClick(
    action: string,
    backup?: string,
    emergency?: string,
    escalateTo?: string
  ) {
    setSelectedAnswer({
      nodeSlug: currentNode?.slug || "",
      action,
      backup,
      emergency,
    });

    if (escalateTo) {
      const nextIndex = diagnosis.findIndex(
        (n) => n.slug === escalateTo
      );
      if (nextIndex !== -1) {
        setHistory([...history, currentIndex]);
        setCurrentIndex(nextIndex);
        setSelectedAnswer(null);
        // Load context + compute decorations for the NEW node being navigated to
        refreshDecorations(nextIndex);
      }
    } else {
      // No escalation — ensure the CURRENT node's decorations are loaded now,
      // so when the user later navigates back to this node via Back/Reset,
      // hints are already populated. This branch covers the common case where
      // diagnosis Markdown has no escalate_to fields at all.
      refreshDecorations(currentIndex);
    }
  }

  function handleBack() {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentIndex(prev);
      setSelectedAnswer(null);
      refreshDecorations(prev);
    } else {
      setCurrentIndex(0);
      setSelectedAnswer(null);
      refreshDecorations(0);
    }
  }

  function handleReset() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setHistory([]);
    refreshDecorations(0);
  }

  function handleContinue() {
    if (currentIndex + 1 >= diagnosis.length) return;
    const next = currentIndex + 1;
    setHistory([...history, currentIndex]);
    setCurrentIndex(next);
    setSelectedAnswer(null);
    refreshDecorations(next);
  }

  const hasNextStep = currentIndex + 1 < diagnosis.length;

  /**
   * Choose which option array to render:
   *   - Before any handler fires → null decorated → raw content-order options
   *   - After handler fires → decorated options (with additive hints)
   * Invariant: length, order, and option objects are always identical.
   */
  const renderOptions: { option: DiagnosisOption; hint: string | null }[] =
    decorated !== null
      ? decorated
      : contextOptions.map((o) => ({ option: o, hint: null }));

  return (
    <>
      {/* Diagnosis */}
      <section className="mb-10">
        <div className="p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)]">
          {/* Progress */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Diagnostic step {currentIndex + 1} of {diagnosis.length}
            </span>
            {currentIndex > 0 && (
              <button
                onClick={handleBack}
                className="text-sm text-[var(--brand-primary)] hover:underline"
              >
                ← Back
              </button>
            )}
          </div>

          {/* Question */}
          {!selectedAnswer && currentNode && renderOptions.length > 0 && (
            <>
              <h2 className="text-xl md:text-2xl font-bold mb-5">
                {currentNode.question}
              </h2>
              <div className="space-y-3">
                {renderOptions.map(({ option: opt, hint }, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      handleOptionClick(
                        opt.recommended_action,
                        opt.backup_action,
                        opt.emergency_option,
                        opt.escalate_to
                      )
                    }
                    className="w-full text-left p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--brand-primary)] hover:shadow-sm transition group"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full border border-[var(--border)] group-hover:border-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-white transition flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="font-medium">{opt.label}</span>
                    </span>
                    {/* Phase 2B.3c: additive hint (never present during SSR/hydration) */}
                    {hint && (
                      <span className="block mt-2 ml-10 text-sm text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-1.5">
                        {hint}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Defensive fallback: never leave the traveler without a way forward */}
          {!selectedAnswer && (!currentNode || renderOptions.length === 0) && (
            <>
              <h2 className="text-xl md:text-2xl font-bold mb-3">
                This diagnostic step didn&apos;t load correctly
              </h2>
              <p className="text-[var(--text-muted)] mb-6">
                Your answers are still safe. Restart the diagnosis, or browse
                the full list of problems and guides.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-sm font-medium hover:bg-[var(--brand-primary-dark)] transition"
                >
                  Restart Diagnosis
                </button>
                <Link
                  href="/problems"
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition"
                >
                  Browse All Problems
                </Link>
                <Link
                  href="/guides"
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition"
                >
                  Browse Guides
                </Link>
              </div>
            </>
          )}

          {/* Answer */}
          {selectedAnswer && (
            <>
              <div className="bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/20 rounded-xl p-5 mb-4">
                <h3 className="font-semibold mb-2 text-[var(--brand-primary)]">
                  💡 Recommended Action
                </h3>
                <p className="text-[var(--foreground)] leading-relaxed">
                  {selectedAnswer.action}
                </p>
              </div>

              {selectedAnswer.backup && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5 mb-4">
                  <h3 className="font-semibold mb-2 text-orange-600">
                    🔄 If that doesn&apos;t work
                  </h3>
                  <p className="text-[var(--foreground)] leading-relaxed">
                    {selectedAnswer.backup}
                  </p>
                </div>
              )}

              {selectedAnswer.emergency && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-4">
                  <h3 className="font-semibold mb-2 text-red-600">
                    🆘 Emergency Option
                  </h3>
                  <p className="text-[var(--foreground)] leading-relaxed">
                    {selectedAnswer.emergency}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                {hasNextStep && (
                  <button
                    onClick={handleContinue}
                    className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-sm font-medium hover:bg-[var(--brand-primary-dark)] transition"
                  >
                    Still not solved? Next question →
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition"
                >
                  Start Over
                </button>
                <Link
                  href="/problems"
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition"
                >
                  Browse All Problems
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Long-form guidance from the problem markdown */}
      {children}

      {/* Related guides */}
      {relatedGuides.length > 0 && (
        <section className="mb-8">
          <h3 className="font-semibold mb-3">📖 Related Guides</h3>
          <div className="space-y-2">
            {relatedGuides.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="block p-3 rounded-lg border border-[var(--border)] hover:border-[var(--brand-primary)] transition text-sm"
              >
                → {g.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <section>
          <h3 className="font-semibold mb-3">📚 Sources</h3>
          <ul className="space-y-1 text-sm">
            {sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand-primary)] hover:underline break-all"
                >
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
