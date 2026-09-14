-- Jobia — Supabase schema
-- Run this against your linked Supabase project (via `supabase db push`
-- with this file as a migration, or paste into the SQL editor).

-- ---------------------------------------------------------------------
-- profiles
-- One row per authenticated user. Created on signup (client-side insert
-- right after auth.signUp, since Supabase has no signup DB trigger here).
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  bio text,
  is_recruiter boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- jobs
-- Posted by recruiters (profiles.is_recruiter = true).
-- ---------------------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  company text not null,
  description text not null,
  location text,
  created_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

create policy "Jobs are viewable by any authenticated user"
  on public.jobs for select
  to authenticated
  using (true);

create policy "Recruiters can insert their own jobs"
  on public.jobs for insert
  to authenticated
  with check (
    auth.uid() = recruiter_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_recruiter = true
    )
  );

create policy "Recruiters can update their own jobs"
  on public.jobs for update
  to authenticated
  using (auth.uid() = recruiter_id)
  with check (auth.uid() = recruiter_id);

create policy "Recruiters can delete their own jobs"
  on public.jobs for delete
  to authenticated
  using (auth.uid() = recruiter_id);

-- ---------------------------------------------------------------------
-- referrals
-- Submitted by any authenticated user (the referrer) against a job.
-- match_summary / match_score_label are filled in asynchronously by the
-- match-referral Edge Function after the row is inserted.
-- ---------------------------------------------------------------------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  candidate_name text not null,
  candidate_email text not null,
  summary text,
  resume_url text,
  match_summary text,
  match_score_label text check (match_score_label in ('Strong fit', 'Partial fit', 'Weak fit')),
  created_at timestamptz not null default now()
);

alter table public.referrals enable row level security;

create policy "Referrers can view their own referrals"
  on public.referrals for select
  to authenticated
  using (auth.uid() = referrer_id);

create policy "Recruiters can view referrals for their own jobs"
  on public.referrals for select
  to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = referrals.job_id and j.recruiter_id = auth.uid()
    )
  );

create policy "Authenticated users can submit referrals"
  on public.referrals for insert
  to authenticated
  with check (auth.uid() = referrer_id);

-- Note: no update policy for regular users — match_summary/match_score_label
-- are written by the match-referral Edge Function using the service role
-- key, which bypasses RLS entirely.

-- ---------------------------------------------------------------------
-- Storage: resumes bucket
-- Private bucket; objects stored under `{referral_id}/{filename}`.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload resumes"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'resumes');

create policy "Authenticated users can read resumes"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'resumes');
