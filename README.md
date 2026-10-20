# Jobia

A small internal referral network: recruiters post jobs, employees invite
candidates to apply, candidates sign up and submit their own application,
and an LLM produces a quick fit assessment for each application.

Stack: Vite + React + TypeScript + Tailwind CSS + Supabase (Postgres, Auth,
Storage, Edge Functions).

## What's real

| Area | Implementation |
| --- | --- |
| Auth | Real Supabase Auth (email + password). `AuthScreen.tsx` handles recruiter/referrer signup (creates a `profiles` row) and login. `useAuth.ts` tracks the session and loads the current user's profile. `Header.tsx` shows the logged-in user and a sign-out button. |
| Profiles | `profiles` table in Supabase, created on signup. |
| Jobs | `jobs` table in Supabase, including required skills. `App.tsx` fetches on mount; `JobsBoard.tsx` inserts new jobs (recruiters only, enforced by RLS). |
| Invites | A logged-in user invites a candidate from `InviteForm.tsx` (name + email only) — this inserts a `referrals` row with `status='invited'`. **Demo mode:** no real email is sent; the UI shows a copyable invite link (`?ref=<referral id>`) that stands in for what a real email would deliver. |
| Candidate signup + apply | Opening an invite link routes an unauthenticated visitor through `CandidateSignup.tsx` (name + password only, email locked to the invite) via the public `get-invite` Edge Function, then straight into `ApplyForm.tsx` for that job. Submitting claims the referral row (`candidate_id`, `status='submitted'`), enforced by a scoped RLS UPDATE policy. |
| Resume upload + parsing | In `ApplyForm.tsx`, selecting a résumé runs a **mocked** parse (`mockResumeParse.ts`, simulated delay) that pre-fills the summary field — no real parsing/LLM call happens client-side. On submit, the file uploads to the private `resumes` Storage bucket under `{referral_id}/{filename}`. |
| Match scoring | The `match-referral` Supabase Edge Function (`supabase/functions/match-referral`) loads the referral + job with the service role key and writes `match_summary` / `match_score_label` back onto the referral. **Demo mode:** instead of calling an LLM, it deterministically scores fit by how many of the job's required skills appear in the candidate's résumé filename/summary/experience text — so the demo doesn't depend on any AI API key, but the result still responds to the actual application data rather than being random. The draft prompt for a real Anthropic-backed version is kept commented out in the function for later. `ApplyForm.tsx` calls `supabase.functions.invoke('match-referral', ...)` right after submitting the application, and shows the returned summary. |
| Recruiter dashboard | `RecruiterDashboard.tsx` fetches the current recruiter's jobs and their referrals directly from Supabase, showing an "Invited" badge for referrals still awaiting the candidate's application. |
| My Applications | `MyApplications.tsx` lists the current user's own submitted applications (candidate_id = them, status='submitted'). `JobsBoard.tsx` also marks already-applied jobs with an "Applied" badge on the card and in the job detail modal, so re-opening a job you've applied to doesn't offer to apply again. |

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
tables (with RLS policies) and the private `resumes` Storage bucket. If
`jobs`/`referrals` already exist from an earlier version of this schema,
the migration blocks near the end of the file (`add column if not exists`,
new/replaced policies) bring them up to date in place — safe to run on a
fresh project too.

### 3. Deploy the Edge Functions

```bash
supabase functions deploy match-referral
supabase functions deploy get-invite --no-verify-jwt
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to
Edge Functions by Supabase.

- `match-referral` currently runs in **demo mode** and returns a mocked fit
  assessment — no `ANTHROPIC_API_KEY` is required. To switch it to a real
  Anthropic-backed assessment later, see the commented-out draft prompt and
  Anthropic call inside `supabase/functions/match-referral/index.ts`, then
  run `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`.
- `get-invite` must be deployed with `--no-verify-jwt` — it's the one
  endpoint unauthenticated visitors call (from an invite link, before they
  have an account) to see which job they're invited to. It only ever
  returns a still-`invited` referral's job title/company and the
  candidate's own name/email — never the full row.

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
- The invite link flow uses `sessionStorage` (see `src/lib/invite.ts`) to
  carry the pending referral id across the signup redirect, since the
  `?ref=` query param is stripped from the URL as soon as it's read.

## Sample data

Jobia is a prototype. Use made-up names, emails and résumés when trying it
out; do not load real candidate data into a development project.

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for planned work.

## License

[MIT](LICENSE) © 2026 Chimaobi Dennis
