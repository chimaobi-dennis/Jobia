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
  skills text[] not null default '{}',
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
-- Created by a referrer as an *invite* (candidate_name + candidate_email
-- only, status='invited'). The invited candidate later signs up, follows
-- the invite link, and *claims + submits* the same row themselves (adding
-- summary, resume_url, candidate_id, status='submitted'). match_summary /
-- match_score_label are filled in asynchronously by the match-referral
-- Edge Function after submission.
-- ---------------------------------------------------------------------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  candidate_id uuid references public.profiles (id) on delete set null,
  candidate_name text not null,
  candidate_email text not null,
  status text not null default 'invited' check (status in ('invited', 'submitted')),
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

create policy "Candidates can view referrals naming their own email"
  on public.referrals for select
  to authenticated
  using (lower(candidate_email) = lower((auth.jwt() ->> 'email')));

create policy "Authenticated users can submit referrals"
  on public.referrals for insert
  to authenticated
  with check (auth.uid() = referrer_id);

-- An invited candidate can claim and submit their own invite once: only
-- while status is still 'invited', only a row addressed to their own auth
-- email, and only to move it to 'submitted' as themselves. This is the one
-- update path regular users have on this table — match_summary /
-- match_score_label are written separately by the match-referral Edge
-- Function using the service role key, which bypasses RLS entirely.
create policy "Invited candidates can claim and submit their referral"
  on public.referrals for update
  to authenticated
  using (
    status = 'invited'
    and lower(candidate_email) = lower((auth.jwt() ->> 'email'))
  )
  with check (
    status = 'submitted'
    and candidate_id = auth.uid()
    and lower(candidate_email) = lower((auth.jwt() ->> 'email'))
  );

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

-- ---------------------------------------------------------------------
-- Migration: add jobs.skills to an already-existing jobs table.
-- `create table if not exists` above won't add this column to a table
-- that was created before this line was added — run this separately
-- against any project that already had `jobs` before `skills` existed.
-- Safe to run even on a fresh project (IF NOT EXISTS).
-- ---------------------------------------------------------------------
alter table public.jobs
  add column if not exists skills text[] not null default '{}';

-- ---------------------------------------------------------------------
-- Migration: candidate self-apply flow on an already-existing referrals
-- table. Adds candidate_id/status and the two new RLS policies. Existing
-- rows (created under the old referrer-fills-everything flow) default to
-- status='submitted' so they don't get swept up by the "invited" policies.
-- Safe to run even on a fresh project.
-- ---------------------------------------------------------------------
alter table public.referrals
  add column if not exists candidate_id uuid references public.profiles (id) on delete set null;

alter table public.referrals
  add column if not exists status text not null default 'submitted';

update public.referrals set status = 'submitted' where status is null;

alter table public.referrals
  drop constraint if exists referrals_status_check;
alter table public.referrals
  add constraint referrals_status_check check (status in ('invited', 'submitted'));

alter table public.referrals
  alter column summary drop not null;

drop policy if exists "Candidates can view referrals naming their own email" on public.referrals;
create policy "Candidates can view referrals naming their own email"
  on public.referrals for select
  to authenticated
  using (lower(candidate_email) = lower((auth.jwt() ->> 'email')));

drop policy if exists "Invited candidates can claim and submit their referral" on public.referrals;
create policy "Invited candidates can claim and submit their referral"
  on public.referrals for update
  to authenticated
  using (
    status = 'invited'
    and lower(candidate_email) = lower((auth.jwt() ->> 'email'))
  )
  with check (
    status = 'submitted'
    and candidate_id = auth.uid()
    and lower(candidate_email) = lower((auth.jwt() ->> 'email'))
  );
