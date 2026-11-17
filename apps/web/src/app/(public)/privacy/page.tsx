import React from "react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-4">
        <p>
          Your privacy is important to us. This Privacy Policy details how InterviewAI collects,
          uses, and protects your information.
        </p>
        <h2 className="text-base font-bold text-slate-800">Data Collection</h2>
        <p>
          We store your name, email, target role, experience level, and responses provided during
          mock interviews to generate evaluation metrics and track your progress.
        </p>
        <h2 className="text-base font-bold text-slate-800">Use of AI Services</h2>
        <p>
          Interview questions and candidate responses may be processed via strict server-side AI
          models. Your data is never used to train public LLM models.
        </p>
        <h2 className="text-base font-bold text-slate-800">Retention & Purge</h2>
        <p>
          In accordance with section §3.4 of our data guidelines, candidate accounts scheduled for
          deletion undergo a 30-day grace period after which all associated records are permanently
          deleted.
        </p>
      </div>
    </div>
  );
}
