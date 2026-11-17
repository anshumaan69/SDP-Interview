import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "../components/Navbar";
import { ToastProvider } from "../components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InterviewAI - AI Interview Preparation Platform",
  description:
    "AI-assisted mock interview platform with real-time feedback, adaptive difficulty, and live coding practice.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
                <p>© 2026 InterviewAI. All rights reserved.</p>
                <div className="flex gap-4">
                  <a href="/terms" className="hover:underline">
                    Terms
                  </a>
                  <a href="/privacy" className="hover:underline">
                    Privacy
                  </a>
                  <a href="/help" className="hover:underline">
                    Help / FAQ
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
