-- TigoMeNote · 004 · brain_notes
-- Sariling Brain vault (Obsidian-style, [[links]]). Hiwalay sa Lalabella.

create table if not exists public.brain_notes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null default '',
  tags        text[] not null default '{}',
  updated_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists brain_notes_title_key on public.brain_notes (lower(title));

alter table public.brain_notes enable row level security;
revoke all on public.brain_notes from anon, authenticated;
grant select, insert, update, delete on public.brain_notes to service_role;
