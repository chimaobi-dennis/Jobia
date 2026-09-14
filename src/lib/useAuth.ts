import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { Profile } from "./types";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
          setLoading(false);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfileError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setProfileError(null);

    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
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
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { session, profile, profileError, loading, signOut };
}
