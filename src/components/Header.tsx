import type { Profile } from "../lib/types";
import { mockProfiles } from "../lib/mockData";

interface HeaderProps {
  currentProfileId: string;
  onChangeProfile: (profileId: string) => void;
  view: "jobs" | "dashboard";
  onChangeView: (view: "jobs" | "dashboard") => void;
}

export default function Header({
  currentProfileId,
  onChangeProfile,
  view,
  onChangeView,
}: HeaderProps) {
  const currentProfile = mockProfiles.find(
    (p) => p.id === currentProfileId,
  ) as Profile;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-8">
          <span className="text-lg font-semibold text-slate-900">
            Referral Network
          </span>
          <nav className="flex gap-4 text-sm font-medium">
            <button
              onClick={() => onChangeView("jobs")}
              className={
                view === "jobs"
                  ? "text-indigo-600"
                  : "text-slate-500 hover:text-slate-900"
              }
            >
              Jobs
            </button>
            {currentProfile?.is_recruiter && (
              <button
                onClick={() => onChangeView("dashboard")}
                className={
                  view === "dashboard"
                    ? "text-indigo-600"
                    : "text-slate-500 hover:text-slate-900"
                }
              >
                Recruiter Dashboard
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="viewing-as" className="text-slate-500">
            Viewing as
          </label>
          <select
            id="viewing-as"
            value={currentProfileId}
            onChange={(e) => onChangeProfile(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-900"
          >
            {mockProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.is_recruiter ? "(Recruiter)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
