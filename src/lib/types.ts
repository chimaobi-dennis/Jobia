export interface Profile {
  id: string;
  name: string;
  bio: string | null;
  is_recruiter: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  recruiter_id: string;
  title: string;
  company: string;
  description: string;
  location: string | null;
  skills: string[];
  created_at: string;
}

export type MatchScoreLabel = "Strong fit" | "Partial fit" | "Weak fit";

export type ReferralStatus = "invited" | "submitted";

export interface Referral {
  id: string;
  job_id: string;
  referrer_id: string;
  candidate_id: string | null;
  candidate_name: string;
  candidate_email: string;
  candidate_location: string | null;
  candidate_experience: string | null;
  status: ReferralStatus;
  summary: string | null;
  resume_url: string | null;
  match_summary: string | null;
  match_score_label: MatchScoreLabel | null;
  created_at: string;
}
