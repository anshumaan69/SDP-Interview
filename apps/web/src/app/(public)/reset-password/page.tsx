"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, ArrowRight } from "lucide-react";
import { apiClient } from "../../../lib/api";
import { ErrorAlert } from "../../../components/ui/ErrorAlert";
import { useToast } from "../../../components/ui/Toast";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success } = useToast();

  const tokenParam = searchParams.get("token") || "";
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await apiClient("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });

      success("Password successfully reset! Please log in with your new password.");
      router.push("/login");
    } catch (err: any) {
      setError(
        err.code === "TOKEN_INVALID_OR_EXPIRED"
          ? "Reset link has expired or is invalid. Please request a new one."
          : err.message || "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Set New Password</h2>
        <p className="text-sm text-slate-500 mt-1">Choose a strong password with letters and numbers</p>
      </div>

      <ErrorAlert error={error} className="mb-4" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {!tokenParam && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Reset Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            New Password
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Reset Password"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/forgot-password" className="text-brand-600 hover:underline">
          Request a new reset link
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-400">Loading password reset...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
