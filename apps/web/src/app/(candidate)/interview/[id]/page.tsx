"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  Pause,
  Play,
  SkipForward,
  LogOut,
  Send,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useToast } from "@/components/ui/Toast";

interface SessionData {
  id: string;
  status: "IN_PROGRESS" | "PAUSED" | "COMPLETED" | "ENDED_EARLY";
  config: {
    role: string;
    type: string;
    difficulty: string;
    currentDifficulty: string;
    questionCount: number;
    timerSeconds: number | null;
  };
  currentIndex: number;
  total: number;
  question: {
    id: string;
    index: number;
    text: string;
    type: string;
    difficulty: string;
  } | null;
}

interface EvaluationData {
  scores: {
    relevance: number;
    correctness: number;
    clarity: number;
    completeness: number;
    overall: number;
  };
  feedback: string;
  sampleAnswer: string;
  nextDifficulty: string;
  nextQuestion: any;
  isLast: boolean;
}

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { success } = useToast();

  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Answer State
  const [answerText, setAnswerText] = useState("");
  const [timeTaken, setTimeTaken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);

  // Timer
  const [countdown, setCountdown] = useState<number | null>(null);
  const isPaused = session?.status === "PAUSED";

  // Modals
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await apiClient<{ data: SessionData }>(`/sessions/${sessionId}`);
      setSession(res.data);

      if (res.data.status === "COMPLETED" || res.data.status === "ENDED_EARLY") {
        router.push(`/interview/${sessionId}/result`);
        return;
      }

      if (res.data.config.timerSeconds) {
        setCountdown(res.data.config.timerSeconds);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Timer Countdown Effect
  useEffect(() => {
    if (countdown === null || isPaused || isEvaluating || evaluation !== null) return;

    if (countdown <= 0) {
      // Auto-submit or skip on timer expiry
      handleAutoSubmitOnExpiry();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      setTimeTaken((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, isPaused, isEvaluating, evaluation]);

  const handleAutoSubmitOnExpiry = () => {
    if (answerText.trim().length > 0) {
      handleSubmitAnswer();
    } else {
      handleConfirmSkip();
    }
  };

  const handleSubmitAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session?.question || !answerText.trim()) return;

    setError(null);
    setIsSubmitting(true);
    setIsEvaluating(true);

    try {
      const idempotencyKey = `ans-${session.question.id}-${Date.now()}`;
      const res = await apiClient<{ data: { answerId: string; evalStatus: string } }>(
        `/sessions/${sessionId}/answers`,
        {
          method: "POST",
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            questionId: session.question.id,
            answerText: answerText.trim(),
            timeTakenSeconds: timeTaken,
          }),
        }
      );

      // Start Polling Evaluation
      pollEvaluation(res.data.answerId);
    } catch (err: any) {
      setError(err.message || "Failed to submit answer");
      setIsEvaluating(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollEvaluation = async (answerId: string) => {
    const startTime = Date.now();
    const interval = setInterval(async () => {
      try {
        const res = await apiClient<{ data: any }>(
          `/sessions/${sessionId}/answers/${answerId}`
        );

        if (res.data.evalStatus === "DONE") {
          clearInterval(interval);
          setEvaluation(res.data);
          setIsEvaluating(false);
        } else if (Date.now() - startTime > 35000) {
          // Timeout after 35s
          clearInterval(interval);
          setIsEvaluating(false);
          setError("Evaluation timed out. Please proceed to the next question.");
        }
      } catch (e) {
        clearInterval(interval);
        setIsEvaluating(false);
      }
    }, 1500);
  };

  const handleNextQuestion = () => {
    if (evaluation?.isLast) {
      router.push(`/interview/${sessionId}/result`);
      return;
    }

    // Reset local state for next question
    setAnswerText("");
    setTimeTaken(0);
    setEvaluation(null);
    if (session?.config.timerSeconds) {
      setCountdown(session.config.timerSeconds);
    }

    fetchSession();
  };

  const handleConfirmSkip = async () => {
    if (!session?.question) return;
    setShowSkipModal(false);
    setError(null);

    try {
      const res = await apiClient<{ data: { isLast: boolean; nextQuestion: any } }>(
        `/sessions/${sessionId}/skip`,
        {
          method: "POST",
          body: JSON.stringify({ questionId: session.question.id }),
        }
      );

      if (res.data.isLast) {
        router.push(`/interview/${sessionId}/result`);
      } else {
        setAnswerText("");
        setTimeTaken(0);
        setEvaluation(null);
        if (session.config.timerSeconds) {
          setCountdown(session.config.timerSeconds);
        }
        fetchSession();
      }
    } catch (err: any) {
      setError(err.message || "Failed to skip question");
    }
  };

  const handleTogglePause = async () => {
    try {
      if (isPaused) {
        await apiClient(`/sessions/${sessionId}/resume`, { method: "POST" });
        success("Session resumed.");
      } else {
        await apiClient(`/sessions/${sessionId}/pause`, { method: "POST" });
        success("Session paused.");
      }
      fetchSession();
    } catch (err: any) {
      setError(err.message || "Failed to pause/resume session");
    }
  };

  const handleEndEarly = async () => {
    try {
      await apiClient(`/sessions/${sessionId}/end`, { method: "POST" });
      router.push(`/interview/${sessionId}/result`);
    } catch (err: any) {
      setError(err.message || "Failed to end session");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center text-slate-500">
        Loading interview session...
      </div>
    );
  }

  const currentQ = session?.question;
  const progressPercent = session ? (session.currentIndex / session.total) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header & Progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                Question {session?.currentIndex || 1} of {session?.total || 5}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  currentQ?.difficulty === "EASY"
                    ? "bg-emerald-50 text-emerald-700"
                    : currentQ?.difficulty === "MEDIUM"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {currentQ?.difficulty || "MEDIUM"}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                {currentQ?.type}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Role: <span className="font-medium text-slate-700">{session?.config.role}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {countdown !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold ${
                  countdown <= 15
                    ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>
                  {Math.floor(countdown / 60)}:
                  {(countdown % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}

            <button
              onClick={handleTogglePause}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
              title={isPaused ? "Resume Session" : "Pause Session"}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-600" /> : <Pause className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowEndModal(true)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-rose-50 text-slate-500 hover:text-rose-600"
              title="End Interview Early"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <ErrorAlert error={error} />

      {/* Paused Warning */}
      {isPaused && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-sm text-amber-900">
          <span>Session is currently paused. Resume when you are ready to continue.</span>
          <button
            onClick={handleTogglePause}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
          >
            Resume Now
          </button>
        </div>
      )}

      {/* Main Question Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Interview Question
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 leading-relaxed">
            {currentQ?.text}
          </h2>
        </div>

        {/* Answer Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-slate-700 uppercase">
              Your Response
            </label>
            <span
              className={`text-xs ${
                answerText.length > 1900 ? "text-rose-600 font-bold" : "text-slate-400"
              }`}
            >
              {answerText.length} / 2000 characters
            </span>
          </div>

          <textarea
            disabled={isPaused || isEvaluating || evaluation !== null}
            maxLength={2000}
            rows={8}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Structure your answer clearly. Explain your technical reasoning, constraints considered, and real-world trade-offs..."
            className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 font-sans"
          />
        </div>

        {/* Actions before submit */}
        {!evaluation && !isEvaluating && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowSkipModal(true)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1.5"
            >
              <SkipForward className="w-4 h-4" /> Skip Question
            </button>

            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || !answerText.trim() || isPaused}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <span>Submit Answer</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Evaluating State */}
        {isEvaluating && (
          <div className="p-6 rounded-xl bg-indigo-50/50 border border-indigo-100 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-indigo-900">
              Evaluating your response against the interview rubric...
            </p>
            <p className="text-xs text-indigo-600">
              Analyzing relevance, technical correctness, clarity, and completeness.
            </p>
          </div>
        )}

        {/* Evaluation Card after Submit */}
        {evaluation && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-6 animate-slide-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  Answer Evaluation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Next question difficulty dynamically adapted to:{" "}
                  <span className="font-semibold text-brand-700">
                    {evaluation.nextDifficulty}
                  </span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-brand-600">
                  {evaluation.scores.overall}
                </span>
                <span className="text-xs text-slate-400"> / 10</span>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Overall</p>
              </div>
            </div>

            {/* Criteria Score Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <p className="text-slate-500 mb-1">Relevance</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-slate-900">
                    {evaluation.scores.relevance}
                  </span>
                  <span className="text-[10px] text-slate-400">/10</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <p className="text-slate-500 mb-1">Correctness</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-slate-900">
                    {evaluation.scores.correctness}
                  </span>
                  <span className="text-[10px] text-slate-400">/10</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <p className="text-slate-500 mb-1">Clarity</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-slate-900">
                    {evaluation.scores.clarity}
                  </span>
                  <span className="text-[10px] text-slate-400">/10</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <p className="text-slate-500 mb-1">Completeness</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-slate-900">
                    {evaluation.scores.completeness}
                  </span>
                  <span className="text-[10px] text-slate-400">/10</span>
                </div>
              </div>
            </div>

            {/* Written Feedback */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Constructive Feedback
              </p>
              <p className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed">
                {evaluation.feedback}
              </p>
            </div>

            {/* Sample Answer */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Ideal Reference Answer
              </p>
              <p className="text-xs text-slate-600 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed font-mono">
                {evaluation.sampleAnswer}
              </p>
            </div>

            {/* Next Action */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-md"
              >
                <span>{evaluation.isLast ? "Finish & View Results" : "Next Question"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skip Confirmation Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Skip this question?</h3>
            <p className="text-sm text-slate-600">
              Skipping will record a score of 0 for this question. Per scoring rules, skipped
              questions are excluded from your overall session mean score.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSkipModal(false)}
                className="px-4 py-2 border rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSkip}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold"
              >
                Yes, Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Early Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">End interview early?</h3>
            <p className="text-sm text-slate-600">
              Your answers submitted so far will be evaluated and summarized into a performance report.
              You will not be able to resume this session later.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 border rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                Stay in Interview
              </button>
              <button
                onClick={handleEndEarly}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
