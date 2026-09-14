import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { errorMessage } from "../lib/errorMessage";
import type { InvitePreview } from "../lib/getInvite";

interface CandidateSignupProps {
  invite: InvitePreview;
  onSignedUp: () => void | Promise<void>;
}

export default function CandidateSignup({
  invite,
  onSignedUp,
}: CandidateSignupProps) {
  const [name, setName] = useState(invite.referral.candidate_name);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: invite.referral.candidate_email,
        password,
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) {
        throw new Error(
          "Signup succeeded but no user id was returned. If email " +
            "confirmation is required, check your inbox and then log in.",
        );
      }

      if (!data.session) {
        throw new Error(
          "Account created, but your Supabase project has email " +
            "confirmation enabled, so there's no active session yet to " +
            'create your profile. Turn off "Confirm email" under ' +
            "Authentication > Providers > Email in the Supabase " +
            "dashboard, then delete this user under Authentication > " +
            "Users and try again.",
        );
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          name,
          bio: null,
          is_recruiter: false,
        });
      if (profileError) throw profileError;

      await onSignedUp();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">Jobia</h1>
        <p className="mt-1 text-sm text-slate-500">
          You've been invited to apply for{" "}
          <span className="font-medium text-slate-700">
            {invite.job.title}
          </span>{" "}
          at {invite.job.company}. Create an account to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={invite.referral.candidate_email}
              disabled
              className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Creating account…" : "Create account & apply"}
          </button>
        </form>
      </div>
    </div>
  );
}
