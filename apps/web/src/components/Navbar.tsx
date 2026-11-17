"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  Code2,
  FileText,
  User,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  History,
} from "lucide-react";
import { apiClient, setAccessToken } from "../lib/api";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await apiClient<{ data: { id: string; name: string; email: string; role: string } }>(
          "/me"
        );
        if (res?.data) {
          setCurrentUser(res.data);
        }
      } catch (e) {
        setCurrentUser(null);
      }
    }
    loadUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    } finally {
      setAccessToken(null);
      setCurrentUser(null);
      router.push("/login");
    }
  };

  const isCandidate = currentUser?.role === "CANDIDATE";
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <nav className="border-b border-gray-100 bg-white sticky top-0 z-40 backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-gray-900 tracking-tight">
                Interview<span className="text-brand-600">AI</span>
              </span>
            </Link>

            {currentUser && isCandidate && (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    pathname === "/dashboard"
                      ? "text-brand-600 bg-brand-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/history"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    pathname.startsWith("/history")
                      ? "text-brand-600 bg-brand-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <History className="w-4 h-4" />
                  History
                </Link>
                <Link
                  href="/coding"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    pathname.startsWith("/coding")
                      ? "text-brand-600 bg-brand-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  Coding Practice
                </Link>
                <Link
                  href="/reports"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    pathname.startsWith("/reports")
                      ? "text-brand-600 bg-brand-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Reports
                </Link>
              </div>
            )}

            {currentUser && isAdmin && (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    pathname === "/admin"
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Admin Overview
                </Link>
                <Link
                  href="/admin/questions"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    pathname.startsWith("/admin/questions")
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Question Bank
                </Link>
                <Link
                  href="/admin/users"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    pathname.startsWith("/admin/users")
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Users
                </Link>
                <Link
                  href="/admin/audit-logs"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    pathname.startsWith("/admin/audit-logs")
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Audit Logs
                </Link>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{currentUser.name}</span>
                  {isAdmin && (
                    <span className="ml-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      Admin
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 px-4 py-3 space-y-2 bg-white">
          {currentUser ? (
            <>
              <div className="py-2 border-b border-gray-100">
                <p className="font-semibold text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
              {isCandidate && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-medium text-gray-700"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-medium text-gray-700"
                  >
                    History
                  </Link>
                  <Link
                    href="/coding"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-medium text-gray-700"
                  >
                    Coding Practice
                  </Link>
                  <Link
                    href="/reports"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-medium text-gray-700"
                  >
                    Reports
                  </Link>
                </>
              )}
              {isAdmin && (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-medium text-gray-700"
                  >
                    Admin Overview
                  </Link>
                  <Link
                    href="/admin/questions"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-medium text-gray-700"
                  >
                    Question Bank
                  </Link>
                  <Link
                    href="/admin/users"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-medium text-gray-700"
                  >
                    Users
                  </Link>
                  <Link
                    href="/admin/audit-logs"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-medium text-gray-700"
                  >
                    Audit Logs
                  </Link>
                </>
              )}
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-gray-700"
              >
                Profile Settings
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left py-2 text-sm font-medium text-rose-600"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-sm font-medium text-white bg-brand-600 rounded-lg"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
