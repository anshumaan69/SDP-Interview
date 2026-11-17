"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Code2,
  Shuffle,
  CheckCircle2,
  Circle,
  Filter,
  Search,
  ArrowRight,
  Terminal,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

interface TopicSummary {
  topic: string;
  total: number;
  easy: number;
  medium: number;
  hard: number;
}

interface ProblemItem {
  id: string;
  title: string;
  slug: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  isSolved: boolean;
  attemptCount: number;
  createdAt: string;
}

function CodingContent() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [randomLoading, setRandomLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function loadTopics() {
      try {
        const res = await apiClient<{ data: TopicSummary[] }>("/coding/topics");
        setTopics(res.data || []);
      } catch (err: any) {
        console.error("Failed to load topics:", err);
      }
    }
    loadTopics();
  }, []);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(selectedTopic ? { topic: selectedTopic } : {}),
        ...(selectedDifficulty ? { difficulty: selectedDifficulty } : {}),
      });

      const res = await apiClient<{
        data: ProblemItem[];
        meta: { total: number };
      }>(`/coding/problems?${query.toString()}`);

      let items = res.data || [];
      if (statusFilter === "solved") {
        items = items.filter((p) => p.isSolved);
      } else if (statusFilter === "unsolved") {
        items = items.filter((p) => !p.isSolved);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        items = items.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.topic.toLowerCase().includes(q)
        );
      }

      setProblems(items);
      setTotal(res.meta.total);
    } catch (err: any) {
      setError(err.message || "Failed to load coding problems");
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedTopic, selectedDifficulty, statusFilter, searchQuery]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleRandomProblem = async () => {
    setRandomLoading(true);
    try {
      const query = new URLSearchParams({
        ...(selectedTopic ? { topic: selectedTopic } : {}),
        ...(selectedDifficulty ? { difficulty: selectedDifficulty } : {}),
      });
      const res = await apiClient<{ data: { slug: string; id: string } }>(
        `/coding/problems/random?${query.toString()}`
      );
      if (res.data) {
        router.push(`/coding/${res.data.slug || res.data.id}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to pick random problem");
    } finally {
      setRandomLoading(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "EASY":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "MEDIUM":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "HARD":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 bg-white">
      {/* Header (Clean white and emerald, no loud blue card) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded">
              <Terminal className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Sandboxed Algorithm Practice
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Algorithmic Problem Bank
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Solve curated data structure problems across Python, Java, and C++ with real-time test execution.
          </p>
        </div>

        <button
          onClick={handleRandomProblem}
          disabled={randomLoading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-all active:scale-95 disabled:opacity-75 whitespace-nowrap"
        >
          <Shuffle className="w-3.5 h-3.5" />
          {randomLoading ? "Selecting..." : "Pick Random Challenge"}
        </button>
      </div>

      {error && <ErrorAlert error={error} />}

      {/* Topic Filter Pill Strip (Sleek pills instead of 6 boxy cards) */}
      {topics.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
          <button
            onClick={() => {
              setSelectedTopic("");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
              selectedTopic === ""
                ? "bg-emerald-800 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Topics ({total})
          </button>
          {topics.map((t) => (
            <button
              key={t.topic}
              onClick={() => {
                setSelectedTopic(t.topic === selectedTopic ? "" : t.topic);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                selectedTopic === t.topic
                  ? "bg-emerald-800 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t.topic} ({t.total})
            </button>
          ))}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Unsolved</option>
          </select>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search problem title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
          />
        </div>
      </div>

      {/* Problems Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading problem set...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Code2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-xs text-slate-700">No problems found</p>
            <p className="text-xs text-slate-400">
              Try adjusting your difficulty or topic filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4 text-center">Attempts</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {problems.map((prob) => (
                  <tr
                    key={prob.id}
                    className="hover:bg-slate-50/75 transition-colors"
                  >
                    <td className="py-3 px-4 text-center">
                      {prob.isSolved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                      )}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <Link
                        href={`/coding/${prob.slug || prob.id}`}
                        className="hover:text-emerald-700 transition-colors"
                      >
                        {prob.title}
                      </Link>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-normal">
                      {prob.topic}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded border ${getDifficultyColor(
                          prob.difficulty
                        )}`}
                      >
                        {prob.difficulty}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center text-slate-500">
                      {prob.attemptCount > 0 ? prob.attemptCount : "—"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/coding/${prob.slug || prob.id}`}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                          prob.isSolved
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            : "bg-emerald-700 text-white hover:bg-emerald-800"
                        }`}
                      >
                        {prob.isSolved ? "Practice" : "Solve"}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {problems.length} of {total} challenges
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CodingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto py-10 px-4 text-center text-xs text-slate-400">
          Loading problem bank...
        </div>
      }
    >
      <CodingContent />
    </Suspense>
  );
}
