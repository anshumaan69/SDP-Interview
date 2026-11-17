"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { History, Search, Filter, Calendar, ChevronRight } from "lucide-react";
import { apiClient } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

interface HistorySessionItem {
  sessionId: string;
  date: string;
  role: string;
  type: string;
  difficulty: string;
  overallScore: number;
  status: string;
}

function HistoryContent() {
  const [sessions, setSessions] = useState<HistorySessionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
      });

      const res = await apiClient<{ data: HistorySessionItem[]; meta: { total: number } }>(
        `/history?${query.toString()}`
      );
      setSessions(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      setError(err.message || "Failed to load session history");
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, roleFilter, fromDate, toDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Interview History</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review all your past mock interviews, feedback notes, and criteria ratings ({total} total).
        </p>
      </div>

      <ErrorAlert error={error} />

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Types</option>
          <option value="TECHNICAL">Technical</option>
          <option value="BEHAVIOURAL">Behavioural</option>
          <option value="HR">HR</option>
          <option value="MIXED">Mixed</option>
        </select>

        <input
          type="text"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          placeholder="Filter by role..."
          className="border rounded-lg px-3 py-2 text-sm"
        />

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider text-left">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Initial Difficulty</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Score</th>
                <th className="px-6 py-3.5 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Loading history...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No past sessions found matching your filters.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {new Date(s.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{s.role}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {s.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{s.difficulty}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          s.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-600">
                      {s.overallScore > 0 ? `${s.overallScore} / 10` : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/history/${s.sessionId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                      >
                        <span>View Report</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50 text-xs text-slate-500">
          <span>Page {page}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={sessions.length < 15}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading History...</div>}>
      <HistoryContent />
    </Suspense>
  );
}
