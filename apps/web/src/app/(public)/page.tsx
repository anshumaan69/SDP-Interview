"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Brain,
  Code2,
  BarChart3,
  CheckCircle,
  Activity,
  ArrowRight,
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
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen AI Interview Simulation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Master your interviews with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600">
                adaptive AI coaching
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Realistic mock interviews tailored to your target role and experience. Real-time scoring,
              structured feedback rubrics, and integrated coding practice.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Get Started for Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center justify-center"
              >
                Log In
              </Link>
            </div>

            {/* System Status Banner */}
            <div className="mt-12 inline-flex items-center gap-4 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>Backend Status:</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      health?.db === "up" ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                  />
                  <span>PostgreSQL: {health?.db || "checking..."}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      health?.redis === "up" ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                  />
                  <span>Redis: {health?.redis || "checking..."}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Engineered for Realistic Practice
            </h2>
            <p className="mt-2 text-slate-600">
              Every step mirrors top-tier tech interview loops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Adaptive AI Interviews
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Difficulty dynamically adjusts based on your previous answers. Questions evaluate
                relevance, correctness, clarity, and completeness.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Curated Coding Practice
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Over 30-50 curated algorithmic problems with hidden test cases, multi-language
                support (Python, Java, C++), and instant verdicts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Performance Analytics & PDF
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track your historical score trends, identify criteria weaknesses, and download
                comprehensive PDF readiness reports.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
