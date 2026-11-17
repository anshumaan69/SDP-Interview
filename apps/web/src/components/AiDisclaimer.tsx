"use client";

import React from "react";
import { Info } from "lucide-react";

interface AiDisclaimerProps {
  className?: string;
}

export function AiDisclaimer({ className = "" }: AiDisclaimerProps) {
  return (
    <div
      className={`p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-3 ${className}`}
    >
      <div className="p-1 rounded bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
        <Info className="w-3.5 h-3.5" />
      </div>
      <div className="space-y-0.5">
        <p className="font-semibold text-emerald-950 text-xs">
          Preparation Advisory
        </p>
        <p className="leading-relaxed text-emerald-900/90">
          Evaluations, scores, and rubrics are generated automatically and intended
          solely as interview preparation guidance.
        </p>
      </div>
    </div>
  );
}
