"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FileText, Download, Plus, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useToast } from "@/components/ui/Toast";

interface ReportItem {
  id: string;
  status: "QUEUED" | "READY" | "FAILED";
  fromDate?: string | null;
  toDate?: string | null;
  downloadUrl?: string | null;
  createdAt: string;
}

export default function ReportsPage() {
  const { success } = useToast();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const res = await apiClient<{ data: ReportItem[] }>("/reports");
      setReports(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGenerating(true);

    try {
      const res = await apiClient<{ data: { reportId: string; status: string } }>("/reports", {
        method: "POST",
        body: JSON.stringify({
          from: fromDate || undefined,
          to: toDate || undefined,
        }),
      });

      success("Report queued for generation!");
      pollReport(res.data.reportId);
    } catch (err: any) {
      if (err.details?.[0]?.issue === "NO_DATA") {
        setError("No completed interview session data available in the selected period.");
      } else {
        setError(err.message || "Failed to generate report");
      }
      setGenerating(false);
    }
  };

  const pollReport = (reportId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await apiClient<{ data: ReportItem }>(`/reports/${reportId}`);
        if (res.data.status === "READY" || res.data.status === "FAILED") {
          clearInterval(interval);
          setGenerating(false);
          fetchReports();
          if (res.data.status === "READY") {
            success("Your PDF report is ready to download!");
          }
        }
      } catch (e) {
        clearInterval(interval);
        setGenerating(false);
      }
    }, 1500);
  };

  const handleDownload = (reportId: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1"}/reports/${reportId}/download`;
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">PDF Readiness Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate comprehensive PDF documentation of your interview progress and rubrics.
        </p>
      </div>

      <ErrorAlert error={error} />

      {/* Generator Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-600" />
          Generate New Performance Report
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Specify a date range or leave empty to include all historical interview loops.
        </p>

        <form onSubmit={handleGenerateReport} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full sm:w-48 px-3.5 py-2.5 border rounded-xl text-sm"
            />
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full sm:w-48 px-3.5 py-2.5 border rounded-xl text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full sm:w-auto px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Generate PDF
              </>
            )}
          </button>
        </form>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">Generated Reports Archive</h3>
        <p className="text-xs text-slate-400">
          In accordance with data retention rules, generated PDF files expire after 24 hours.
        </p>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No reports generated yet. Use the form above to generate your first PDF report.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((r) => (
              <div key={r.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border">
                    <FileText className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Performance Report #{r.id.substring(0, 8)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Created: {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {r.status === "QUEUED" && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
                      <Clock className="w-3.5 h-3.5" /> Processing...
                    </span>
                  )}
                  {r.status === "FAILED" && (
                    <span className="inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> Generation Failed
                    </span>
                  )}
                  {r.status === "READY" && (
                    <button
                      onClick={() => handleDownload(r.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
