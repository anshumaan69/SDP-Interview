"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Target, ArrowRight } from "lucide-react";
import { apiClient } from "../../../lib/api";
import { ErrorAlert } from "../../../components/ui/ErrorAlert";
import { useToast } from "../../../components/ui/Toast";

export default function SignupPage() {
  const router = useRouter();
  const { success } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    targetRole: "Software Engineer",
    experienceLevel: "FRESHER",
    acceptTerms: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<Array<{ field?: string; issue: string }>>([]);
  const [loading, setLoading] = useState(false);

  // Live password strength indicator
  const hasMinLength = form.password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(form.password);
  const hasDigit = /[0-9]/.test(form.password);
  const isStrong = hasMinLength && hasLetter && hasDigit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDetails([]);

    if (!form.acceptTerms) {
      setError("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    if (!isStrong) {
      setError("Password must be at least 8 characters with at least one letter and one number");
      return;
    }

    setLoading(true);

    try {
      await apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          targetRole: form.targetRole,
          experienceLevel: form.experienceLevel,
        }),
      });

      success("Account created! Check your email for verification code.");
      router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (err: any) {
      setError(err.message || "Registration failed");
      if (err.details && Array.isArray(err.details)) {
        setDetails(err.details);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12 bg-slate-50/50">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
          <p className="text-xs text-slate-500 mt-1">Start practicing realistic mock interviews today</p>
        </div>

        <ErrorAlert error={error} details={details} className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Alex Smith"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="alex@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Role</label>
            <select
              value={form.targetRole}
              onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Software Engineer">Software Engineer</option>
              <option value="Frontend Engineer">Frontend Engineer</option>
              <option value="Backend Engineer">Backend Engineer</option>
              <option value="Full Stack Engineer">Full Stack Engineer</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="Data Engineer">Data Engineer</option>
              <option value="Product Manager">Product Manager</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Experience Level</label>
            <select
              value={form.experienceLevel}
              onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="FRESHER">Fresher (Student / Graduate)</option>
              <option value="0_1_YEARS">0 - 1 Years</option>
              <option value="1_3_YEARS">1 - 3 Years</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
            />
            {/* Live strength hint */}
            <div className="mt-2 flex gap-3 text-xs text-slate-500">
              <span className={hasMinLength ? "text-emerald-700 font-semibold" : "text-slate-400"}>
                ✓ 8+ chars
              </span>
              <span className={hasLetter ? "text-emerald-700 font-semibold" : "text-slate-400"}>
                ✓ Letter
              </span>
              <span className={hasDigit ? "text-emerald-700 font-semibold" : "text-slate-400"}>
                ✓ Number
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={form.acceptTerms}
              onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })}
              className="mt-1 rounded text-emerald-700 focus:ring-emerald-500"
            />
            <label htmlFor="terms" className="text-xs text-slate-600 leading-normal">
              I agree to the{" "}
              <Link href="/terms" className="text-emerald-700 font-medium hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-emerald-700 font-medium hover:underline">
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
