import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { Profile } from "./types";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    setLoading(true);
    setProfileError(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to load profile", error);
      setProfile(null);
      setProfileError(
        error.code === "PGRST116"
          ? "Your account is signed in, but no profile was found for " +
              "it — the signup process didn't finish creating your " +
              "profile row. Sign out and sign up again, or contact " +
              "support to have your profile created."
          : `Failed to load your profile: ${error.message}`,
      );
    } else {
      setProfile(data as Profile);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (!newSession) {
          setProfile(null);
          setProfileError(null);
          setLoading(false);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    loadProfile(session.user.id).then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [session, loadProfile]);

  // Callers that just wrote the profiles row themselves (signup flows)
  // call this immediately after, so the UI doesn't show a stale
  // "profile not found" error from the fetch that raced the insert.
  const refreshProfile = useCallback(async () => {
    if (!session) return;
    await loadProfile(session.user.id);
  }, [session, loadProfile]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { session, profile, profileError, loading, signOut, refreshProfile };
}
