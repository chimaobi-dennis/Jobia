import type { Profile } from "../lib/types";

type View = "jobs" | "dashboard" | "applications";

interface HeaderProps {
  profile: Profile;
  onSignOut: () => void;
  view: View;
  onChangeView: (view: View) => void;
}

export default function Header({
  profile,
  onSignOut,
  view,
  onChangeView,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-8">
          <span className="text-lg font-semibold text-slate-900">
            Jobia
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
            <button
              onClick={() => onChangeView("applications")}
              className={
                view === "applications"
                  ? "text-indigo-600"
                  : "text-slate-500 hover:text-slate-900"
              }
            >
              My Applications
            </button>
            {profile.is_recruiter && (
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

        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-700">
            {profile.name}
            {profile.is_recruiter ? " (Recruiter)" : ""}
          </span>
          <button
            onClick={onSignOut}
            className="rounded-md border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
