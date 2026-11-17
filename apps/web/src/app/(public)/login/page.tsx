"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";
import { apiClient, setAccessToken } from "../../../lib/api";
import { ErrorAlert } from "../../../components/ui/ErrorAlert";
import { useToast } from "../../../components/ui/Toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success } = useToast();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      success("Email verified! Please log in.");
    }
  }, [searchParams, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient<{
        data: {
          accessToken: string;
          user: { id: string; name: string; email: string; role: string };
        };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setAccessToken(res.data.accessToken);
      success(`Welcome back, ${res.data.user.name}!`);

      if (res.data.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      if (err.code === "ACCOUNT_LOCKED") {
        setError(
          "Account is temporarily locked due to 5 failed attempts. Please try again in 15 minutes or reset your password."
        );
      } else if (err.code === "ACCOUNT_BLOCKED") {
        setError("Your account has been blocked by an administrator. Please contact support.");
      } else if (err.code === "EMAIL_NOT_VERIFIED") {
        setError("Email is not verified yet. Please check your inbox or verify your code.");
      } else {
        setError(err.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sign in to your account</h2>
        <p className="text-sm text-slate-500 mt-1">Enter your details to access your dashboard</p>
      </div>

      <ErrorAlert error={error} className="mb-4" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="candidate@example.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs text-brand-600 hover:text-brand-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Log In"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-400">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
