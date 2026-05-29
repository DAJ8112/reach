-- Reach v0.1 schema
-- Run in Supabase SQL editor (Project → SQL → New query → paste → Run).

-- =====================================================================
-- profiles: one row per auth user. Holds onboarding output.
-- =====================================================================
create table if not exists public.profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  name                 text        not null default '',
  headline             text        not null default '',
  email                text        not null default '',
  phone                text        not null default '',
  location             text        not null default '',
  resume_text          text        not null default '',
  resume_json          jsonb,
  skills               text[]      not null default '{}',
  achievements         jsonb       not null default '[]'::jsonb,
  links                jsonb       not null default '{"linkedin":"","github":"","site":"","twitter":"","custom":[]}'::jsonb,
  onboarded_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Auto-create an empty profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- RLS: owner-only read/update. No insert from clients (trigger handles it).
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================================
-- generations: one row per LLM call. Useful for prompt iteration.
-- =====================================================================
create table if not exists public.generations (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  job_url              text,
  job_text             text,
  recipient_role       text not null,
  recipient_context    text,
  ask                  text not null,
  subject              text not null,
  body                 text not null,
  model                text,
  created_at           timestamptz not null default now()
);

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

alter table public.generations enable row level security;

drop policy if exists "generations_select_own" on public.generations;
create policy "generations_select_own" on public.generations
  for select using (auth.uid() = user_id);

drop policy if exists "generations_delete_own" on public.generations;
create policy "generations_delete_own" on public.generations
  for delete using (auth.uid() = user_id);

-- v0.1: writes happen server-side with service role key, no client insert policy needed.
