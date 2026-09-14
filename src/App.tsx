import { useEffect, useState } from "react";
import ApplyForm from "./components/ApplyForm";
import AuthScreen from "./components/AuthScreen";
import CandidateSignup from "./components/CandidateSignup";
import Header from "./components/Header";
import JobsBoard from "./components/JobsBoard";
import MyApplications from "./components/MyApplications";
import RecruiterDashboard from "./components/RecruiterDashboard";
import { fetchInvitePreview } from "./lib/getInvite";
import type { InvitePreview } from "./lib/getInvite";
import {
  clearPendingReferralId,
  clearReferralIdFromUrl,
  getPendingReferralId,
  readReferralIdFromUrl,
  storePendingReferralId,
} from "./lib/invite";
import { supabase, supabaseConfigError } from "./lib/supabaseClient";
import { useAuth } from "./lib/useAuth";
import { errorMessage } from "./lib/errorMessage";
import type { Job, Referral } from "./lib/types";

type View = "jobs" | "dashboard" | "applications";

export default function App() {
  const { session, profile, profileError, loading, signOut, refreshProfile } =
    useAuth();
  const [view, setView] = useState<View>("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const [pendingReferralId, setPendingReferralId] = useState<string | null>(
    null,
  );
  const [invitePreview, setInvitePreview] = useState<InvitePreview | null>(
    null,
  );
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [applyReferral, setApplyReferral] = useState<Referral | null>(null);
  const [selfApplyError, setSelfApplyError] = useState<string | null>(null);

  const [myApplications, setMyApplications] = useState<Referral[]>([]);
  const [myApplicationsVersion, setMyApplicationsVersion] = useState(0);

  // Pick up ?ref=<referralId> on first load and persist it across the
  // signup redirect (sessionStorage survives the reload; the query param
  // may not).
  useEffect(() => {
    const fromUrl = readReferralIdFromUrl();
    if (fromUrl) {
      storePendingReferralId(fromUrl);
      clearReferralIdFromUrl();
    }
    setPendingReferralId(fromUrl ?? getPendingReferralId());
  }, []);

  // Load the (public, pre-signup) invite preview whenever there's a
  // pending referral and no logged-in profile with a resolved apply target
  // yet.
  useEffect(() => {
    if (!pendingReferralId || session) return;

    let cancelled = false;
    setInviteLoading(true);
    setInviteError(null);

    fetchInvitePreview(pendingReferralId)
      .then((preview) => {
        if (cancelled) return;
        setInvitePreview(preview);
      })
      .catch((err) => {
        if (cancelled) return;
        setInviteError(errorMessage(err));
        clearPendingReferralId();
      })
      .finally(() => {
        if (!cancelled) setInviteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pendingReferralId, session]);

  // Once logged in with a pending referral, load the full referral + job
  // rows (now readable under RLS, since candidate_email matches the
  // session) to drive the actual application form.
  useEffect(() => {
    if (!pendingReferralId || !session || !profile) return;

    let cancelled = false;
    setInviteLoading(true);
    setInviteError(null);

    supabase
      .from("referrals")
      .select("*")
      .eq("id", pendingReferralId)
      .single()
      .then(async ({ data: referral, error: referralError }) => {
        if (cancelled) return;
        if (referralError || !referral) {
          setInviteError(
            "This invite link is no longer valid — it may have already " +
              "been used.",
          );
          clearPendingReferralId();
          setInviteLoading(false);
          return;
        }

        const { data: job, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", referral.job_id)
          .single();

        if (cancelled) return;
        if (jobError || !job) {
          setInviteError("Couldn't load the job for this invite.");
          clearPendingReferralId();
          setInviteLoading(false);
          return;
        }

        if (referral.status === "submitted") {
          // Already applied (e.g. link opened twice) — nothing more to do.
          clearPendingReferralId();
          setPendingReferralId(null);
          setInviteLoading(false);
          return;
        }

        setApplyReferral(referral as Referral);
        setApplyJob(job as Job);
        setInviteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pendingReferralId, session, profile]);

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

  // The current user's own submitted applications (as candidate), so
  // MyApplications can list them and JobsBoard can flag jobs already
  // applied to. RLS scopes "referrals" select access, including a
  // policy for rows whose candidate_email matches the session's email.
  useEffect(() => {
    if (!session || !profile) return;

    let cancelled = false;

    supabase
      .from("referrals")
      .select("*")
      .eq("candidate_id", profile.id)
      .eq("status", "submitted")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setMyApplications(data as Referral[]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session, profile, myApplicationsVersion]);

  async function handleCreateJob(input: {
    title: string;
    company: string;
    description: string;
    location: string;
    skills: string[];
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
        skills: input.skills,
      })
      .select()
      .single();

    if (error) {
      setJobsError(error.message);
      return;
    }

    setJobs((prev) => [data as Job, ...prev]);
  }

  function handleApplyDone() {
    clearPendingReferralId();
    setPendingReferralId(null);
    setApplyJob(null);
    setApplyReferral(null);
    setInvitePreview(null);
    setMyApplicationsVersion((v) => v + 1);
  }

  // A logged-in user applying directly to a job they're viewing (as
  // opposed to being invited by someone else). Creates the same kind of
  // referrals row an invite would, addressed to themselves, then reuses
  // ApplyForm exactly as the invite-link flow does.
  async function handleApplyForJob(job: Job) {
    if (!profile || !session?.user.email) return;

    setSelfApplyError(null);

    const { data: referral, error } = await supabase
      .from("referrals")
      .insert({
        job_id: job.id,
        referrer_id: profile.id,
        candidate_name: profile.name,
        candidate_email: session.user.email,
        status: "invited",
      })
      .select()
      .single();

    if (error) {
      setSelfApplyError(error.message);
      return;
    }

    setApplyJob(job);
    setApplyReferral(referral as Referral);
    setSelectedJobId(null);
  }

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

  if (loading || (pendingReferralId && inviteLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (pendingReferralId && inviteError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-lg font-semibold text-rose-900">
            Invite link error
          </h1>
          <p className="mt-2 text-sm text-rose-800">{inviteError}</p>
        </div>
      </div>
    );
  }

  // Pending invite, not logged in yet: candidate-only signup pre-filled
  // from the invite.
  if (pendingReferralId && !session && invitePreview) {
    return (
      <CandidateSignup invite={invitePreview} onSignedUp={refreshProfile} />
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
    return <AuthScreen onSignedUp={refreshProfile} />;
  }

  // Logged in with a pending invite that's ready to apply to.
  if (applyJob && applyReferral) {
    return (
      <ApplyForm
        job={applyJob}
        referral={applyReferral}
        currentProfile={profile}
        onDone={handleApplyDone}
      />
    );
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

      {view === "jobs" && (
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
              onApply={handleApplyForJob}
              applyError={selfApplyError}
              appliedJobIds={
                new Set(myApplications.map((r) => r.job_id))
              }
            />
          )}
        </div>
      )}
      {view === "dashboard" && (
        <RecruiterDashboard currentProfile={profile} jobs={jobs} />
      )}
      {view === "applications" && (
        <MyApplications applications={myApplications} jobs={jobs} />
      )}
    </div>
  );
}
