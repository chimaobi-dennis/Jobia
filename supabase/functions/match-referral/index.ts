// Supabase Edge Function: match-referral
//
// Accepts { referralId }, loads the referral + its job using the service
// role key (bypasses RLS), and writes a fit assessment back onto the
// referral row.
//
// DEMO MODE: this currently returns a mocked assessment instead of calling
// the Anthropic API, so the demo doesn't depend on an ANTHROPIC_API_KEY. The
// draft prompt for the real call is kept below (commented out) — to switch
// to the real thing, replace the "Mock match result" block with it and add
// ANTHROPIC_API_KEY via `supabase secrets set`.
//
// Deploy: supabase functions deploy match-referral

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MatchResult {
  summary: string;
  scoreLabel: "Strong fit" | "Partial fit" | "Weak fit";
}

// -----------------------------------------------------------------------
// Draft prompt for the real Anthropic-backed version of this function.
// -----------------------------------------------------------------------
// const prompt = `You are helping a recruiter evaluate an employee
// referral against an open job.
//
// Job title: ${job.title}
// Company: ${job.company}
// Job description: ${job.description}
//
// Candidate name: ${referral.candidate_name}
// Referrer's note about the candidate: ${referral.summary ?? "(none provided)"}
//
// Assess how well this candidate matches the job based on the referrer's
// note. Respond with ONLY a JSON object of the shape:
// { "summary": string, "scoreLabel": "Strong fit" | "Partial fit" | "Weak fit" }
//
// "summary" should be 1-3 sentences explaining the fit. Do not include any
// text outside the JSON object.`;
//
// const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
// const message = await anthropic.messages.create({
//   model: "claude-sonnet-4-6",
//   max_tokens: 1024,
//   messages: [{ role: "user", content: prompt }],
// });
// -----------------------------------------------------------------------

// Deterministic stand-in for a real LLM assessment: scores fit by how many
// of the job's required skills show up in the candidate's own text (résumé
// filename, summary, experience) — no LLM call, but it actually responds
// to the data instead of picking a label at random.
function mockMatchResult(
  job: { title: string; company: string; skills: string[] },
  referral: {
    candidate_name: string;
    summary: string | null;
    candidate_experience: string | null;
    resume_url: string | null;
  },
): MatchResult {
  const candidateText = [
    referral.summary ?? "",
    referral.candidate_experience ?? "",
    referral.resume_url ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const matchedSkills = job.skills.filter((skill) =>
    candidateText.includes(skill.toLowerCase()),
  );

  const overlapRatio =
    job.skills.length > 0 ? matchedSkills.length / job.skills.length : 0.5;

  let scoreLabel: MatchResult["scoreLabel"];
  if (overlapRatio >= 0.6) {
    scoreLabel = "Strong fit";
  } else if (overlapRatio >= 0.25) {
    scoreLabel = "Partial fit";
  } else {
    scoreLabel = "Weak fit";
  }

  const resumeNote = referral.resume_url
    ? "Résumé on file was reviewed alongside the referrer's notes."
    : "No résumé was attached, so this is based on the referrer's notes alone.";

  const skillsNote =
    matchedSkills.length > 0
      ? `Matched skills: ${matchedSkills.join(", ")}.`
      : job.skills.length > 0
        ? `None of the required skills (${job.skills.join(", ")}) were found in the application.`
        : "This job has no listed required skills to match against.";

  const summaryByLabel: Record<MatchResult["scoreLabel"], string> = {
    "Strong fit": `${referral.candidate_name}'s background lines up well with the ${job.title} role at ${job.company}. ${skillsNote} ${resumeNote}`,
    "Partial fit": `${referral.candidate_name} has some relevant experience for the ${job.title} role at ${job.company}, but there are gaps worth exploring in a screen. ${skillsNote} ${resumeNote}`,
    "Weak fit": `${referral.candidate_name}'s experience doesn't closely match the ${job.title} role at ${job.company} based on what's available. ${skillsNote} ${resumeNote}`,
  };

  return { summary: summaryByLabel[scoreLabel], scoreLabel };
}

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

    const { referralId } = await req.json();
    if (!referralId || typeof referralId !== "string") {
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
      .select("*")
      .eq("id", referralId)
      .single();
    if (referralError || !referral) {
      throw new Error(
        `Referral not found: ${referralError?.message ?? referralId}`,
      );
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", referral.job_id)
      .single();
    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message ?? referral.job_id}`);
    }

    // Simulate the latency of a real model call so the "Evaluating match…"
    // state in the UI is visible during a demo.
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = mockMatchResult(job, referral);

    const { error: updateError } = await supabase
      .from("referrals")
      .update({
        match_summary: result.summary,
        match_score_label: result.scoreLabel,
      })
      .eq("id", referralId);
    if (updateError) throw updateError;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
