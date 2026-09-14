import type { MatchScoreLabel } from "./types";

// Mock stand-in for the real match result produced by the `match-referral`
// Supabase Edge Function (see supabase/functions/match-referral). The real
// implementation calls the Anthropic API server-side — never from the
// client — using the prompt drafted below.

export interface MatchResult {
  summary: string;
  scoreLabel: MatchScoreLabel;
}

// -----------------------------------------------------------------------
// Draft prompt for the match-referral Edge Function. This block is not
// executed client-side; it's copied into supabase/functions/match-referral
// and sent to the Anthropic API from the server.
// -----------------------------------------------------------------------
// const MATCH_PROMPT = `You are helping a recruiter evaluate an employee
// referral against an open job.
//
// Job title: ${job.title}
// Company: ${job.company}
// Job description: ${job.description}
//
// Candidate name: ${referral.candidate_name}
// Referrer's note about the candidate: ${referral.summary}
//
// Assess how well this candidate matches the job based on the referrer's
// note. Respond with ONLY a JSON object of the shape:
// { "summary": string, "scoreLabel": "Strong fit" | "Partial fit" | "Weak fit" }
//
// "summary" should be 1-3 sentences explaining the fit. Do not include any
// text outside the JSON object.`;
// -----------------------------------------------------------------------

export async function mockMatchReferral(): Promise<MatchResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    summary:
      "Mock match result — connect the match-referral Edge Function to replace this.",
    scoreLabel: "Partial fit",
  };
}
