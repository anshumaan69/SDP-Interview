"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Code2,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Terminal,
  FileCode,
  ListOrdered,
  Lock,
  ChevronRight,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

interface VisibleTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  orderIndex: number;
}

interface ProblemDetail {
  id: string;
  title: string;
  slug: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  statement: string;
  constraints: string;
  sampleCases: Array<{ input: string; output: string }>;
  starterCode: {
    python: string;
    java: string;
    cpp: string;
  };
  visibleTestCases: VisibleTestCase[];
  isSolved: boolean;
  attemptCount: number;
}

interface AttemptItem {
  id: string;
  language: string;
  status: string;
  passedCount: number;
  totalCount: number;
  compileError?: string;
  results?: Array<{
    caseNo: number;
    visible: boolean;
    verdict: string;
    runtimeMs: number;
    expected?: string;
    actual?: string;
    stderr?: string;
  }>;
  createdAt: string;
}

function ProblemWorkspace() {
  const params = useParams();
  const router = useRouter();
  const problemParam = params.problemId as string;

  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Left Panel Tab: 'description' | 'submissions'
  const [activeLeftTab, setActiveLeftTab] = useState<"description" | "submissions">(
    "description"
  );
  const [pastAttempts, setPastAttempts] = useState<AttemptItem[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  // Code Editor State
  const [language, setLanguage] = useState<"python" | "java" | "cpp">("python");
  const [code, setCode] = useState<string>("");

  // Bottom Panel State: 'cases' | 'custom' | 'results'
  const [activeBottomTab, setActiveBottomTab] = useState<"cases" | "custom" | "results">(
    "cases"
  );
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState("");

  // Execution states
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<{
    status?: string;
    passedCount?: number;
    total?: number;
    compileError?: string;
    results?: Array<{
      caseNo: number;
      visible: boolean;
      verdict: string;
      runtimeMs: number;
      expected?: string;
      actual?: string;
      stderr?: string;
    }>;
  } | null>(null);

  // Load Problem Data
  useEffect(() => {
    async function fetchProblem() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient<{ data: ProblemDetail }>(
          `/coding/problems/${problemParam}`
        );
        setProblem(res.data);
        if (res.data.starterCode) {
          setCode(res.data.starterCode[language] || "");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load problem statement");
      } finally {
        setLoading(false);
      }
    }
    fetchProblem();
  }, [problemParam]);

  // When language changes, update code if starter code exists
  const handleLanguageChange = (newLang: "python" | "java" | "cpp") => {
    setLanguage(newLang);
    if (problem?.starterCode?.[newLang]) {
      setCode(problem.starterCode[newLang]);
    }
  };

  // Reset to starter code
  const handleResetCode = () => {
    if (problem?.starterCode?.[language]) {
      setCode(problem.starterCode[language]);
    }
  };

  // Load Past Submissions for problem
  const loadPastAttempts = useCallback(async () => {
    if (!problem?.id) return;
    setAttemptsLoading(true);
    try {
      const res = await apiClient<{ data: AttemptItem[] }>(
        `/coding/attempts?problemId=${problem.id}&limit=20`
      );
      setPastAttempts(res.data || []);
    } catch (err) {
      console.error("Failed to load attempts:", err);
    } finally {
      setAttemptsLoading(false);
    }
  }, [problem?.id]);

  useEffect(() => {
    if (activeLeftTab === "submissions" && problem?.id) {
      loadPastAttempts();
    }
  }, [activeLeftTab, problem?.id, loadPastAttempts]);

  // Handle Tab key in Textarea (insert 4 spaces)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Run Code
  const handleRunCode = async () => {
    if (!problem?.id) return;
    setRunning(true);
    setError(null);
    setActiveBottomTab("results");
    try {
      const payload: any = {
        language,
        code,
      };
      if (activeBottomTab === "custom" && customInput.trim()) {
        payload.customInput = customInput;
      }

      const res = await apiClient<{ data: any }>(
        `/coding/problems/${problem.id}/run`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      setExecutionOutput(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to execute code");
    } finally {
      setRunning(false);
    }
  };

  // Submit Code
  const handleSubmitCode = async () => {
    if (!problem?.id) return;
    setSubmitting(true);
    setError(null);
    setActiveBottomTab("results");
    try {
      const idempotencyKey = `sub-${problem.id}-${Date.now()}`;
      const res = await apiClient<{ data: AttemptItem }>(
        `/coding/problems/${problem.id}/submit`,
        {
          method: "POST",
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            language,
            code,
          }),
        }
      );

      setExecutionOutput({
        status: res.data.status,
        passedCount: res.data.passedCount,
        total: res.data.totalCount,
        compileError: res.data.compileError,
        results: res.data.results,
      });

      if (res.data.status === "PASSED") {
        setProblem((prev) => (prev ? { ...prev, isSolved: true } : prev));
      }
    } catch (err: any) {
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "EASY":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "MEDIUM":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "HARD":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Loading IDE and problem workspace...</p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Problem Not Found</h2>
        <p className="text-sm text-gray-500">
          The problem you are looking for does not exist or may have been moved.
        </p>
        <Link
          href="/coding"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Problem Bank
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
      {/* Workspace Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 sticky top-16 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/coding"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Back to Problems"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-gray-900">{problem.title}</h1>
              <span
                className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${getDifficultyColor(
                  problem.difficulty
                )}`}
              >
                {problem.difficulty}
              </span>
              <span className="px-2 py-0.5 text-[11px] bg-gray-100 text-gray-600 rounded-md font-medium">
                {problem.topic}
              </span>
              {problem.isSolved && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Solved
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) =>
              handleLanguageChange(e.target.value as "python" | "java" | "cpp")
            }
            className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="python">Python 3</option>
            <option value="java">Java 17</option>
            <option value="cpp">C++ (GCC 11)</option>
          </select>

          <button
            onClick={handleResetCode}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-xs font-medium flex items-center gap-1"
            title="Reset Starter Code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleRunCode}
            disabled={running || submitting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-gray-700 fill-current" />
            {running ? "Running..." : "Run"}
          </button>

          <button
            onClick={handleSubmitCode}
            disabled={running || submitting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 max-w-7xl mx-auto w-full">
          <ErrorAlert error={error} />
        </div>
      )}

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Panel: Description & Submissions */}
        <div className="lg:col-span-5 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-4">
            <button
              onClick={() => setActiveLeftTab("description")}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeLeftTab === "description"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <FileCode className="w-4 h-4" />
              Description
            </button>
            <button
              onClick={() => setActiveLeftTab("submissions")}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeLeftTab === "submissions"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              Submissions
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {activeLeftTab === "description" ? (
              <div className="space-y-6 text-sm text-gray-800 leading-relaxed">
                {/* Statement */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Problem Statement
                  </h3>
                  <div className="whitespace-pre-line font-normal text-gray-800">
                    {problem.statement}
                  </div>
                </div>

                {/* Constraints */}
                {problem.constraints && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Constraints
                    </h4>
                    <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                      {problem.constraints}
                    </pre>
                  </div>
                )}

                {/* Sample Test Cases */}
                {Array.isArray(problem.sampleCases) && problem.sampleCases.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Sample Cases
                    </h3>
                    {problem.sampleCases.map((sc, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs"
                      >
                        <div className="font-semibold text-gray-600">
                          Example {idx + 1}:
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-500 font-medium">Input:</span>
                          <pre className="bg-white p-2 rounded border border-gray-200 font-mono text-gray-800">
                            {sc.input}
                          </pre>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-500 font-medium">Output:</span>
                          <pre className="bg-white p-2 rounded border border-gray-200 font-mono text-gray-800">
                            {sc.output}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Submissions History */
              <div className="space-y-3">
                {attemptsLoading ? (
                  <div className="py-10 text-center text-xs text-gray-400">
                    Loading submissions...
                  </div>
                ) : pastAttempts.length === 0 ? (
                  <div className="py-10 text-center text-xs text-gray-400">
                    No submissions yet for this problem. Click "Submit" to test your code.
                  </div>
                ) : (
                  pastAttempts.map((att) => (
                    <div
                      key={att.id}
                      className="p-3.5 rounded-xl border border-gray-200 bg-white shadow-xs flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              att.status === "PASSED"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {att.status}
                          </span>
                          <span className="text-xs font-medium text-gray-600 uppercase">
                            {att.language}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {new Date(att.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <span className="font-semibold text-gray-700">
                          {att.passedCount} / {att.totalCount}
                        </span>
                        <span className="text-gray-400 block text-[10px]">
                          passed
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Code Editor + Testing / Output Panel */}
        <div className="lg:col-span-7 flex flex-col h-full bg-gray-900 border-l border-gray-800">
          {/* Code Editor */}
          <div className="flex-1 flex flex-col min-h-[360px] relative bg-gray-950">
            <div className="px-4 py-2 bg-gray-900/90 border-b border-gray-800 text-[11px] font-mono text-gray-400 flex items-center justify-between">
              <span>solution.{language === "python" ? "py" : language === "cpp" ? "cpp" : "java"}</span>
              <span>UTF-8 • Tab: 4 spaces</span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="flex-1 w-full bg-gray-950 text-gray-100 font-mono text-xs leading-relaxed p-4 resize-none focus:outline-none focus:ring-0 border-none selection:bg-brand-900 selection:text-brand-100"
              placeholder={`Write your ${language} solution here...`}
            />
          </div>

          {/* Bottom Testing / Output Drawer */}
          <div className="h-64 border-t border-gray-800 bg-gray-900 flex flex-col">
            {/* Drawer Tabs */}
            <div className="flex items-center justify-between px-4 border-b border-gray-800 bg-gray-900">
              <div className="flex">
                <button
                  onClick={() => setActiveBottomTab("cases")}
                  className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                    activeBottomTab === "cases"
                      ? "border-brand-500 text-brand-400"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Test Cases
                </button>
                <button
                  onClick={() => setActiveBottomTab("custom")}
                  className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                    activeBottomTab === "custom"
                      ? "border-brand-500 text-brand-400"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Custom Input
                </button>
                <button
                  onClick={() => setActiveBottomTab("results")}
                  className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                    activeBottomTab === "results"
                      ? "border-brand-500 text-brand-400"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Verdict & Output
                </button>
              </div>

              {running || submitting ? (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>{running ? "Running Sandbox..." : "Evaluating Batch..."}</span>
                </div>
              ) : null}
            </div>

            {/* Drawer Body */}
            <div className="flex-1 p-4 overflow-y-auto text-xs font-mono">
              {activeBottomTab === "cases" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {problem.visibleTestCases.map((tc, idx) => (
                      <button
                        key={tc.id}
                        onClick={() => setSelectedCaseIdx(idx)}
                        className={`px-3 py-1 rounded text-xs font-sans font-semibold transition-colors ${
                          selectedCaseIdx === idx
                            ? "bg-gray-800 text-white border border-gray-700"
                            : "bg-gray-900 text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>

                  {problem.visibleTestCases[selectedCaseIdx] && (
                    <div className="space-y-2">
                      <div>
                        <div className="text-[11px] text-gray-400 font-sans mb-1">
                          Input:
                        </div>
                        <pre className="bg-gray-950 p-2.5 rounded border border-gray-800 text-gray-200 whitespace-pre-wrap">
                          {problem.visibleTestCases[selectedCaseIdx].input}
                        </pre>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 font-sans mb-1">
                          Expected Output:
                        </div>
                        <pre className="bg-gray-950 p-2.5 rounded border border-gray-800 text-emerald-400 whitespace-pre-wrap">
                          {problem.visibleTestCases[selectedCaseIdx].expectedOutput}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeBottomTab === "custom" && (
                <div className="space-y-2 h-full flex flex-col">
                  <label className="text-[11px] text-gray-400 font-sans">
                    Custom Stdin Input (passed to solution via standard input):
                  </label>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter custom input here..."
                    className="flex-1 w-full bg-gray-950 p-3 rounded border border-gray-800 text-gray-200 font-mono text-xs focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>
              )}

              {activeBottomTab === "results" && (
                <div>
                  {!executionOutput ? (
                    <div className="text-gray-500 py-6 text-center font-sans">
                      Click "Run" or "Submit" to execute your solution against sandbox test cases.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Verdict Banner */}
                      <div className="flex items-center justify-between pb-2 border-b border-gray-800 font-sans">
                        <div className="flex items-center gap-2">
                          {executionOutput.status === "PASSED" ||
                          (!executionOutput.status &&
                            executionOutput.passedCount === executionOutput.total) ? (
                            <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              Accepted / Passed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-rose-400 font-bold text-sm">
                              <XCircle className="w-5 h-5 text-rose-400" />
                              {executionOutput.status || "Failed"}
                            </span>
                          )}

                          {executionOutput.total !== undefined && (
                            <span className="text-xs text-gray-400">
                              ({executionOutput.passedCount} / {executionOutput.total} test cases passed)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Compile Error Message */}
                      {executionOutput.compileError && (
                        <div className="bg-rose-950/40 border border-rose-800/60 p-3 rounded text-rose-300 space-y-1">
                          <div className="font-bold font-sans text-xs">
                            Compilation / Execution Error:
                          </div>
                          <pre className="whitespace-pre-wrap font-mono text-[11px]">
                            {executionOutput.compileError}
                          </pre>
                        </div>
                      )}

                      {/* Case Results List */}
                      {executionOutput.results && executionOutput.results.length > 0 && (
                        <div className="space-y-2">
                          {executionOutput.results.map((r) => (
                            <div
                              key={r.caseNo}
                              className="p-2.5 rounded bg-gray-950 border border-gray-800 space-y-1.5"
                            >
                              <div className="flex items-center justify-between font-sans">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-300">
                                    Test Case #{r.caseNo}
                                  </span>
                                  {!r.visible && (
                                    <span className="flex items-center gap-1 text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                                      <Lock className="w-2.5 h-2.5" />
                                      Hidden
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      r.verdict === "PASSED"
                                        ? "bg-emerald-950 text-emerald-400"
                                        : "bg-rose-950 text-rose-400"
                                    }`}
                                  >
                                    {r.verdict}
                                  </span>
                                </div>
                                <span className="text-gray-500 text-[11px]">
                                  {r.runtimeMs} ms
                                </span>
                              </div>

                              {r.visible && (
                                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-gray-900">
                                  {r.expected !== undefined && (
                                    <div>
                                      <span className="text-gray-500 font-sans block">
                                        Expected:
                                      </span>
                                      <span className="text-emerald-400">{r.expected}</span>
                                    </div>
                                  )}
                                  {r.actual !== undefined && (
                                    <div>
                                      <span className="text-gray-500 font-sans block">
                                        Actual Output:
                                      </span>
                                      <span className="text-gray-300">{r.actual || "<empty>"}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {r.stderr && (
                                <div className="text-[11px] text-rose-400 pt-1">
                                  stderr: {r.stderr}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProblemPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto py-20 px-4 text-center text-sm text-gray-500">
          Loading IDE...
        </div>
      }
    >
      <ProblemWorkspace />
    </Suspense>
  );
}
