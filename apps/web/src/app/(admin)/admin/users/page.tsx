"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Search, ShieldAlert, Trash2, Ban, CheckCircle, UserCheck } from "lucide-react";
import { apiClient } from "../../../../lib/api";
import { ErrorAlert } from "../../../../components/ui/ErrorAlert";
import { useToast } from "../../../../components/ui/Toast";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "BLOCKED";
  sessionCount: number;
  createdAt: string;
}

function AdminUsersContent() {
  const { success } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await apiClient<{ data: { id: string } }>("/me");
        setCurrentAdminId(res.data.id);
      } catch (e) {
        // ignore
      }
    }
    loadMe();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(search ? { q: search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });

      const res = await apiClient<{ data: UserItem[]; meta: { total: number } }>(
        `/admin/users?${query.toString()}`
      );
      setUsers(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleStatus = async (user: UserItem) => {
    const newStatus = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    try {
      await apiClient(`/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      success(`User status updated to ${newStatus}.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? All records will be removed.")) return;
    try {
      await apiClient(`/admin/users/${userId}`, { method: "DELETE" });
      success("User deleted.");
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor candidate accounts, manage active states, and enforce security policies ({total} total).
        </p>
      </div>

      <ErrorAlert error={error} />

      {/* Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates by name or email..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-brand-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider text-left">
              <tr>
                <th className="px-6 py-3.5">Candidate</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Sessions Run</th>
                <th className="px-6 py-3.5">Joined</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentAdminId;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{u.sessionCount}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {!isSelf && (
                          <>
                            <button
                              onClick={() => toggleStatus(u)}
                              className={`px-3 py-1 rounded text-xs font-medium border ${
                                u.status === "ACTIVE"
                                  ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              {u.status === "ACTIVE" ? "Block" : "Unblock"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {isSelf && (
                          <span className="text-xs text-slate-400 italic">Current User</span>
                        )}
                      </td>
                    </tr>
                  );
                })
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
              disabled={users.length < 15}
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

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Users...</div>}>
      <AdminUsersContent />
    </Suspense>
  );
}
