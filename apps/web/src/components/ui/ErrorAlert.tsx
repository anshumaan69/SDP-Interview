"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  error: string | null;
  details?: Array<{ field?: string; issue: string }>;
  className?: string;
}

export function ErrorAlert({ error, details, className = "" }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <div
      className={`p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">{error}</p>
          {details && details.length > 0 && (
            <ul className="mt-1.5 list-disc list-inside text-xs text-rose-700 space-y-0.5">
              {details.map((d, idx) => (
                <li key={idx}>
                  {d.field ? <span className="font-semibold">{d.field}: </span> : null}
                  {d.issue}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
