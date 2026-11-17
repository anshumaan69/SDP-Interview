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
  FileText,
  RotateCw,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

interface ResultData {
  resultStatus: "GENERATING" | "READY";
  overallScore: number;
  criteriaAverages: {
    relevance: number;
    correctness: number;
    clarity: number;
    completeness: number;
  };
  strengths: string[];
  weakAreas: string[];
  suggestions: string[];
  questions: Array<{
    index: number;
    text: string;
    answerText: string | null;
    skipped: boolean;
    scores: {
      relevance: number;
      correctness: number;
      clarity: number;
      completeness: number;
      overall: number;
    } | null;
    feedback: string | null;
    sampleAnswer: string | null;
  }>;
}

export default function InterviewResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(1);

  const fetchResult = useCallback(async () => {
    try {
      const res = await apiClient<{ data: ResultData }>(`/sessions/${sessionId}/result`);
      setResult(res.data);

      if (res.data.resultStatus === "GENERATING") {
        setTimeout(fetchResult, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load interview results");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  if (loading || result?.resultStatus === "GENERATING") {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Synthesizing Session Performance...</h2>
        <p className="text-sm text-slate-500">
          Calculating criteria averages, strengths, weak areas, and actionable recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interview Completed</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Performance Summary
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Evaluated on relevance, correctness, clarity, and completeness.
          </p>
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
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-brand-600 h-full"
              style={{ width: `${(result?.criteriaAverages.relevance || 0) * 10}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-400">Correctness</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {result?.criteriaAverages.correctness}
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full"
              style={{ width: `${(result?.criteriaAverages.correctness || 0) * 10}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-400">Clarity</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {result?.criteriaAverages.clarity}
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full"
              style={{ width: `${(result?.criteriaAverages.clarity || 0) * 10}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-400">Completeness</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {result?.criteriaAverages.completeness}
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-purple-600 h-full"
              style={{ width: `${(result?.criteriaAverages.completeness || 0) * 10}%` }}
            />
          </div>
        </div>
      </div>

      {/* Strengths & Weak Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Key Strengths
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {result?.strengths.map((s, idx) => (
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
            {result?.weakAreas.map((w, idx) => (
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
          {result?.suggestions.map((s, idx) => (
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
          {result?.questions.map((q) => {
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

      {/* AI Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-3 text-xs text-slate-500">
        <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          AI Disclaimer: Scoring criteria and feedback are evaluated algorithmically using LLM
          rubrics and heuristics. They are intended for mock preparation and guidance.
        </p>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href="/dashboard"
          className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 flex items-center justify-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/interview/new"
            className="w-full sm:w-auto px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" /> Start Another Interview
          </Link>
        </div>
      </div>
    </div>
  );
}
