import type { Job, Profile, Referral } from "./types";

// In-memory mock data. Stands in for Supabase-backed `profiles` and `jobs`
// tables until real queries are wired up (see README.md).

export const mockProfiles: Profile[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Dana Ortiz",
    bio: "Engineering recruiter at Northwind.",
    is_recruiter: true,
    created_at: "2026-01-05T10:00:00Z",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Priya Shah",
    bio: "Senior backend engineer, loves referring good people.",
    is_recruiter: false,
    created_at: "2026-01-06T10:00:00Z",
  },
];

export const mockJobs: Job[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    recruiter_id: "11111111-1111-1111-1111-111111111111",
    title: "Senior Frontend Engineer",
    company: "Northwind",
    description:
      "Own the React/TypeScript stack for our customer dashboard. 5+ years experience, strong UI craft.",
    location: "Remote (US)",
    created_at: "2026-01-10T10:00:00Z",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    recruiter_id: "11111111-1111-1111-1111-111111111111",
    title: "Platform Engineer",
    company: "Northwind",
    description:
      "Build and operate internal developer platform tooling on Kubernetes and Terraform.",
    location: "New York, NY",
    created_at: "2026-01-12T10:00:00Z",
  },
];

export const mockReferrals: Referral[] = [];
