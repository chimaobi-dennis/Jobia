import { useState } from "react";
import type { FormEvent } from "react";
import InviteForm from "./InviteForm";
import type { Job, Profile } from "../lib/types";

interface JobsBoardProps {
  jobs: Job[];
  currentProfile: Profile;
  onCreateJob: (job: {
    title: string;
    company: string;
    description: string;
    location: string;
    skills: string[];
  }) => void;
  onSelectJob: (jobId: string | null) => void;
  selectedJobId: string | null;
  onApply: (job: Job) => void;
  applyError: string | null;
}

function parseSkills(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

export default function JobsBoard({
  jobs,
  currentProfile,
  onCreateJob,
  onSelectJob,
  selectedJobId,
  onApply,
  applyError,
}: JobsBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;

  const allSkills = Array.from(
    new Set(jobs.flatMap((job) => job.skills)),
  ).sort((a, b) => a.localeCompare(b));

  const query = searchQuery.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    const matchesQuery =
      !query ||
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query);
    const matchesSkill = !skillFilter || job.skills.includes(skillFilter);
    return matchesQuery && matchesSkill;
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !description.trim()) return;
    onCreateJob({
      title,
      company,
      description,
      location,
      skills: parseSkills(skillsInput),
    });
    setTitle("");
    setCompany("");
    setDescription("");
    setLocation("");
    setSkillsInput("");
    setShowForm(false);
  }

  function closeModal() {
    onSelectJob(null);
    setShowInvite(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Open Jobs</h1>
        {currentProfile.is_recruiter && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {showForm ? "Cancel" : "Post a job"}
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title or company…"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:flex-1"
        />
        <select
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-56"
        >
          <option value="">All skills</option>
          {allSkills.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-lg border border-slate-200 bg-white p-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Company
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Skills required
              </label>
              <input
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. React, TypeScript, GraphQL"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Comma-separated
              </p>
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Post job
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {filteredJobs.map((job) => (
          <button
            key={job.id}
            onClick={() => onSelectJob(job.id)}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {job.title}
            </h2>
            <p className="text-sm text-slate-500">{job.location ?? "—"}</p>
          </button>
        ))}
        {jobs.length === 0 && (
          <p className="text-sm text-slate-500">No open jobs yet.</p>
        )}
        {jobs.length > 0 && filteredJobs.length === 0 && (
          <p className="text-sm text-slate-500">
            No jobs match your search.
          </p>
        )}
      </div>

      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedJob.title}
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedJob.company}
                  {selectedJob.location ? ` · ${selectedJob.location}` : ""}
                </p>
              </div>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">
              {selectedJob.description}
            </p>

            {selectedJob.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedJob.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {applyError && (
              <p className="mt-4 text-sm text-rose-600">{applyError}</p>
            )}

            {!showInvite ? (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => onApply(selectedJob)}
                  className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Apply for this job
                </button>
                <button
                  onClick={() => setShowInvite(true)}
                  className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Refer a candidate
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <button
                  onClick={() => setShowInvite(false)}
                  className="mb-3 text-sm text-indigo-600 hover:underline"
                >
                  ← Back
                </button>
                <InviteForm job={selectedJob} currentProfile={currentProfile} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
