# Learning OS: SQL Studio

**Incomplete capstone prototype submitted for review, October 8, 2026.**

Live Demo Day prototype: https://learning-os-sql-studio.vercel.app

For Vercel, use the Next.js framework and `npm run build:vercel`. The deployment uses authored hints without API credentials. `.vercelignore` excludes local environment files and tool state.

A SQL learning workspace focused on assisted independence: practice with graduated hints, then answer new questions without the coach.

## Review documents

- [Submission overview and gaps](submission/START-HERE.md)
- [Case-study draft](submission/CASE-STUDY.md)
- [Architecture](submission/ARCHITECTURE.md)
- [Demo recording script](submission/DEMO-SCRIPT.md)
- [Learner-study protocol](submission/STUDY-PROTOCOL.md)

## Run locally

Requires Node.js 22.13+ and npm. Tested compilation used Node.js 24.16.

```sh
npm ci
npm run dev
```

Use the local URL printed by the server. The predev script builds the PostgreSQL worker and copies its runtime assets. No model key is needed for authored hints.

```sh
npm run typecheck
npm test
npm run build
```

For optional live hints, configure server-only GROQ_API_KEY, GROQ_MODEL, and ENABLE_LIVE_TUTOR using .env.example. Do not put credentials in source or browser code. Keep live tutoring disabled on public deployments until authentication and durable rate limits are added.

## Implemented source

- Six SQL practice exercises, three pretest and three posttest questions.
- PGlite PostgreSQL worker, two synthetic fixtures, result-set comparison.
- Graduated authored hints and optional Groq route with labelled fallback.
- Assessment UI without hints; device-local attempt records and CSV/JSON export.
- Responsive workspace and regression-test source.

## Verification and limitations

Verified October 9, 2026: TypeScript compilation, all nine regression tests, and the production build passed. Tests execute all twelve reference queries against both PostgreSQL fixtures. Browser end-to-end verification remains outstanding.

This is **not a completed implementation of the official brief**. The required Supabase/course-schema integration, live deployment, external-learner comparison, delayed retention study, recorded demo, and public case-study publication remain outstanding. No measured learning improvement is claimed.

Assessment solutions are inspectable in client code. This is a low-stakes learning prototype, not a secure exam platform. Data is synthetic; records remain on the current device. A refresh starts a new session while retaining past records for export.
