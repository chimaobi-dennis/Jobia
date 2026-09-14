import { supabase } from "./supabaseClient";
import type { Job, Referral } from "./types";

export interface InvitePreview {
  referral: Pick<Referral, "id" | "candidate_name" | "candidate_email">;
  job: Pick<Job, "id" | "title" | "company">;
}

// Calls the get-invite Edge Function directly via fetch rather than
// supabase.functions.invoke, since invoke() throws on non-2xx responses
// in a way that's awkward to distinguish "invite not found" from a real
// error — this needs both a normal 404 case and a thrown network/5xx case.
export async function fetchInvitePreview(
  referralId: string,
): Promise<InvitePreview> {
  const { data: sessionData } = await supabase.auth.getSession();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const url = new URL(`${supabaseUrl}/functions/v1/get-invite`);
  url.searchParams.set("referralId", referralId);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${sessionData.session?.access_token ?? anonKey}`,
      apikey: anonKey,
    },
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? "Failed to load invite");
  }

  return {
    referral: {
      id: body.referral.id,
      candidate_name: body.referral.candidateName,
      candidate_email: body.referral.candidateEmail,
    },
    job: body.job,
  };
}
