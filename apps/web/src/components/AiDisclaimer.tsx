"use client";

import React from "react";
import { Sparkles, Info } from "lucide-react";

interface AiDisclaimerProps {
  className?: string;
}

export function AiDisclaimer({ className = "" }: AiDisclaimerProps) {
  return (
    <div
      className={`p-4 rounded-xl bg-indigo-50/60 border border-indigo-100/80 text-xs text-indigo-900/80 flex items-start gap-3 shadow-2xs ${className}`}
    >
      <div className="p-1 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5" />
      </div>
      <div className="space-y-0.5">
        <p className="font-semibold text-indigo-950 text-xs">
          AI Preparation Advisory
        </p>
        <p className="leading-relaxed">
          Evaluations, scores, and feedback are generated automatically by AI models
          and rubric heuristics. They are intended solely as preparation and practice
          guidance, not definitive hiring decisions.
        </p>
      </div>
    </div>
  );
}
