-- TigoMeNote · 007 · email verification
-- users: dagdag na email + email_verified_at; bagong status na 'Unverified'
-- email_codes: 6-digit codes (hash lang ang naka-save)

alter table public.users add column if not exists email text;
alter table public.users add column if not exists email_verified_at timestamptz;

alter table public.users drop constraint if exists users_status_check;
alter table public.users add constraint users_status_check
  check (status in ('Unverified','Active','Pending','Inactive'));

alter table public.users drop constraint if exists users_email_format;
alter table public.users add constraint users_email_format
  check (email is null or (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'));

create unique index if not exists users_email_key on public.users (lower(email)) where email is not null;

create table if not exists public.email_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  purpose     text not null default 'verify' check (purpose in ('verify','reset')),
  code_hash   text not null,
  attempts    int  not null default 0,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists email_codes_user_idx on public.email_codes (user_id, purpose, created_at desc);

alter table public.email_codes enable row level security;
revoke all on public.email_codes from anon, authenticated;
grant select, insert, update, delete on public.email_codes to service_role;
