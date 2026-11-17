"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target,
  Trophy,
  Activity,
  Play,
  Code2,
  Calendar,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Layers,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

interface SummaryData {
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  bestScore: number;
  lastSessionAt: string | null;
}

interface TrendItem {
  date: string;
  averageScore: number;
  sessions: number;
}

interface CategoryData {
  byType: Array<{ type: string; averageScore: number; sessions: number }>;
  byCriterion: {
    relevance: number;
    correctness: number;
    clarity: number;
    completeness: number;
  };
}

interface SessionItem {
  sessionId: string;
  date: string;
  role: string;
  type: string;
  difficulty: string;
  overallScore: number;
  status: string;
}

export default function CandidateDashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [categories, setCategories] = useState<CategoryData | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionItem[]>([]);
  const [resumable, setResumable] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [sumRes, trendRes, catRes, histRes, resumableRes] = await Promise.all([
          apiClient<{ data: SummaryData }>("/dashboard/summary"),
          apiClient<{ data: TrendItem[] }>("/dashboard/trend"),
          apiClient<{ data: CategoryData }>("/dashboard/categories"),
          apiClient<{ data: SessionItem[] }>("/history?limit=5"),
          apiClient<{ data: any[] }>("/sessions?status=PAUSED,IN_PROGRESS"),
        ]);

        setSummary(sumRes.data);
        setTrend(trendRes.data);
        setCategories(catRes.data);
        setRecentSessions(histRes.data);
        setResumable(resumableRes.data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 text-center text-slate-500">
        Loading performance dashboard...
      </div>
    );
  }

  const hasData = (summary?.totalSessions || 0) > 0;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Candidate Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics across completed interview loops and algorithmic practice.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/interview/new"
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Target className="w-4 h-4" /> Start Interview
          </Link>
          <Link
            href="/coding"
            className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Code2 className="w-4 h-4" /> Coding Sandbox
          </Link>
        </div>
      </div>

      <ErrorAlert error={error} />

      {/* Paused / Resumable Alert Banner */}
      {resumable.length > 0 && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-100 rounded text-emerald-800">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">
                Incomplete interview session in progress
              </p>
              <p className="text-xs text-emerald-800">
                {resumable[0].role} ({resumable[0].type}) • Difficulty: {resumable[0].difficulty}
              </p>
            </div>
          </div>
          <Link
            href={`/interview/${resumable[0].id}`}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs shrink-0 text-center"
          >
            Resume Session
          </Link>
        </div>
      )}

      {/* Unified Stats Strip (Clean single-container horizontal strip instead of 4 separate cards) */}
      <div className="border border-slate-200 rounded-xl bg-slate-50/50 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 grid grid-cols-1 sm:grid-cols-4">
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Loops</span>
            <Activity className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {summary?.totalSessions || 0}
          </div>
          <div className="text-[11px] text-slate-400">
            {summary?.completedSessions || 0} completed
          </div>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Average Score</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {summary?.averageScore || 0} <span className="text-xs font-normal text-slate-400">/ 10</span>
          </div>
          <div className="text-[11px] text-slate-400">Weighted average</div>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Peak Score</span>
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {summary?.bestScore || 0} <span className="text-xs font-normal text-slate-400">/ 10</span>
          </div>
          <div className="text-[11px] text-slate-400">Highest performance</div>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Recent Activity</span>
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate mt-1">
            {summary?.lastSessionAt
              ? new Date(summary.lastSessionAt).toLocaleDateString()
              : "No activity yet"}
          </div>
          <div className="text-[11px] text-slate-400">Last mock interview</div>
        </div>
      </div>

      {!hasData ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl space-y-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Start your first interview loop</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Choose your target role and question count. Dynamic scoring and progression data will appear here.
          </p>
          <Link
            href="/interview/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs shadow-xs"
          >
            <span>Begin Mock Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <>
          {/* Performance Breakdown Section (Editorial layout, not box cards) */}
          <div className="border border-slate-200 rounded-xl p-6 bg-white space-y-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              Score Progression & Category Analysis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              {/* Daily Trend */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-700 uppercase">
                  Daily Score Progression
                </h3>
                <div className="space-y-3">
                  {trend.slice(-5).map((t, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-600">{t.date}</span>
                        <span className="font-bold text-slate-900">
                          {t.averageScore} / 10 ({t.sessions} {t.sessions === 1 ? "session" : "sessions"})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${t.averageScore * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Category */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-700 uppercase">
                  Performance by Interview Type
                </h3>
                <div className="space-y-3">
                  {categories?.byType.map((cat, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-600">{cat.type}</span>
                        <span className="font-bold text-slate-900">{cat.averageScore} / 10</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-700 h-full rounded-full"
                          style={{ width: `${cat.averageScore * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Sessions Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Recent Interview Sessions
              </h2>
              <Link
                href="/history"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>View Full History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {recentSessions.map((s) => (
                <Link
                  key={s.sessionId}
                  href={`/history/${s.sessionId}`}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900 text-sm">
                      {s.role} <span className="text-slate-400 font-normal">• {s.type}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(s.date).toLocaleDateString()} • Difficulty: {s.difficulty}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        s.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {s.status}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {s.overallScore} / 10
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
