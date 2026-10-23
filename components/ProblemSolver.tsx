"use client";

import { useState } from "react";
import Link from "next/link";
import type { DiagnosisNode, ProblemFrontmatter, Source } from "@/lib/types";

interface Props {
  problem: {
    slug: string;
    frontmatter: ProblemFrontmatter;
  };
  relatedGuides: { slug: string; title: string }[];
  sources: Source[];
}

export function ProblemSolver({ problem, relatedGuides, sources }: Props) {
  const diagnosis = problem.frontmatter.diagnosis;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<{
    nodeSlug: string;
    action: string;
    backup?: string;
    emergency?: string;
  } | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  const currentNode: DiagnosisNode | undefined = diagnosis[currentIndex];

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
      }
    }
  }

  function handleBack() {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentIndex(prev);
      setSelectedAnswer(null);
    } else {
      setCurrentIndex(0);
      setSelectedAnswer(null);
    }
  }

  function handleReset() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setHistory([]);
  }

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
          {!selectedAnswer && currentNode && (
            <>
              <h2 className="text-xl md:text-2xl font-bold mb-5">
                {currentNode.question}
              </h2>
              <div className="space-y-3">
                {currentNode.options.map((opt, i) => (
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
                  </button>
                ))}
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
                    🔄 If that doesn't work
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

              <div className="flex gap-3 mt-6">
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
