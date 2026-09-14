import { useState } from "react";
import type { FormEvent } from "react";
import type { Job, Profile } from "../lib/types";

interface JobsBoardProps {
  jobs: Job[];
  currentProfile: Profile;
  onCreateJob: (job: {
    title: string;
    company: string;
    description: string;
    location: string;
  }) => void;
  onSelectJob: (jobId: string) => void;
  selectedJobId: string | null;
}

export default function JobsBoard({
  jobs,
  currentProfile,
  onCreateJob,
  onSelectJob,
  selectedJobId,
}: JobsBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !description.trim()) return;
    onCreateJob({ title, company, description, location });
    setTitle("");
    setCompany("");
    setDescription("");
    setLocation("");
    setShowForm(false);
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
          </div>
          <button
            type="submit"
            className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Post job
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {jobs.map((job) => (
          <button
            key={job.id}
            onClick={() => onSelectJob(job.id)}
            className={`rounded-lg border bg-white p-5 text-left transition ${
              selectedJobId === job.id
                ? "border-indigo-500 ring-1 ring-indigo-500"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {job.title}
                </h2>
                <p className="text-sm text-slate-500">
                  {job.company}
                  {job.location ? ` · ${job.location}` : ""}
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-600">{job.description}</p>
          </button>
        ))}
        {jobs.length === 0 && (
          <p className="text-sm text-slate-500">No open jobs yet.</p>
        )}
      </div>
    </div>
  );
}
