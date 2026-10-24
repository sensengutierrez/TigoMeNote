-- TigoMeNote · 024 · Age limit (13+), parental supervision, private account + follow requests, sleep timer, give a break
-- RLS on, walang policy (service_role lang). NAPATAKBO NA (migration 024_wellbeing, 2026-10-24).

-- Birthdate (para sa 13+ at Teen 13–17). Isang beses lang mase-set ng user.
alter table public.users add column if not exists birthdate date;
-- Private account: kailangan ng approval bago ma-follow (default sa Teen)
alter table public.users add column if not exists private_account boolean not null default false;

-- Magulang/guardian ↔ teen (invite ng magulang, i-accept ng teen). Hanggang 2 guardian bawat teen.
create table if not exists public.guardian_links (
  id          uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.users(id) on delete cascade,
  teen_id     uuid not null references public.users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  check (guardian_id <> teen_id),
  unique (guardian_id, teen_id)
);
create index if not exists guardian_links_teen_idx on public.guardian_links (teen_id);
alter table public.guardian_links enable row level security;
grant select, insert, update, delete on public.guardian_links to service_role;

-- Follow requests (para sa private accounts)
create table if not exists public.follow_requests (
  follower_id  uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id)
);
create index if not exists follow_requests_target_idx on public.follow_requests (following_id, created_at desc);
alter table public.follow_requests enable row level security;
grant select, insert, update, delete on public.follow_requests to service_role;

-- Sleep timer at break settings (bawat user). Sa Teen na may guardian, ang guardian ang nagse-set.
create table if not exists public.wellbeing (
  user_id         uuid primary key references public.users(id) on delete cascade,
  sleep_on        boolean not null default false,
  sleep_start     text not null default '22:00' check (sleep_start ~ '^[0-2][0-9]:[0-5][0-9]$'),
  sleep_end       text not null default '06:00' check (sleep_end ~ '^[0-2][0-9]:[0-5][0-9]$'),
  break_on        boolean not null default true,
  break_min       integer not null default 60 check (break_min between 10 and 240),
  daily_limit_min integer check (daily_limit_min between 15 and 1440),
  tz              text not null default 'Asia/Bahrain',
  updated_by      uuid references public.users(id) on delete set null,
  updated_at      timestamptz not null default now()
);
alter table public.wellbeing enable row level security;
grant select, insert, update, delete on public.wellbeing to service_role;

-- Oras ng paggamit bawat araw (binibilang ng server, kasama ang ibang device)
create table if not exists public.usage_days (
  user_id    uuid not null references public.users(id) on delete cascade,
  day        date not null,
  seconds    integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.usage_days enable row level security;
grant select, insert, update, delete on public.usage_days to service_role;

-- Dagdag ng oras (atomic; max 120 s bawat tawag)
create or replace function public.add_usage(p_user uuid, p_day date, p_sec integer)
returns integer language sql security definer set search_path = public as $$
  insert into usage_days (user_id, day, seconds) values (p_user, p_day, least(greatest(p_sec, 0), 120))
  on conflict (user_id, day) do update set seconds = usage_days.seconds + least(greatest(p_sec, 0), 120), updated_at = now()
  returning seconds;
$$;
revoke execute on function public.add_usage(uuid, date, integer) from public, anon, authenticated;
grant execute on function public.add_usage(uuid, date, integer) to service_role;
