import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Job, MatchScoreLabel, Profile, Referral } from "../lib/types";

interface RecruiterDashboardProps {
  currentProfile: Profile;
  jobs: Job[];
}

const scoreStyles: Record<MatchScoreLabel, string> = {
  "Strong fit": "bg-emerald-100 text-emerald-800",
  "Partial fit": "bg-amber-100 text-amber-800",
  "Weak fit": "bg-rose-100 text-rose-800",
};

export default function RecruiterDashboard({
  currentProfile,
  jobs,
}: RecruiterDashboardProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const myJobs = jobs.filter((j) => j.recruiter_id === currentProfile.id);
  const myJobIds = myJobs.map((j) => j.id);

  useEffect(() => {
    if (myJobIds.length === 0) {
      setReferrals([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from("referrals")
      .select("*")
      .in("job_id", myJobIds)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
        } else {
          setReferrals(data as Referral[]);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myJobIds.join(",")]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">
        Recruiter Dashboard
      </h1>

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      {myJobs.length === 0 && (
        <p className="text-sm text-slate-500">
          You haven't posted any jobs yet.
        </p>
      )}

      {loading && myJobs.length > 0 && (
        <p className="text-sm text-slate-500">Loading referrals…</p>
      )}

      <div className="grid gap-6">
        {myJobs.map((job) => {
          const jobReferrals = referrals.filter((r) => r.job_id === job.id);
          return (
            <div
              key={job.id}
              className="rounded-lg border border-slate-200 bg-white p-6"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {job.title}
              </h2>
              <p className="text-sm text-slate-500">{job.company}</p>

              {!loading && jobReferrals.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No referrals yet.
                </p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {jobReferrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="rounded-md border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">
                          {referral.candidate_name}
                        </span>
                        {referral.match_score_label && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              scoreStyles[referral.match_score_label]
                            }`}
                          >
                            {referral.match_score_label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {referral.candidate_email}
                      </p>
                      {referral.summary && (
                        <p className="mt-2 text-sm text-slate-600">
                          {referral.summary}
                        </p>
                      )}
                      {referral.match_summary && (
                        <p className="mt-2 text-sm italic text-slate-500">
                          {referral.match_summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
