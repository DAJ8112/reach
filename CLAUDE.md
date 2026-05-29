# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run everything (web on :5173, api on :8787)
pnpm dev

# Run individual apps
pnpm --filter @reach/web dev
pnpm --filter @reach/api dev

# Build
pnpm build

# Typecheck all packages
pnpm typecheck

# Lint
pnpm lint
```

No test suite exists yet.

## Architecture

pnpm monorepo with three packages:

- **`apps/web`** — Vite + React 18 + TypeScript + Tailwind. Single-page app with hash-based routing (`#/settings` → Settings, otherwise Generator or Onboarding).
- **`apps/api`** — Express + TypeScript, run via `tsx watch`. Serves on `:8787`. Vite proxies `/api/*` to it during dev, so the frontend never needs CORS in dev.
- **`packages/shared`** — Zod schemas and TypeScript types shared by both apps (`Profile`, `Resume`, `GenerateRequest`, `EmailDraft`). Imported directly as TypeScript source (not built); both apps resolve it via tsconfig paths / Vite alias.

### Auth flow

Supabase magic-link auth. The frontend (`apps/web/src/lib/supabase.ts`) holds the anon client. All API routes except `/health` use `requireAuth` middleware (`apps/api/src/middleware/auth.ts`), which reads the `Authorization: Bearer <jwt>` header, verifies it via the Supabase service-role client, and attaches `req.userId` / `req.userEmail`.

The frontend `api()` helper (`apps/web/src/lib/api.ts`) automatically injects the Supabase session token as a Bearer header on every request.

### App routing

`App.tsx` drives three top-level states based on session + profile:
1. No session → `AuthGate` (magic-link login)
2. Session + `profile.onboardedAt === null` → `Onboarding` flow
3. Session + onboarded → `Generator` (or `Settings` if hash is `#/settings`)

Routing is custom hash-based (`apps/web/src/lib/route.ts`), not React Router.

### Key API routes

| Route | Purpose |
|---|---|
| `POST /api/profile/resume` | Multipart upload (PDF/DOCX ≤10MB) → `pdf-parse`/`mammoth` extraction → Claude `tool_use` parse → structured `resumeJson` |
| `GET /api/profile` | Load current user's profile |
| `PATCH /api/profile` | Partial-update profile fields |
| `POST /api/jd/extract` | Fetch JD URL server-side → `jsdom` + `@mozilla/readability` → `{title, company, content}`. Returns `{needs_manual:true}` on fetch failure. |
| `POST /api/generate` | Load profile + resolve JD + build prompt + call Claude with forced `write_email` tool → return `{subject, body}` + persist to `generations` table |

### LLM usage (Anthropic Claude)

All LLM calls use forced tool use (`tool_choice: {type:"tool", name:"<tool>"}`) for guaranteed structured output:
- **Resume parsing** (`apps/api/src/llm/parseResume.ts`): `record_resume` tool, schema from `packages/shared/src/resume.ts`
- **Email generation** (`apps/api/src/llm/generateEmail.ts`): `write_email` tool returning `{subject, body}`

Prompt assembly for generation is in `apps/api/src/llm/promptBuilder.ts`; few-shot examples are in `apps/api/src/llm/fewshots.ts`. System prompt enforces ~120-word emails, no AI cold-email patterns (no "hope this email finds you well", no flattery, no credential-dump openings).

Model is configured via `ANTHROPIC_MODEL` env var (default: `claude-sonnet-4-6`).

### Database (Supabase Postgres)

Schema in `apps/api/db/0001_init.sql` — run manually in Supabase SQL editor.

- **`profiles`**: one row per auth user, auto-created by trigger on signup. Contains `resume_text` (raw), `resume_json` (jsonb structured), `skills` (text[]), `achievements` (jsonb), `links` (jsonb). RLS: owner-only via `auth.uid()`.
- **`generations`**: one row per `/api/generate` call, written server-side with service role key (no client insert policy). Used for prompt iteration/debugging.

### Design reference

`design-handoff/project/` contains the original React/UMD prototype (`app.jsx`, `onboarding.jsx`, `styles.css`, `onboarding.css`). This is read-only visual reference — match pixels, not file structure. The `TweaksPanel` / `useTweaks` machinery in the prototype is prototype-only chrome and is not implemented in the real app.

### Environment variables

`apps/api/.env` (see `.env.example`):
```
PORT=8787
WEB_ORIGIN=http://localhost:5173
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6
```

`apps/web/.env` (see `.env.example`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
