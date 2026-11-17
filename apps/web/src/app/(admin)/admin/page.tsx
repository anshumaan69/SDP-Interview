"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  HelpCircle,
  Clock,
  Activity,
  ArrowRight,
  ShieldAlert,
  FileQuestion,
  UserCheck,
  History,
} from "lucide-react";
import { apiClient } from "../../../lib/api";
import { ErrorAlert } from "../../../components/ui/ErrorAlert";

export default function AdminOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    totalQuestions: number;
    sessionsToday: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiClient<{ data: any }>("/admin/stats");
        setStats(res.data);
      } catch (err: any) {
        if (err.status === 403) {
          router.push("/dashboard");
        } else {
          setError(err.message || "Failed to load admin stats");
        }
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [router]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Admin Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor system metrics, manage the question bank, and view candidate activity.
        </p>
      </div>

      <ErrorAlert error={error} />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Candidates</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? "..." : stats?.totalUsers}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{stats?.activeUsers || 0} active</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Question Bank</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? "..." : stats?.totalQuestions}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Curated fallback bank</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Sessions</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? "..." : stats?.totalSessions}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Completed & in-progress</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Sessions Today</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? "..." : stats?.sessionsToday}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Current UTC day</p>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <Link
          href="/admin/questions"
          className="group p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
            Question Bank Manager
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Create, edit, deduplicate, and bulk CSV import interview questions.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand-600">
            <span>Manage questions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="group p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            User Accounts & Security
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Search candidates, manage account statuses (Active / Blocked), and revoke sessions.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600">
            <span>Manage users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/admin/audit-logs"
          className="group p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
            Compliance Audit Logs
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Inspect security events, logins, failed attempts, and administrative modifications.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-purple-600">
            <span>View audit logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
