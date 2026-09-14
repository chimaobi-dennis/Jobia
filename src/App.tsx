import { useState } from "react";
import Header from "./components/Header";
import JobsBoard from "./components/JobsBoard";
import ReferralForm from "./components/ReferralForm";
import RecruiterDashboard from "./components/RecruiterDashboard";
import { mockJobs, mockProfiles, mockReferrals } from "./lib/mockData";
import type { Job, Referral } from "./lib/types";

type View = "jobs" | "dashboard";

export default function App() {
  const [currentProfileId, setCurrentProfileId] = useState(
    mockProfiles[0].id,
  );
  const [view, setView] = useState<View>("jobs");
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [referrals, setReferrals] = useState<Referral[]>(mockReferrals);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const currentProfile = mockProfiles.find((p) => p.id === currentProfileId)!;
  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;

  function handleCreateJob(input: {
    title: string;
    company: string;
    description: string;
    location: string;
  }) {
    const newJob: Job = {
      id: crypto.randomUUID(),
      recruiter_id: currentProfile.id,
      title: input.title,
      company: input.company,
      description: input.description,
      location: input.location || null,
      created_at: new Date().toISOString(),
    };
    setJobs((prev) => [newJob, ...prev]);
  }

  function handleReferralSubmitted(input: {
    job_id: string;
    referrer_id: string;
    candidate_name: string;
    candidate_email: string;
    summary: string;
    resume_url: string | null;
  }) {
    const newReferral: Referral = {
      id: crypto.randomUUID(),
      job_id: input.job_id,
      referrer_id: input.referrer_id,
      candidate_name: input.candidate_name,
      candidate_email: input.candidate_email,
      summary: input.summary,
      resume_url: input.resume_url,
      match_summary: null,
      match_score_label: null,
      created_at: new Date().toISOString(),
    };
    setReferrals((prev) => [newReferral, ...prev]);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        currentProfileId={currentProfileId}
        onChangeProfile={(id) => {
          setCurrentProfileId(id);
          setView("jobs");
          setSelectedJobId(null);
        }}
        view={view}
        onChangeView={setView}
      />

      {view === "jobs" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-6 mx-auto max-w-5xl">
          <div className="lg:col-span-3">
            <JobsBoard
              jobs={jobs}
              currentProfile={currentProfile}
              onCreateJob={handleCreateJob}
              onSelectJob={setSelectedJobId}
              selectedJobId={selectedJobId}
            />
          </div>
          {selectedJob && (
            <div className="px-4 pb-8 lg:col-span-3">
              <ReferralForm
                key={selectedJob.id}
                job={selectedJob}
                currentProfile={currentProfile}
                onSubmitted={handleReferralSubmitted}
              />
            </div>
          )}
        </div>
      ) : (
        <RecruiterDashboard
          currentProfile={currentProfile}
          jobs={jobs}
          referrals={referrals}
        />
      )}
    </div>
  );
}
