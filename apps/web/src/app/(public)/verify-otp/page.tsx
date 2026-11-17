"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight, RotateCw } from "lucide-react";
import { apiClient } from "../../../lib/api";
import { ErrorAlert } from "../../../components/ui/ErrorAlert";
import { useToast } from "../../../components/ui/Toast";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success } = useToast();

  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiClient("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });

      success("Email verified successfully! You can now log in.");
      router.push("/login?verified=true");
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 3 || err.code === "OTP_ATTEMPTS_EXCEEDED") {
        setError("Maximum OTP attempts exceeded. Please request a new OTP.");
      } else {
        setError(err.message || "Invalid OTP code");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);

    try {
      await apiClient("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setCooldown(60);
      setAttempts(0);
      success("New OTP sent to your email!");
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Verify your Email</h2>
        <p className="text-sm text-slate-500 mt-1">
          We sent a 6-digit code to <span className="font-medium text-slate-700">{email}</span>
        </p>
        <p className="text-xs text-amber-600 mt-1">Expires in 10 minutes</p>
      </div>

      <ErrorAlert error={error} className="mb-4" />

      <form onSubmit={handleVerify} className="space-y-4">
        {!emailParam && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            6-Digit Code
          </label>
          <input
            type="text"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-full px-3.5 py-3 rounded-lg border border-slate-200 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6 || attempts >= 3}
          className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify Code"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 disabled:text-slate-400"
        >
          <RotateCw className="w-3.5 h-3.5" />
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-400">Loading verification...</div>}>
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
