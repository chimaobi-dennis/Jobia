// Supabase Edge Function: get-invite
//
// Public (unauthenticated) lookup for the invite-link landing page. Takes
// a referral id and returns only the minimal fields needed to show
// "You're invited to apply for {job} at {company}" and pre-fill the
// candidate's name/email on signup — never the full referral row (no
// summary, resume_url, match data). Uses the service role key to bypass
// RLS, since an anonymous visitor has no session yet and RLS on
// `referrals` is intentionally scoped to authenticated users only.
//
// Only returns invites that are still in 'invited' status — once claimed
// (status='submitted'), the link is no longer a valid pre-signup landing
// page.
//
// Deploy: supabase functions deploy get-invite --no-verify-jwt

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — these are " +
          "provided automatically to Edge Functions by Supabase.",
      );
    }

    const url = new URL(req.url);
    const referralId = url.searchParams.get("referralId");
    if (!referralId) {
      return new Response(
        JSON.stringify({ error: "referralId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select("id, job_id, candidate_name, candidate_email, status")
      .eq("id", referralId)
      .eq("status", "invited")
      .single();

    if (referralError || !referral) {
      return new Response(
        JSON.stringify({ error: "Invite not found or already used" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, company")
      .eq("id", referral.job_id)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message ?? referral.job_id}`);
    }

    return new Response(
      JSON.stringify({
        referral: {
          id: referral.id,
          candidateName: referral.candidate_name,
          candidateEmail: referral.candidate_email,
        },
        job: { id: job.id, title: job.title, company: job.company },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
