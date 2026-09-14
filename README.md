# Jobia

A small internal referral network: recruiters post jobs, employees refer
candidates, and an LLM produces a quick fit assessment for each referral.

Stack: Vite + React + TypeScript + Tailwind CSS + Supabase (Postgres, Auth,
Storage, Edge Functions).

## What's real

| Area | Implementation |
| --- | --- |
| Auth | Real Supabase Auth (email + password). `AuthScreen.tsx` handles signup (creates a `profiles` row) and login. `useAuth.ts` tracks the session and loads the current user's profile. `Header.tsx` shows the logged-in user and a sign-out button. |
| Profiles | `profiles` table in Supabase, created on signup. |
| Jobs | `jobs` table in Supabase. `App.tsx` fetches on mount; `JobsBoard.tsx` inserts new jobs (recruiters only, enforced by RLS). |
| Referrals | `referrals` table in Supabase. `ReferralForm.tsx` inserts a referral row on submit. |
| Resume upload | If a resume file is attached, `ReferralForm.tsx` uploads it to the private `resumes` Storage bucket under `{referral_id}/{filename}` and stores the path on the referral row. |
| Match scoring | The `match-referral` Supabase Edge Function (`supabase/functions/match-referral`) loads the referral + job with the service role key and writes `match_summary` / `match_score_label` back onto the referral. **Demo mode:** it currently returns a mocked assessment instead of calling an LLM, so the demo doesn't depend on any AI API key — the draft prompt for a real Anthropic-backed version is kept commented out in the function for later. `ReferralForm.tsx` calls `supabase.functions.invoke('match-referral', ...)` right after inserting the referral (and after any resume upload), and shows the returned summary exactly as it would for a real result. |
| Recruiter dashboard | `RecruiterDashboard.tsx` fetches the current recruiter's jobs and their referrals directly from Supabase. |

See [`schema.sql`](schema.sql) for the full schema (`profiles`, `jobs`,
`referrals`, RLS policies, and the `resumes` Storage bucket).

## Setup

### 1. Environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase
project (Project Settings > API).

### 2. Apply the database schema

Either push it as a migration:

```bash
supabase db push
```

...or paste the contents of [`schema.sql`](schema.sql) into the Supabase SQL
editor and run it. This creates the `profiles`, `jobs`, and `referrals`
tables (with RLS policies) and the private `resumes` Storage bucket.

### 3. Deploy the match-referral Edge Function

```bash
supabase functions deploy match-referral
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to
Edge Functions by Supabase. This function currently runs in **demo mode**
and returns a mocked fit assessment — no `ANTHROPIC_API_KEY` is required.
To switch it to a real Anthropic-backed assessment later, see the commented
-out draft prompt and Anthropic call inside
`supabase/functions/match-referral/index.ts`, then run
`supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`.

### 4. Run the app

```bash
npm install
npm run dev
```

## Notes

- RLS policies in `schema.sql` are the source of truth for who can read/write
  what — the app relies on them rather than duplicating checks client-side.
- The `resumes` Storage bucket is private; only authenticated users can
  upload/read.
