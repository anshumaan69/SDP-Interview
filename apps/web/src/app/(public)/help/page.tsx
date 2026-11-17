import React from "react";
import { HelpCircle, Sparkles, Code2, ShieldCheck, Mail } from "lucide-react";

export default function HelpPage() {
  const faqs = [
    {
      q: "How does the AI Mock Interview work?",
      a: "When you configure a session, questions are generated tailored to your role and experience level. As you answer each question, an automated evaluation pipeline scores your response across relevance, correctness, clarity, and completeness, dynamically adjusting subsequent question difficulty.",
    },
    {
      q: "What is adaptive difficulty?",
      a: "If your average score over two consecutive questions is 7.5 or higher, the platform promotes you to a higher difficulty level. If both drop to 4.0 or lower, difficulty eases to match your baseline.",
    },
    {
      q: "How are coding problems executed?",
      a: "Code is executed against structured test cases inside an isolated sandbox environment supporting Python, Java, and C++ with strict CPU, memory, and timeout limits.",
    },
    {
      q: "How do I reset my password?",
      a: "Visit the Forgot Password page, enter your registered email, and use the 30-minute one-time link sent to your inbox.",
    },
    {
      q: "What happens if I delete my account?",
      a: "Your account is flagged for deletion and you are immediately logged out. You have 30 days to log back in to reactivate it before all data is permanently purged.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h1>
        <p className="text-sm text-slate-500 mt-2">
          Everything you need to know about the AI Interview Preparation Platform
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-2">{faq.q}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
