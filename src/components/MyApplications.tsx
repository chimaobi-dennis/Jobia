import type { Job, MatchScoreLabel, Referral } from "../lib/types";

interface MyApplicationsProps {
  applications: Referral[];
  jobs: Job[];
}

const scoreStyles: Record<MatchScoreLabel, string> = {
  "Strong fit": "bg-emerald-100 text-emerald-800",
  "Partial fit": "bg-amber-100 text-amber-800",
  "Weak fit": "bg-rose-100 text-rose-800",
};

export default function MyApplications({
  applications,
  jobs,
}: MyApplicationsProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">
        My Applications
      </h1>

      {applications.length === 0 && (
        <p className="text-sm text-slate-500">
          You haven't applied to any jobs yet.
        </p>
      )}

      <div className="grid gap-4">
        {applications.map((application) => {
          const job = jobs.find((j) => j.id === application.job_id);
          return (
            <div
              key={application.id}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {job?.title ?? "Job"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {job?.company}
                    {job?.location ? ` · ${job.location}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                    Applied
                  </span>
                  {application.match_score_label && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        scoreStyles[application.match_score_label]
                      }`}
                    >
                      {application.match_score_label}
                    </span>
                  )}
                </div>
              </div>

              {application.summary && (
                <p className="mt-3 text-sm text-slate-600">
                  {application.summary}
                </p>
              )}
              {application.match_summary && (
                <p className="mt-2 text-sm italic text-slate-500">
                  {application.match_summary}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
