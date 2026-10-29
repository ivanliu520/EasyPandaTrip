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
  type ChecklistAnswers,
} from "@/lib/checklist";
import {
  defaultTravelerContext,
  loadTravelerContext,
  updateTravelerContext,
} from "@/lib/traveler-context";
import type { Readiness, TravelerContext } from "@/lib/types";

// Client-only flag without setState-in-effect: false during SSR/hydration, true after
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/** Map a tri-state context readiness value to the checklist boolean it implies. */
function readinessToChecked(r: Readiness): boolean {
  return r === "ready";
}

/** User-facing labels for internal tri-state values shown in the profile summary. */
const READINESS_LABELS: Record<Readiness, string> = {
  ready: "Ready",
  not_ready: "Not set up",
  unknown: "Not sure",
};

interface TriStateProps {
  label: string;
  description: string;
  value: Readiness;
  onChange: (value: Readiness) => void;
}

/** Explicit three-state readiness control: Ready / Not ready / Not sure. */
function TriStateControl({ label, description, value, onChange }: TriStateProps) {
  const options: { value: Readiness; text: string }[] = [
    { value: "ready", text: "Ready" },
    { value: "not_ready", text: "Not ready" },
    { value: "unknown", text: "Not sure" },
  ];
  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
      <div className="font-medium">{label}</div>
      <div className="text-sm text-[var(--text-muted)] mb-3">{description}</div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1.5 rounded-md text-sm border transition ${
                selected
                  ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white"
                  : "border-[var(--border)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              }`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ReadyPage() {
  const mounted = useMounted();
  // localStorage is read lazily during client hydration; while !mounted we render a loading state
  const [answers, setAnswers] = useState<ChecklistAnswers>(() =>
    typeof window === "undefined" ? defaultAnswers() : loadAnswers()
  );
  const [travelerContext, setTravelerContext] = useState<TravelerContext>(() =>
    typeof window === "undefined" ? defaultTravelerContext() : loadTravelerContext()
  );

  function toggle(key: keyof ChecklistAnswers) {
    const newAnswers = { ...answers, [key]: !answers[key] };
    setAnswers(newAnswers);
    saveAnswers(newAnswers);
  }

  function setReadiness(
    field: "alipay" | "wechat_pay",
    value: Readiness,
    checklistKey: "has_alipay" | "has_wechat_pay"
  ) {
    const updated = updateTravelerContext({ [field]: value });
    setTravelerContext(updated);
    // Keep the checklist boolean in sync: only an explicit "ready" counts as done.
    const newAnswers = { ...answers, [checklistKey]: readinessToChecked(value) };
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
          {/* Traveler Context summary */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] mb-8">
            <p className="text-sm font-medium text-[var(--text-muted)] mb-2">
              Your traveler profile
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-2 py-1 rounded-md bg-[var(--border)]">
                Alipay: {READINESS_LABELS[travelerContext.alipay]}
              </span>
              <span className="px-2 py-1 rounded-md bg-[var(--border)]">
                WeChat Pay: {READINESS_LABELS[travelerContext.wechat_pay]}
              </span>
            </div>
          </div>

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

          {/* Payment readiness — explicit tri-state controls */}
          <div className="space-y-3 mb-10">
            <h2 className="text-lg font-semibold mb-2">
              Payment readiness
            </h2>
            <TriStateControl
              label="Alipay set up"
              description="Downloaded, registered, and ready to use"
              value={travelerContext.alipay}
              onChange={(v) => setReadiness("alipay", v, "has_alipay")}
            />
            <TriStateControl
              label="WeChat Pay set up"
              description="Downloaded and linked to a payment method"
              value={travelerContext.wechat_pay}
              onChange={(v) => setReadiness("wechat_pay", v, "has_wechat_pay")}
            />
          </div>

          {/* Questions */}
          <div className="space-y-3 mb-10">
            <h2 className="text-lg font-semibold mb-2">
              What else have you prepared?
            </h2>
            {QUESTIONS.filter(
              (q) => q.key !== "has_alipay" && q.key !== "has_wechat_pay"
            ).map((q) => {
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                          No dedicated guide yet
                        </span>
                        <Link
                          href="/guides"
                          className="text-sm px-3 py-1.5 rounded-md border border-[var(--border)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition whitespace-nowrap"
                        >
                          Browse all guides
                        </Link>
                      </div>
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
