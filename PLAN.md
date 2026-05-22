# Reach — Cold Email Generator: Implementation Plan

## Context

Greenfield build. Goal of v0.1 (per `reach-prd.md`): validate that a context-rich prompt pipeline produces send-worthy cold email drafts for job seekers. Two flows: one-time **Onboarding** that captures a stored Profile (resume + skills + 3–5 achievements + links), and per-request **Generation** (job URL + recipient role/context + ask → editable email).

Design is delivered as a React/UMD prototype under `design-handoff/project/` (`app.jsx`, `onboarding.jsx`, `styles.css`, `onboarding.css`). The prototype is the visual reference — match pixels, not file structure. Drop the `tweaks-panel.jsx` and `useTweaks` machinery (prototype-only chrome).

**Stack:** Vite + React + TS frontend, Express + TS backend, Supabase (Postgres + Auth), Anthropic Claude Sonnet 4.6 for resume parsing + email generation, Tailwind styling (hand-translated from prototype CSS), JD ingestion via server-side fetch + `@mozilla/readability` with paste-text fallback.

---

## Repo layout

```
reach/
├── apps/
│   ├── web/              # Vite + React + TS + Tailwind
│   └── api/              # Express + TS
├── packages/
│   └── shared/           # zod schemas + shared types (Profile, Draft, etc.)
├── design-handoff/       # existing — reference only
├── reach-prd.md
└── package.json          # pnpm workspaces
```

pnpm workspaces. TypeScript strict everywhere. Shared zod schemas in `packages/shared` so API + web agree on Profile / GenerateRequest / EmailDraft shapes.

---

## Milestone 1 — Project skeleton ✅

1. `pnpm init` + workspaces. `apps/web` (Vite React-TS), `apps/api` (Express + tsx + zod + dotenv).
2. Tailwind in `apps/web`: design tokens from `design-handoff/project/styles.css` + `onboarding.css` ported via CSS-var indirection so dark/light still toggle via `data-theme`.
3. ESLint + Prettier, `.env.example` files, tsconfig paths so `web` can import `@reach/shared`.
4. Supabase project (user task): create, capture URL + anon key + service role key. Enable email magic-link auth.

**Verify:** `pnpm --filter @reach/web dev` serves `:5173`; `pnpm --filter @reach/api dev` serves `:8787/health` returning 200.

---

## Milestone 2 — Auth + Profile schema ✅

DB tables (Supabase migrations under `apps/api/db/`):
- `profiles` — `user_id (uuid pk → auth.users)`, `name`, `headline`, `email`, `phone`, `location`, `resume_text` (raw), `resume_json` (jsonb structured), `skills` (text[]), `achievements` (jsonb), `links` (jsonb), `onboarded_at`, `updated_at`. RLS: owner-only.
- `generations` — `id`, `user_id`, `job_url`, `job_text`, `recipient_role`, `recipient_context`, `ask`, `subject`, `body`, `created_at`. RLS: owner-only. (Useful for v0.1 to debug + iterate prompts.)

Frontend auth: `@supabase/supabase-js` client. Magic-link auth gate before onboarding/generator routes. Backend verifies JWT on every protected route via `@supabase/supabase-js` server client + `getUser(jwt)`.

**Critical files:** `packages/shared/src/profile.ts`, `apps/api/src/middleware/auth.ts`, `apps/web/src/lib/supabase.ts`, `apps/web/src/routes/AuthGate.tsx`.

---

## Milestone 3 — Onboarding UI ✅

