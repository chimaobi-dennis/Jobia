import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { errorMessage } from "../lib/errorMessage";
import { buildInviteLink } from "../lib/invite";
import type { Job, Profile } from "../lib/types";

interface InviteFormProps {
  job: Job;
  currentProfile: Profile;
}

export default function InviteForm({ job, currentProfile }: InviteFormProps) {
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
          status: "invited",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setInviteLink(buildInviteLink(referral.id));
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context) — the
      // link is still shown and selectable, so this is non-fatal.
    }
  }

  if (inviteLink) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Invite sent to {candidateName}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          In a real deployment this link would be emailed to{" "}
          {candidateEmail}. For this demo, share it yourself:
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            value={inviteLink}
            onClick={(e) => e.currentTarget.select()}
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          />
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Opening this link signs the candidate up and takes them straight
          to the application form for {job.title}.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900">
        Invite a candidate for {job.title}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        They'll get a link to sign up and apply directly — no need to fill
        out their details yourself.
      </p>
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
      </div>

      {submitError && (
        <p className="mt-4 text-sm text-rose-600">{submitError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Sending invite…" : "Send invite"}
      </button>
    </form>
  );
}
