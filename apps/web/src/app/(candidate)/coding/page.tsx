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
  ChevronRight,
  BookOpen,
  ArrowRight,
  Sparkles,
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
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [randomLoading, setRandomLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>(""); // all, solved, unsolved
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Load Topics
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

  // Fetch Problems
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

  // Handle Pick Random Problem
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
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "MEDIUM":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "HARD":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-700 p-8 rounded-2xl text-white shadow-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <Code2 className="w-5 h-5 text-white" />
            </span>
            <span className="text-sm font-semibold tracking-wide uppercase text-brand-100">
              Interactive Sandbox Practice
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Coding Problem Bank
          </h1>
          <p className="text-brand-100 max-w-xl text-sm leading-relaxed">
            Solve curated data structure and algorithm challenges across Python,
            Java, and C++ with real-time test execution and automatic verdicts.
          </p>
        </div>

        <button
          onClick={handleRandomProblem}
          disabled={randomLoading}
          className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-all shadow-md active:scale-95 disabled:opacity-75 whitespace-nowrap"
        >
          <Shuffle className="w-4 h-4 text-brand-600" />
          {randomLoading ? "Selecting..." : "Pick Random Problem"}
        </button>
      </div>

      {error && <ErrorAlert error={error} />}

      {/* Topic Cards Carousel / Grid */}
      {topics.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600" />
            Curated Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => {
                setSelectedTopic("");
                setPage(1);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedTopic === ""
                  ? "border-brand-600 bg-brand-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-brand-200"
              }`}
            >
              <div className="font-semibold text-xs text-gray-900 truncate">
                All Topics
              </div>
              <div className="text-xs text-gray-500 mt-1">30 Problems</div>
            </button>

            {topics.map((t) => (
              <button
                key={t.topic}
                onClick={() => {
                  setSelectedTopic(t.topic === selectedTopic ? "" : t.topic);
                  setPage(1);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedTopic === t.topic
                    ? "border-brand-600 bg-brand-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-brand-200"
                }`}
              >
                <div className="font-semibold text-xs text-gray-900 truncate" title={t.topic}>
                  {t.topic}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
                  <span className="text-emerald-600 font-medium">{t.easy}E</span>
                  <span>•</span>
                  <span className="text-amber-600 font-medium">{t.medium}M</span>
                  <span>•</span>
                  <span className="text-rose-600 font-medium">{t.hard}H</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4 text-gray-400" />
            Filters:
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setPage(1);
            }}
            className="text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Unsolved</option>
          </select>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search problem title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900"
          />
        </div>
      </div>

      {/* Problems Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Loading coding problems...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Code2 className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="font-semibold text-gray-800">No problems found</h3>
            <p className="text-xs text-gray-500">
              Try adjusting your topic or difficulty filters to see more challenges.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4 text-center">Attempts</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {problems.map((prob) => (
                  <tr
                    key={prob.id}
                    className="hover:bg-gray-50/75 transition-colors group"
                  >
                    <td className="py-3.5 px-4 text-center">
                      {prob.isSolved ? (
                        <CheckCircle2
                          className="w-5 h-5 text-emerald-500 mx-auto"
                        />
                      ) : (
                        <Circle
                          className="w-4 h-4 text-gray-300 mx-auto"
                        />
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      <Link
                        href={`/coding/${prob.slug || prob.id}`}
                        className="hover:text-brand-600 transition-colors flex items-center gap-1.5"
                      >
                        {prob.title}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      <span className="px-2.5 py-1 bg-gray-100 rounded-md font-medium">
                        {prob.topic}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border ${getDifficultyColor(
                          prob.difficulty
                        )}`}
                      >
                        {prob.difficulty}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center text-xs text-gray-500">
                      {prob.attemptCount > 0 ? (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full font-semibold text-gray-700">
                          {prob.attemptCount}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/coding/${prob.slug || prob.id}`}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          prob.isSolved
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                        }`}
                      >
                        {prob.isSolved ? "Practice Again" : "Solve"}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
            <span>
              Showing {problems.length} of {total} problems
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-50"
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
        <div className="max-w-7xl mx-auto py-10 px-4 text-center text-sm text-gray-500">
          Loading Coding Practice...
        </div>
      }
    >
      <CodingContent />
    </Suspense>
  );
}
