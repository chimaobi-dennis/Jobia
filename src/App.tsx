import { useEffect, useState } from "react";
import AuthScreen from "./components/AuthScreen";
import Header from "./components/Header";
import JobsBoard from "./components/JobsBoard";
import ReferralForm from "./components/ReferralForm";
import RecruiterDashboard from "./components/RecruiterDashboard";
import { supabase, supabaseConfigError } from "./lib/supabaseClient";
import { useAuth } from "./lib/useAuth";
import type { Job } from "./lib/types";

type View = "jobs" | "dashboard";

export default function App() {
  const { session, profile, profileError, loading, signOut } = useAuth();
  const [view, setView] = useState<View>("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    setJobsLoading(true);

    supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setJobsError(error.message);
        } else {
          setJobs(data as Job[]);
        }
        setJobsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  async function handleCreateJob(input: {
    title: string;
    company: string;
    description: string;
    location: string;
  }) {
    if (!profile) return;

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        recruiter_id: profile.id,
        title: input.title,
        company: input.company,
        description: input.description,
        location: input.location || null,
      })
      .select()
      .single();

    if (error) {
      setJobsError(error.message);
      return;
    }

    setJobs((prev) => [data as Job, ...prev]);
  }

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;

  if (supabaseConfigError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-lg font-semibold text-rose-900">
            Configuration error
          </h1>
          <p className="mt-2 text-sm text-rose-800">{supabaseConfigError}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (session && profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-lg font-semibold text-rose-900">
            Profile error
          </h1>
          <p className="mt-2 text-sm text-rose-800">{profileError}</p>
          <button
            onClick={signOut}
            className="mt-4 rounded-md border border-rose-300 px-3 py-1 text-sm text-rose-800 hover:bg-rose-100"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        profile={profile}
        onSignOut={signOut}
        view={view}
        onChangeView={setView}
      />

      {jobsError && (
        <p className="mx-auto max-w-5xl px-4 pt-4 text-sm text-rose-600">
          {jobsError}
        </p>
      )}

      {view === "jobs" ? (
        <div className="mx-auto max-w-5xl">
          {jobsLoading ? (
            <p className="px-4 py-8 text-sm text-slate-500">
              Loading jobs…
            </p>
          ) : (
            <JobsBoard
              jobs={jobs}
              currentProfile={profile}
              onCreateJob={handleCreateJob}
              onSelectJob={setSelectedJobId}
              selectedJobId={selectedJobId}
            />
          )}
          {selectedJob && (
            <div className="px-4 pb-8">
              <ReferralForm
                key={selectedJob.id}
                job={selectedJob}
                currentProfile={profile}
              />
            </div>
          )}
        </div>
      ) : (
        <RecruiterDashboard currentProfile={profile} jobs={jobs} />
      )}
    </div>
  );
}
