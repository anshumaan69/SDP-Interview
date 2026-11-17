"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Clock, Sliders, Brain, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

export default function NewInterviewPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    role: "Software Engineer",
    type: "TECHNICAL",
    difficulty: "MEDIUM",
    questionCount: 5,
    timerSeconds: 120, // 2 mins per question
    hasTimer: true,
    mode: "TEXT",
  });

  const [metaRoles, setMetaRoles] = useState<string[]>([
    "Software Engineer",
    "Frontend Engineer",
    "Backend Engineer",
    "Full Stack Engineer",
    "DevOps Engineer",
    "Data Engineer",
    "Product Manager",
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetaAndProfile() {
      try {
        const [metaRes, meRes] = await Promise.allSettled([
          apiClient<{ data: { roles: string[] } }>("/meta/options"),
          apiClient<{ data: { targetRole: string } }>("/me"),
        ]);

        if (metaRes.status === "fulfilled" && metaRes.value?.data?.roles) {
          setMetaRoles(metaRes.value.data.roles);
        }

        if (meRes.status === "fulfilled" && meRes.value?.data?.targetRole) {
          setForm((f) => ({ ...f, role: meRes.value.data.targetRole }));
        }
      } catch (e) {
        // use defaults
      }
    }
    loadMetaAndProfile();
  }, []);

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient<{ data: { sessionId: string } }>("/sessions", {
        method: "POST",
        body: JSON.stringify({
          role: form.role,
          type: form.type,
          difficulty: form.difficulty,
          questionCount: Number(form.questionCount),
          timerSeconds: form.hasTimer ? Number(form.timerSeconds) : null,
          mode: "TEXT",
        }),
      });

      router.push(`/interview/${res.data.sessionId}`);
    } catch (err: any) {
      setError(err.message || "Failed to initialize interview session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Configure Your Mock Interview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personalize your role, interview type, and pacing.
          </p>
        </div>

        <ErrorAlert error={error} className="mb-6" />

        <form onSubmit={handleStartInterview} className="space-y-6">
          {/* Target Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              Target Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {metaRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Type & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                Interview Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="TECHNICAL">Technical Architecture</option>
                <option value="BEHAVIOURAL">Behavioural & Leadership</option>
                <option value="HR">HR & Cultural Fit</option>
                <option value="MIXED">Mixed Loop</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                Initial Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium (Recommended)</option>
                <option value="HARD">Hard</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Adapts dynamically based on your scores.
              </p>
            </div>
          </div>

          {/* Question Count Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase">
                Number of Questions
              </label>
              <span className="text-sm font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200">
                {form.questionCount} Questions
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              value={form.questionCount}
              onChange={(e) => setForm({ ...form, questionCount: Number(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>5 (Quick)</span>
              <span>10 (Standard)</span>
              <span>20 (Full Loop)</span>
            </div>
          </div>

          {/* Timer Settings */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-800">
                  Per-Question Timer Countdown
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.hasTimer}
                onChange={(e) => setForm({ ...form, hasTimer: e.target.checked })}
                className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
            </div>

            {form.hasTimer && (
              <div className="flex items-center gap-3 pt-1">
                <select
                  value={form.timerSeconds}
                  onChange={(e) => setForm({ ...form, timerSeconds: Number(e.target.value) })}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  <option value={60}>1 minute (60s)</option>
                  <option value={120}>2 minutes (120s)</option>
                  <option value={180}>3 minutes (180s)</option>
                  <option value={300}>5 minutes (300s)</option>
                </select>
                <span className="text-xs text-slate-500">
                  Auto-submits your current text when the countdown reaches zero.
                </span>
              </div>
            )}
          </div>

          {/* Mode (Text) */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-800">Interview Mode</p>
              <p className="text-xs text-slate-500">Voice interview mode is deferred to future scope</p>
            </div>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-brand-600 shadow-sm">
              TEXT
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-2xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-base"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating First Question... (up to 10s)
              </span>
            ) : (
              <>
                <span>Begin Mock Interview</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