Translate `design-handoff/project/onboarding.jsx`:
- Routes: `/onboarding/upload`, `/review`, `/achievements`, `/links`, `/welcome` (or single `/onboarding` with internal `step` state — match prototype's stepper variant; drop the `single-page` Tweak variant).
- Components (one-to-one with prototype): `Wordmark`, `StepUpload` (drag/drop + parsing progress), `StepReview` (Section accordions, Experience/Education/Projects cards, Skills tag picker), `StepAchievements`, `StepLinks`, `StepWelcome`.
- Replace prototype's `MOCK_RESUME` with real parse result from API.
- Strip prototype's `useTweaks` / `TweaksPanel`.
- Persist on each step's "Continue" via `PATCH /api/profile`. Final "Finish" sets `onboarded_at`.

**Pixel-match strategy:** read `onboarding.css` rule-by-rule, port classes to Tailwind utilities (or `@apply` in single onboarding.css if class reused 3+ times). Keep custom CSS for animations (shimmer, progress fill, accordion chevron).

---

## Milestone 4 — Resume parsing pipeline ✅

`POST /api/profile/resume` (multipart upload):
1. Accept `.pdf` / `.docx` (≤10MB). Reject anything else.
2. Extract text: `pdf-parse` for PDF, `mammoth` for DOCX. Keep raw text → `profiles.resume_text`.
3. Call Claude with text + strict zod-derived JSON schema. Use Anthropic SDK `tool_use` with single `record_resume` tool — most reliable structured-output path on Sonnet 4.6. Schema mirrors `MOCK_RESUME` shape.
4. Return parsed JSON to client; `StepReview` shows it for correction; `PATCH /api/profile` saves corrected `resume_json`.

**Critical files:** `apps/api/src/routes/profile.ts`, `apps/api/src/llm/anthropic.ts`, `apps/api/src/llm/parseResume.ts`, `packages/shared/src/resume.ts`.

---

## Milestone 5 — Generator UI (`/`) ✅

Translate `design-handoff/project/app.jsx`:
- Sequential 4-step input flow: `url` → `role` → `context` (optional) → `ask`. Reuse prototype's `InputRow` behavior (Enter submits, autofocus, multiline autosize, animated stack-up).
- After step 4, transition to "stacked phase" (`layout-topbar` only — drop sidebar/pills/pyramid Tweak variants), show `Loading` shimmer, then `EmailDraft` editable card with subject + body + Copy + Regenerate.
- "Paste JD text instead" secondary input next to URL step (covers JDs that 403 server-side fetch).
- Click stacked input → re-edit inline; Enter returns to email view (manual Regenerate).

**Critical files:** `apps/web/src/routes/Generator.tsx`, `apps/web/src/components/InputRow.tsx`, `apps/web/src/components/EmailDraft.tsx`, `apps/web/src/components/Loading.tsx`.

---

## Milestone 6 — JD ingest + Generation API ✅

`POST /api/jd/extract` `{ url }` → `{ title, company, content }`:
- Server-side `fetch` with desktop UA + 8s timeout.
- Parse with `jsdom` + `@mozilla/readability`. Strip nav/footer noise. Cap content ~8000 chars.
- On non-2xx or empty extract, return `{ needs_manual: true }` so UI prompts paste.

`POST /api/generate` `{ jobUrl, jobTextOverride?, recipientRole, recipientContext?, ask }`:
1. Load Profile from DB (auth required).
2. If `jobTextOverride` present, use it; else call extractor; if that fails, return 422 → UI swaps to paste box.
3. Build prompt per `reach-prd.md` §5.3:
   - **System message:** role one-liner + ~120-word target + subject-line requirement + anti-patterns list (no "hope this finds you well", no flattery, no credential-dump opening, no AI-cold-email tells) + 2–3 stylistically-distinct few-shot examples.
   - **User message** (in order): structured Profile (labelled fields, not prose) → `<JOB_DESCRIPTION>` block → recipient role + optional context → ask one-liner → final instruction: pick 1–2 most relevant Profile items, output as JSON `{subject, body}`.
4. Call Anthropic with `write_email` tool whose `input_schema` is `{subject:string, body:string}` — forced tool use (`tool_choice: {type:"tool", name:"write_email"}`) for guaranteed structured output.
5. Persist to `generations`. Return `{subject, body}`.

**Critical files:** `apps/api/src/routes/jd.ts`, `apps/api/src/routes/generate.ts`, `apps/api/src/llm/promptBuilder.ts`, `apps/api/src/llm/fewshots.ts`.

---

## Milestone 7 — Polish

- Toast notifications (sonner).
- Settings page that re-renders `StepReview` + `StepAchievements` + `StepLinks` against saved profile, all editable.
- Keyboard: `⌘↵` to copy on draft.
- Error states: JD fetch failed → inline paste fallback; generate failed → retry button; resume parse failed → manual entry path.
- Rate-limit `/api/generate` per user (e.g. 30/day) — simple Postgres counter.

---

## Verification (end-to-end)

1. `pnpm dev` (turbo or two terminals): web on `:5173`, api on `:8787`. Magic-link login works.
2. Onboarding: upload real PDF resume → parsed JSON appears in Review step → edit → save → land on Welcome.
3. Reload app, hit `/` → Generator. Paste real Greenhouse / Lever JD URL → fill role + ask → loading → editable draft.
4. Inspect generated draft against PRD §5.3 anti-patterns: no "hope this finds you well", no flattery, length ~120 words, references 1–2 Profile items, has Subject + body.
5. Edit draft inline, click Copy, paste into mail client — formatting clean.
6. JD URL that 403s (e.g. LinkedIn) → UI offers paste-text fallback → generation still completes.
7. Check Supabase `generations` row written with all inputs + outputs (for prompt iteration).
8. Sign out → protected routes redirect to auth gate.

---

## Critical files summary

- **Reference (read-only):** `design-handoff/project/app.jsx`, `design-handoff/project/onboarding.jsx`, `design-handoff/project/styles.css`, `design-handoff/project/onboarding.css`, `reach-prd.md`.
- **To create:** all of `apps/web/`, `apps/api/`, `packages/shared/` per layout above.

## Out of scope for v0.1

Send-from-app, multiple drafts per generation, team accounts, billing, analytics dashboard, JD caching, Playwright fallback for JS-rendered JDs (paste fallback covers it).
