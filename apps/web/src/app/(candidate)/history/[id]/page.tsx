"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  ShieldAlert,
  History,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { AiDisclaimer } from "@/components/AiDisclaimer";

export default function HistoryDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(1);

  const fetchResult = useCallback(async () => {
    try {
      const res = await apiClient<{ data: any }>(`/history/${sessionId}`);
      setResult(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load session details");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center text-slate-500">
        Loading historical session report...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold mb-3">
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>Past Session Archive</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Interview Review
          </h1>
          <p className="text-sm text-slate-500 mt-1">Session ID: {sessionId}</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500">Overall Score</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900">
                {result?.overallScore || 0}
              </span>
              <span className="text-xs text-slate-400">/ 10</span>
            </div>
          </div>
        </div>
      </div>

      <ErrorAlert error={error} />

      {/* Criteria Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-400">Relevance</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {result?.criteriaAverages.relevance}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-400">Correctness</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {result?.criteriaAverages.correctness}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-400">Clarity</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {result?.criteriaAverages.clarity}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-400">Completeness</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {result?.criteriaAverages.completeness}
          </p>
        </div>
      </div>

      {/* Strengths & Weak Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Key Strengths
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {result?.strengths.map((s: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" /> Areas for Growth
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {result?.weakAreas.map((w: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actionable Suggestions */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-6 space-y-3">
        <h3 className="text-base font-bold text-indigo-900 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-indigo-600" /> Recommended Action Items
        </h3>
        <ul className="space-y-2 text-sm text-indigo-800">
          {result?.suggestions.map((s: string, idx: number) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="font-bold">→</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Question-by-Question Review */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Question-by-Question Review</h3>

        <div className="space-y-3">
          {result?.questions.map((q: any) => {
            const isExpanded = expandedQuestion === q.index;
            return (
              <div
                key={q.index}
                className="border border-slate-200 rounded-xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedQuestion(isExpanded ? null : q.index)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {q.index}
                    </span>
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{q.text}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {q.skipped ? (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                        Skipped (0)
                      </span>
                    ) : (
                      <span className="font-bold text-sm text-brand-600">
                        {q.scores?.overall || 0} / 10
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-500 uppercase mb-1">Your Response</p>
                      <p className="text-slate-800 bg-white p-3 rounded-lg border font-mono">
                        {q.answerText || "(No response recorded - Question skipped)"}
                      </p>
                    </div>

                    {q.feedback && (
                      <div>
                        <p className="font-semibold text-slate-500 uppercase mb-1">
                          Evaluator Feedback
                        </p>
                        <p className="text-slate-700 bg-white p-3 rounded-lg border leading-relaxed">
                          {q.feedback}
                        </p>
                      </div>
                    )}

                    {q.sampleAnswer && (
                      <div>
                        <p className="font-semibold text-slate-500 uppercase mb-1">Sample Answer</p>
                        <p className="text-slate-600 bg-white p-3 rounded-lg border font-mono leading-relaxed">
                          {q.sampleAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AiDisclaimer />

      <div className="flex justify-between items-center pt-2">
        <Link
          href="/history"
          className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700"
        >
          Back to History Table
        </Link>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold"
        >
          Candidate Dashboard
        </Link>
      </div>
    </div>
  );
}
