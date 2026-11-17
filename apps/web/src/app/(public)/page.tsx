"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Target,
  Terminal,
  TrendingUp,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Check,
  Layers,
} from "lucide-react";
import { apiClient } from "../../lib/api";

export default function LandingPage() {
  const [health, setHealth] = useState<{
    status: string;
    db: string;
    redis: string;
  } | null>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await apiClient<{
          data: { status: string; db: string; redis: string };
        }>("/health");
        if (res?.data) {
          setHealth(res.data);
        }
      } catch (e) {
        setHealth({ status: "offline", db: "offline", redis: "offline" });
      }
    }
    checkHealth();
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white text-slate-900">
      {/* Hero Section */}
      <section className="pt-16 pb-20 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6">
              <Target className="w-3.5 h-3.5 text-emerald-700" />
              <span>Role-Specific Mock Interview System</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Rigorous interview practice for{" "}
              <span className="text-emerald-700 underline decoration-emerald-300 decoration-4 underline-offset-4">
                serious candidates.
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
              Simulate technical and behavioral hiring loops with adaptive difficulty,
              exhaustive rubric evaluations, and a self-contained coding sandbox.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Create Candidate Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-all flex items-center justify-center"
              >
                Sign In
              </Link>
            </div>

            {/* System Status Indicators (Clean minimal line, no card) */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Live Cluster:
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    health?.db === "up" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                PostgreSQL: <strong className="text-slate-800">{health?.db || "online"}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    health?.redis === "up" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                Redis Cache: <strong className="text-slate-800">{health?.redis || "online"}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Content Breakdown (Not a grid of cards) */}
      <section className="py-20 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Architectural Design
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Designed to mirror true engineering evaluations.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Rather than generic chatbot replies, InterviewPrep evaluates each response across
                four distinct rubric criteria: Relevance, Correctness, Clarity, and Completeness.
              </p>
              <div className="pt-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Start your first mock session
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Clean list with dividers instead of cards */}
            <div className="md:col-span-7 divide-y divide-slate-200">
              <div className="py-6 first:pt-0 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-emerald-50 text-emerald-700">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Adaptive Question Routing
                  </h3>
                </div>
                <p className="text-sm text-slate-600 pl-11 leading-relaxed">
                  Difficulty calibrates dynamically in real time. Two strong consecutive answers
                  advance the complexity tier, while lower scores gracefully de-escalate.
                </p>
              </div>

              <div className="py-6 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-emerald-50 text-emerald-700">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Sandboxed Algorithmic Practice
                  </h3>
                </div>
                <p className="text-sm text-slate-600 pl-11 leading-relaxed">
                  30+ curated data structure challenges across Python, Java, and C++. Run code
                  against visible samples and hidden test cases with 5-second process isolation.
                </p>
              </div>

              <div className="py-6 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-emerald-50 text-emerald-700">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Granular Performance Tracking & PDF
                  </h3>
                </div>
                <p className="text-sm text-slate-600 pl-11 leading-relaxed">
                  Time-series score progressions, topic strengths, and downloadable server-generated
                  PDF documentation for retrospective review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Process Section (Clean minimal horizontal layout) */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900">How the Workflow Operates</h2>
            <p className="text-xs text-slate-500 mt-1">From setup to comprehensive review</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-1.5">
              <span className="text-xs font-bold text-emerald-700">Step 01</span>
              <h4 className="font-semibold text-sm text-slate-900">Configure Loop</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Select target role, type (Technical, Behavioral, HR), question count, and timer.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-1.5">
              <span className="text-xs font-bold text-emerald-700">Step 02</span>
              <h4 className="font-semibold text-sm text-slate-900">Simulate Response</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Answer live scenario questions with optional countdown timer enforcement.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-1.5">
              <span className="text-xs font-bold text-emerald-700">Step 03</span>
              <h4 className="font-semibold text-sm text-slate-900">Instant Evaluation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive criteria scoring, actionable feedback, and model sample answers.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-1.5">
              <span className="text-xs font-bold text-emerald-700">Step 04</span>
              <h4 className="font-semibold text-sm text-slate-900">Export & Improve</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Analyze progression trends and download comprehensive PDF readiness reports.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
