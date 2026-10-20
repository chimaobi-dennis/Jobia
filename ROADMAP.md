# Jobia roadmap

Planned work, roughly in priority order. Jobia is currently a working MVP with
demo-mode shortcuts (mocked résumé parsing, deterministic match scoring, no
real invite emails).

## Next up
- [ ] Real LLM-backed match scoring in the `match-referral` Edge Function
      (replace the deterministic demo scorer; keep a no-key fallback).
- [ ] Real résumé text extraction (PDF/DOCX) instead of `mockResumeParse.ts`.
- [ ] Send invite emails (Supabase + transactional email provider) instead of
      only showing a copyable link.
- [ ] Automated tests: unit tests for `src/lib`, Edge Function tests, and RLS
      policy tests against a local Supabase instance.
- [ ] CI (lint, typecheck, build) on every push.

## Features
- [ ] Recruiter: edit/close/reopen jobs; filter and sort referrals per job.
- [ ] Referral status pipeline (invited → submitted → reviewed → interview →
      hired/rejected) with status-change notifications.
- [ ] Referrer dashboard showing the outcome of the people they referred.
- [ ] Referral rewards / bonus tracking for successful hires.
- [ ] Candidate profile reuse across applications.
- [ ] Password reset and email verification flows.

## Quality and docs
- [ ] Accessibility pass (keyboard navigation, labels, contrast).
- [ ] Loading/error states across all data fetches.
- [ ] Seed script with made-up sample data for local development.
- [ ] Deployment guide (Vercel/Netlify + Supabase project).
- [ ] Screenshots in the README.
