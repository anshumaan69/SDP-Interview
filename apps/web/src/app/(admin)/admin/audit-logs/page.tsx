"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Search, ShieldAlert, History, Calendar } from "lucide-react";
import { apiClient } from "../../../../lib/api";
import { ErrorAlert } from "../../../../components/ui/ErrorAlert";

interface AuditLogItem {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  event: string;
  ip: string | null;
  details: any;
  createdAt: string;
}

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [eventFilter, setEventFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(eventFilter ? { event: eventFilter } : {}),
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
      });

      const res = await apiClient<{ data: AuditLogItem[]; meta: { total: number } }>(
        `/admin/audit-logs?${query.toString()}`
      );
      setLogs(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, eventFilter, fromDate, toDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Security Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Immutable audit record of authentication attempts, administrative changes, and platform events ({total} entries).
        </p>
      </div>

      <ErrorAlert error={error} />

      {/* Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Event Type</label>
          <input
            type="text"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            placeholder="e.g. LOGIN, PASSWORD_RESET..."
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider text-left">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Event</th>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">IP Address</th>
                <th className="px-6 py-3.5">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-sans text-sm">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-sans text-sm">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                          log.event.includes("FAIL") || log.event.includes("DELETE")
                            ? "bg-rose-50 text-rose-700"
                            : log.event.includes("ADMIN")
                            ? "bg-purple-50 text-purple-700"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {log.event}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      {log.userEmail || (log.userId ? log.userId.substring(0, 8) : "Anonymous")}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{log.ip || "127.0.0.1"}</td>
                    <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : "-"}
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
              disabled={logs.length < 20}
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

export default function AuditLogsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Audit Logs...</div>}>
      <AuditLogsContent />
    </Suspense>
  );
}
