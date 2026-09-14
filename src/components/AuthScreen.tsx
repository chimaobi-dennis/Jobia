import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { errorMessage } from "../lib/errorMessage";

type Mode = "login" | "signup";

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
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
              "create your profile. Turn off \"Confirm email\" under " +
              "Authentication > Providers > Email in the Supabase " +
              "dashboard, then delete this user under Authentication > " +
              "Users and sign up again.",
          );
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            name,
            bio: bio || null,
            is_recruiter: isRecruiter,
          });
        if (profileError) throw profileError;
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Jobia
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "login" ? "Log in to your account." : "Create an account."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          {mode === "signup" && (
            <>
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
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isRecruiter}
                  onChange={(e) => setIsRecruiter(e.target.checked)}
                  className="rounded border-slate-300"
                />
                I'm hiring (sign up as a recruiter)
              </label>
            </>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting
              ? "Please wait…"
              : mode === "login"
                ? "Log in"
                : "Sign up"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="mt-4 text-sm text-indigo-600 hover:underline"
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
