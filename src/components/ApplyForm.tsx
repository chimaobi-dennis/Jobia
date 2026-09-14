import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { errorMessage } from "../lib/errorMessage";
import { mockParseResume } from "../lib/mockResumeParse";
import type { Job, MatchScoreLabel, Profile, Referral } from "../lib/types";

interface ApplyFormProps {
  job: Job;
  referral: Referral;
  currentProfile: Profile;
  onDone: () => void;
}

const scoreStyles: Record<MatchScoreLabel, string> = {
  "Strong fit": "bg-emerald-100 text-emerald-800",
  "Partial fit": "bg-amber-100 text-amber-800",
  "Weak fit": "bg-rose-100 text-rose-800",
};

export default function ApplyForm({
  job,
  referral,
  currentProfile,
  onDone,
}: ApplyFormProps) {
  const [summary, setSummary] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<{
    summary: string;
    scoreLabel: MatchScoreLabel;
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleResumeChange(file: File | null) {
    setResumeFile(file);
    if (!file) return;

    setParsing(true);
    try {
      const parsed = await mockParseResume(file, job.title);
      setSummary(parsed.summary);
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setSubmitting(true);
    setSubmitError(null);

    try {
      let resumeUrl: string | null = null;
      if (resumeFile) {
        const path = `${referral.id}/${resumeFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(path, resumeFile);
        if (uploadError) throw uploadError;
        resumeUrl = path;
      }

      const { error: updateError } = await supabase
        .from("referrals")
        .update({
          candidate_id: currentProfile.id,
          status: "submitted",
          summary,
          resume_url: resumeUrl,
        })
        .eq("id", referral.id);
      if (updateError) throw updateError;

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Application submitted
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Your application for {job.title} at {job.company} was sent.
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

          <button
            onClick={onDone}
            className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Continue to Jobia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900">
          Apply for {job.title}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{job.company}</p>

        <div className="mt-4 grid gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Resume
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) =>
                handleResumeChange(e.target.files?.[0] ?? null)
              }
              className="mt-1 w-full text-sm text-slate-600"
            />
            {parsing && (
              <p className="mt-1 text-xs text-slate-500">
                Parsing résumé&hellip;
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Summary
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder="Upload a résumé to pre-fill this, or write your own summary."
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {submitError && (
          <p className="mt-4 text-sm text-rose-600">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={submitting || parsing}
          className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </div>
  );
}
