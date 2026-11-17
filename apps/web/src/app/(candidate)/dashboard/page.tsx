"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Activity,
  Play,
  RotateCw,
  Plus,
  Code2,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronRight,
  TrendingUp,
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
      <div className="max-w-7xl mx-auto py-16 px-4 text-center text-slate-500">
        Loading performance dashboard...
      </div>
    );
  }

  const hasData = (summary?.totalSessions || 0) > 0;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Preparation Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your score trajectories, criteria breakdown, and practice history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/interview/new"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-500/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Start Mock Interview
          </Link>
          <Link
            href="/coding"
            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2"
          >
            <Code2 className="w-4 h-4" /> Practice Coding
          </Link>
        </div>
      </div>

      <ErrorAlert error={error} />

      {/* Paused / Resumable Sessions Alert */}
      {resumable.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Play className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                You have an incomplete session in progress!
              </p>
              <p className="text-xs text-amber-700">
                {resumable[0].role} ({resumable[0].type}) - Difficulty: {resumable[0].difficulty}
              </p>
            </div>
          </div>
          <Link
            href={`/interview/${resumable[0].id}`}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm shrink-0 text-center"
          >
            Resume Interview
          </Link>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Interviews</span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
            {summary?.totalSessions || 0}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {summary?.completedSessions || 0} fully completed
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase text-slate-500">Average Score</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <h3 className="text-3xl font-extrabold text-slate-900">
              {summary?.averageScore || 0}
            </h3>
            <span className="text-xs text-slate-400">/ 10</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Weighted mean of completed</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase text-slate-500">Peak Performance</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <h3 className="text-3xl font-extrabold text-slate-900">{summary?.bestScore || 0}</h3>
            <span className="text-xs text-slate-400">/ 10</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Highest session score</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase text-slate-500">Last Practice</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-bold text-slate-900 mt-3 truncate">
            {summary?.lastSessionAt
              ? new Date(summary.lastSessionAt).toLocaleDateString()
              : "No sessions yet"}
          </p>
          <p className="text-xs text-slate-400 mt-1">Recent activity date</p>
        </div>
      </div>

      {!hasData ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Start your first interview!</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Experience realistic mock technical and behavioural questions tailored to your role.
            Your progress charts will appear right here.
          </p>
          <Link
            href="/interview/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm shadow-md"
          >
            <span>Begin Mock Interview</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-600" /> Score Trajectory (Day-by-Day)
              </h3>
              <div className="space-y-3 pt-2">
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
                        className="bg-brand-600 h-full rounded-full transition-all"
                        style={{ width: `${t.averageScore * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance by Type Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Performance by Interview Type</h3>
              <div className="space-y-3 pt-2">
                {categories?.byType.map((cat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-600">{cat.type}</span>
                      <span className="font-bold text-slate-900">{cat.averageScore} / 10</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${cat.averageScore * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Sessions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Recent Interview Sessions</h3>
              <Link
                href="/history"
                className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
              >
                <span>View Full History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 text-sm">
              {recentSessions.map((s) => (
                <Link
                  key={s.sessionId}
                  href={`/history/${s.sessionId}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {s.role} - <span className="text-slate-500 font-normal">{s.type}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(s.date).toLocaleDateString()} · Difficulty: {s.difficulty}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        s.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {s.status}
                    </span>
                    <span className="text-base font-bold text-brand-600">
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
