# Referral Network MVP

A small internal referral network: recruiters post jobs, employees refer
candidates, and an LLM produces a quick fit assessment for each referral.

Stack: Vite + React + TypeScript + Tailwind CSS.

## What's mocked right now

This app currently runs entirely on in-memory mock state — nothing is
persisted, and there is no real authentication.

| Area | Current implementation |
| --- | --- |
| Auth / "who am I" | `Header.tsx` has a "Viewing as" dropdown that switches between two hardcoded profiles in `src/lib/mockData.ts`. No real login. |
| Profiles | Hardcoded array (`mockProfiles`) in `src/lib/mockData.ts`. |
| Jobs | Hardcoded array (`mockJobs`) in `src/lib/mockData.ts`, held in React state in `App.tsx`. New jobs posted via `JobsBoard.tsx` only live in memory and disappear on reload. |
| Referrals | Held in React state in `App.tsx`, submitted via `ReferralForm.tsx`. Not persisted. |
| Resume upload | `ReferralForm.tsx` accepts a file but never uploads it anywhere — it just fakes a `mock://` URL. |
| Match scoring | `src/lib/matchService.ts` exports `mockMatchReferral()`, which waits 600ms and returns a canned `{ summary, scoreLabel }`. No LLM is called. |

See [`schema.sql`](schema.sql) for the intended Supabase schema
(`profiles`, `jobs`, `referrals`, plus a private `resumes` Storage bucket)
that this app is meant to run against once wired up.

## Getting started (current, mock-only state)

```bash
npm install
npm run dev
```

No environment variables are required yet — everything is in-memory.
