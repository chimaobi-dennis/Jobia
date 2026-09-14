import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { errorMessage } from "../lib/errorMessage";
import type { Job, MatchScoreLabel, Profile } from "../lib/types";

interface ReferralFormProps {
  job: Job;
  currentProfile: Profile;
}

const scoreStyles: Record<MatchScoreLabel, string> = {
  "Strong fit": "bg-emerald-100 text-emerald-800",
  "Partial fit": "bg-amber-100 text-amber-800",
  "Weak fit": "bg-rose-100 text-rose-800",
};

export default function ReferralForm({ job, currentProfile }: ReferralFormProps) {
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    setSubmitError(null);

    try {
      const { data: referral, error: insertError } = await supabase
        .from("referrals")
        .insert({
          job_id: job.id,
          referrer_id: currentProfile.id,
          candidate_name: candidateName,
          candidate_email: candidateEmail,
          summary,
          resume_url: null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      let resumeUrl: string | null = null;
      if (resumeFile) {
        const path = `${referral.id}/${resumeFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(path, resumeFile);

        if (uploadError) throw uploadError;

        resumeUrl = path;
        const { error: updateError } = await supabase
          .from("referrals")
          .update({ resume_url: resumeUrl })
          .eq("id", referral.id);

        if (updateError) throw updateError;
      }

      setSubmitted(true);
      setSubmitting(false);

      setMatching(true);
      const { data: matchData, error: matchError } =
        await supabase.functions.invoke("match-referral", {
          body: { referralId: referral.id },
        });

      if (matchError) {
        console.error("Match evaluation failed", matchError);
      } else if (matchData) {
        setMatchResult({
          summary: matchData.summary,
          scoreLabel: matchData.scoreLabel,
        });
      }
    } catch (err) {
      setSubmitError(errorMessage(err));
      setSubmitting(false);
    } finally {
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

      {submitError && (
        <p className="mt-4 text-sm text-rose-600">{submitError}</p>
      )}

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
