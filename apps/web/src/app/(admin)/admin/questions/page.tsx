"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  Trash2,
  Edit2,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "../../../../lib/api";
import { ErrorAlert } from "../../../../components/ui/ErrorAlert";
import { useToast } from "../../../../components/ui/Toast";

interface Question {
  id: string;
  text: string;
  type: string;
  role: string;
  difficulty: string;
  idealAnswer?: string | null;
  createdAt: string;
}

function QuestionBankContent() {
  const { success } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    total: number;
    inserted: number;
    failed: Array<{ row: number; reason: string }>;
  } | null>(null);

  // Form State
  const [form, setForm] = useState({
    text: "",
    type: "TECHNICAL",
    role: "Software Engineer",
    difficulty: "MEDIUM",
    idealAnswer: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(searchQuery ? { q: searchQuery } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(diffFilter ? { difficulty: diffFilter } : {}),
      });

      const res = await apiClient<{ data: Question[]; meta: { total: number } }>(
        `/admin/questions?${query.toString()}`
      );
      setQuestions(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      setError(err.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, typeFilter, roleFilter, diffFilter]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingQuestion) {
        await apiClient(`/admin/questions/${editingQuestion.id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        success("Question updated successfully!");
      } else {
        await apiClient("/admin/questions", {
          method: "POST",
          body: JSON.stringify(form),
        });
        success("New question created!");
      }

      setShowAddModal(false);
      setEditingQuestion(null);
      setForm({
        text: "",
        type: "TECHNICAL",
        role: "Software Engineer",
        difficulty: "MEDIUM",
        idealAnswer: "",
      });
      fetchQuestions();
    } catch (err: any) {
      setFormError(err.message || "Failed to save question");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await apiClient(`/admin/questions/${id}`, { method: "DELETE" });
      success("Question deleted.");
      fetchQuestions();
    } catch (err: any) {
      setError(err.message || "Failed to delete question");
    }
  };

  const handleDownloadTemplate = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1"}/admin/questions/bulk/template`, "_blank");
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1"}/admin/questions/bulk`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("sdp_access_token")}`,
          },
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");
      setBulkResult(data.data);
      success(`Bulk upload processed: ${data.data.inserted} added.`);
      fetchQuestions();
    } catch (err: any) {
      setError(err.message || "Bulk upload failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Question Bank</h1>
          <p className="text-sm text-slate-500 mt-1">
            Curated questions repository used for mock interviews and fallback generation ({total} total).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingQuestion(null);
              setForm({
                text: "",
                type: "TECHNICAL",
                role: "Software Engineer",
                difficulty: "MEDIUM",
                idealAnswer: "",
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-4 h-4" /> Bulk CSV
          </button>
        </div>
      </div>

      <ErrorAlert error={error} />

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-brand-500"
          />
        </div>

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

        <select
          value={diffFilter}
          onChange={(e) => setDiffFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Roles</option>
          <option value="Software Engineer">Software Engineer</option>
          <option value="Frontend Engineer">Frontend Engineer</option>
          <option value="Backend Engineer">Backend Engineer</option>
          <option value="Full Stack Engineer">Full Stack Engineer</option>
          <option value="DevOps Engineer">DevOps Engineer</option>
          <option value="Data Engineer">Data Engineer</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider text-left">
              <tr>
                <th className="px-6 py-3.5">Question Text</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Difficulty</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading questions...
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No questions found matching criteria.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900 font-medium max-w-md">
                      <p className="line-clamp-2">{q.text}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {q.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{q.role}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          q.difficulty === "EASY"
                            ? "bg-emerald-50 text-emerald-700"
                            : q.difficulty === "MEDIUM"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingQuestion(q);
                          setForm({
                            text: q.text,
                            type: q.type,
                            role: q.role,
                            difficulty: q.difficulty,
                            idealAnswer: q.idealAnswer || "",
                          });
                          setShowAddModal(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50 text-xs text-slate-500">
          <span>Showing page {page}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={questions.length < 15}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">
                {editingQuestion ? "Edit Question" : "Create New Question"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ErrorAlert error={formError} />

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Question Text
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  placeholder="Explain how..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border rounded-lg px-2.5 py-2 text-sm bg-white"
                  >
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="BEHAVIOURAL">BEHAVIOURAL</option>
                    <option value="HR">HR</option>
                    <option value="MIXED">MIXED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Difficulty
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full border rounded-lg px-2.5 py-2 text-sm bg-white"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    required
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full border rounded-lg px-2.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Ideal Answer / Rubric Guideline
                </label>
                <textarea
                  rows={3}
                  value={form.idealAnswer}
                  onChange={(e) => setForm({ ...form, idealAnswer: e.target.value })}
                  placeholder="Points the candidate should cover..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Bulk Upload Questions (CSV)</h2>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkResult(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Upload a CSV file containing questions. Rows with duplicate content or validation
              failures will be skipped and reported.
            </p>

            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV Template
            </button>

            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleBulkUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
            </div>

            {bulkResult && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <p className="font-semibold text-slate-900">
                  Total Rows: {bulkResult.total} | Successfully Inserted: {bulkResult.inserted} | Failed:{" "}
                  {bulkResult.failed.length}
                </p>

                {bulkResult.failed.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    <table className="min-w-full text-left">
                      <thead className="text-slate-500 font-bold border-b">
                        <tr>
                          <th className="py-1">Row</th>
                          <th className="py-1">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkResult.failed.map((f, i) => (
                          <tr key={i} className="text-rose-700">
                            <td className="py-1 font-semibold">{f.row}</td>
                            <td className="py-1">{f.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminQuestionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Question Bank...</div>}>
      <QuestionBankContent />
    </Suspense>
  );
}
