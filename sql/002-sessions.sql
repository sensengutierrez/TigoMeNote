-- TigoMeNote · 002 · sessions
-- Token mismo hindi sine-save; SHA-256 hash lang. 24 oras ang buhay.

create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,
  user_id     uuid not null references public.users(id) on delete cascade,
  user_agent  text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '24 hours',
  revoked_at  timestamptz
);

create index if not exists sessions_user_idx on public.sessions (user_id);
create index if not exists sessions_expires_idx on public.sessions (expires_at);

alter table public.sessions enable row level security;
revoke all on public.sessions from anon, authenticated;
grant select, insert, update, delete on public.sessions to service_role;
