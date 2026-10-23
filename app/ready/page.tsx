"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  QUESTIONS,
  loadAnswers,
  saveAnswers,
  defaultAnswers,
  getProgress,
  getMissingTasks,
  TASK_MAP,
  type ChecklistAnswers,
} from "@/lib/checklist";

// Client-only flag without setState-in-effect: false during SSR/hydration, true after
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function ReadyPage() {
  const mounted = useMounted();
  // localStorage is read lazily during client hydration; while !mounted we render a loading state
  const [answers, setAnswers] = useState<ChecklistAnswers>(() =>
    typeof window === "undefined" ? defaultAnswers() : loadAnswers()
  );

  function toggle(key: keyof ChecklistAnswers) {
    const newAnswers = { ...answers, [key]: !answers[key] };
    setAnswers(newAnswers);
    saveAnswers(newAnswers);
  }

  const progress = getProgress(answers);
  const missing = getMissingTasks(answers);
  const isAlmostReady = progress.percent >= 60;

  return (
    <div className="container-page py-12 md:py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          🎯 Get Ready for China
        </h1>
        <p className="text-[var(--text-muted)] max-w-xl mx-auto">
          Answer a few quick questions. We&apos;ll tell you exactly what you need
          before you land in China.
        </p>
      </div>

      {mounted ? (
        <div className="max-w-2xl mx-auto">
          {/* Progress summary */}
          <div
            className={`p-6 rounded-2xl border mb-8 ${
              isAlmostReady
                ? "bg-green-500/5 border-green-500/20"
                : "bg-[var(--card-bg)] border-[var(--border)]"
            }`}
          >
            <p className="text-sm font-medium text-[var(--text-muted)] mb-2">
              Your preparation progress
            </p>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-4xl font-bold">
                {progress.percent}%
              </span>
              <div className="flex-1 h-3 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isAlmostReady ? "bg-green-500" : "bg-[var(--brand-primary)]"
                  }`}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
            <p className="font-semibold text-lg">
              {progress.percent === 100
                ? "🎉 You're fully ready for China!"
                : isAlmostReady
                ? `😎 You're almost ready! ${progress.done}/${progress.total} items done.`
                : `📝 ${progress.done}/${progress.total} items done. Keep going!`}
            </p>
          </div>

          {/* Questions */}
          <div className="space-y-3 mb-10">
            <h2 className="text-lg font-semibold mb-2">
              What have you already prepared?
            </h2>
            {QUESTIONS.map((q) => {
              const done = answers[q.key];
              return (
                <button
                  key={q.key}
                  onClick={() => toggle(q.key)}
                  className={`w-full text-left p-4 rounded-xl border transition flex items-start gap-4 ${
                    done
                      ? "border-green-500 bg-green-500/5"
                      : "border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--brand-primary)]"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5 transition ${
                      done
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {done && "✓"}
                  </span>
                  <div>
                    <div className="font-medium">{q.title}</div>
                    <div className="text-sm text-[var(--text-muted)]">
                      {q.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Missing tasks */}
          {missing.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-3">
                🔑 What you still need to do
              </h2>
              <div className="space-y-2">
                {missing.map(({ key, task }) => (
                  <div
                    key={key}
                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] flex items-center justify-between gap-3"
                  >
                    <span className="font-medium">{task.label}</span>
                    {task.guideSlug ? (
                      <Link
                        href={`/guides/${task.guideSlug}`}
                        className="text-sm px-3 py-1.5 rounded-md bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] transition whitespace-nowrap"
                      >
                        Start Guide →
                      </Link>
                    ) : (
                      <Link
                        href="/guides"
                        className="text-sm px-3 py-1.5 rounded-md border border-[var(--border)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition whitespace-nowrap"
                      >
                        Browse Guides
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center pt-6 border-t border-[var(--border)]">
            <Link
              href="/guides"
              className="px-5 py-2.5 rounded-lg bg-[var(--brand-primary)] text-white font-medium hover:bg-[var(--brand-primary-dark)] transition"
            >
              📖 Browse All Guides
            </Link>
            <Link
              href="/problems"
              className="px-5 py-2.5 rounded-lg border border-[var(--border)] font-medium hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition"
            >
              🆘 Problem Solver
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-center text-[var(--text-muted)]">Loading...</p>
      )}
    </div>
  );
}
