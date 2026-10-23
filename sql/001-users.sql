-- TigoMeNote · 001 · users
-- Sariling users table (hindi Supabase Auth). Server lang (service_role) ang may access.

create table if not exists public.users (
  id               uuid primary key default gen_random_uuid(),
  username         text not null,
  display_name     text not null,
  password_hash    text not null,
  password_salt    text not null,
  role             text not null default 'User'   check (role in ('Admin','User')),
  status           text not null default 'Active' check (status in ('Active','Pending','Inactive')),
  bio              text not null default '' check (char_length(bio) <= 300),
  avatar_url       text,
  failed_attempts  int  not null default 0,
  locked_until     timestamptz,
  last_login_at    timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint users_username_format check (username ~ '^[a-z0-9_.]{3,24}$')
);

create unique index if not exists users_username_key on public.users (lower(username));

alter table public.users enable row level security;
revoke all on public.users from anon, authenticated;
grant select, insert, update, delete on public.users to service_role;
