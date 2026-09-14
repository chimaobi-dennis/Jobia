import { useState } from "react";
import type { FormEvent } from "react";
import type { Job, MatchScoreLabel, Profile } from "../lib/types";
import { mockMatchReferral } from "../lib/matchService";

interface ReferralFormProps {
  job: Job;
  currentProfile: Profile;
  onSubmitted: (referral: {
    job_id: string;
    referrer_id: string;
    candidate_name: string;
    candidate_email: string;
    summary: string;
    resume_url: string | null;
  }) => void;
}

const scoreStyles: Record<MatchScoreLabel, string> = {
  "Strong fit": "bg-emerald-100 text-emerald-800",
  "Partial fit": "bg-amber-100 text-amber-800",
  "Weak fit": "bg-rose-100 text-rose-800",
};

export default function ReferralForm({
  job,
  currentProfile,
  onSubmitted,
}: ReferralFormProps) {
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<{
    summary: string;
    scoreLabel: MatchScoreLabel;
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim()) return;

    setSubmitting(true);
    try {
      // Mock: no real upload yet. Real implementation uploads resumeFile to
      // the `resumes` Storage bucket under `{referral_id}/{filename}` before
      // inserting the referral row.
      const resumeUrl = resumeFile ? `mock://resumes/${resumeFile.name}` : null;

      onSubmitted({
        job_id: job.id,
        referrer_id: currentProfile.id,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        summary,
        resume_url: resumeUrl,
      });
      setSubmitted(true);

      setMatching(true);
      const result = await mockMatchReferral();
      setMatchResult(result);
    } finally {
      setSubmitting(false);
      setMatching(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Referral submitted
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {candidateName} was referred for {job.title}.
        </p>

        {matching && (
          <p className="mt-4 text-sm text-slate-500">
            Evaluating match&hellip;
          </p>
        )}

        {matchResult && (
          <div className="mt-4 rounded-md border border-slate-200 p-4">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                scoreStyles[matchResult.scoreLabel]
              }`}
            >
              {matchResult.scoreLabel}
            </span>
            <p className="mt-2 text-sm text-slate-700">
              {matchResult.summary}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900">
        Refer a candidate for {job.title}
      </h3>
      <div className="mt-4 grid gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Candidate name
          </label>
          <input
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Candidate email
          </label>
          <input
            type="email"
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Why are they a good fit?
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Resume (optional)
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm text-slate-600"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit referral"}
      </button>
    </form>
  );
}
