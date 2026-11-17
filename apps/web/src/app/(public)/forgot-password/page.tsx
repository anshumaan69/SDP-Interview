"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, ArrowRight, CheckCircle2 } from "lucide-react";
import { apiClient } from "../../../lib/api";
import { ErrorAlert } from "../../../components/ui/ErrorAlert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiClient("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter your email to receive password reset instructions.
          </p>
        </div>

        {sent ? (
          <div className="text-center p-6 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-emerald-900">
              If the email is registered, a password reset link has been sent.
            </p>
            <p className="text-xs text-emerald-700 mt-1">Please check your spam folder as well.</p>
            <Link
              href="/login"
              className="inline-block mt-4 text-xs font-semibold text-brand-600 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <ErrorAlert error={error} className="mb-4" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="candidate@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Remembered your password?{" "}
              <Link href="/login" className="text-brand-600 font-semibold hover:underline">
                Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
