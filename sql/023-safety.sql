-- TigoMeNote · 023 · Safety: Family/Friends circle, location (30 araw), SOS, push subscriptions
-- Lahat ay RLS on, walang policy (service_role lang, galing sa safety-fast).
-- NAPATAKBO NA (migration 023_safety, 2026-10-24).

-- Circle: isang row bawat pares ng tao (a_id < b_id para walang doble)
create table if not exists public.safety_links (
  id          uuid primary key default gen_random_uuid(),
  a_id        uuid not null references public.users(id) on delete cascade,
  b_id        uuid not null references public.users(id) on delete cascade,
  kind        text not null check (kind in ('family', 'friend')),
  status      text not null default 'pending' check (status in ('pending', 'accepted')),
  invited_by  uuid not null references public.users(id) on delete cascade,
  a_shares    boolean not null default false,  -- pinapayagan ni A na ma-Locate siya ni B
  b_shares    boolean not null default false,  -- pinapayagan ni B na ma-Locate siya ni A
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  check (a_id < b_id),
  unique (a_id, b_id)
);
create index if not exists safety_links_b_idx on public.safety_links (b_id);
alter table public.safety_links enable row level security;
revoke all on public.safety_links from anon, authenticated;
grant select, insert, update, delete on public.safety_links to service_role;

-- "Pause sharing" ng user (hindi nagse-save ng location, maliban kung naka-SOS)
alter table public.users add column if not exists loc_paused boolean not null default false;

-- Location points (binubura pagkalipas ng 30 araw)
create table if not exists public.location_points (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  lat        double precision not null check (lat between -90 and 90),
  lng        double precision not null check (lng between -180 and 180),
  acc        real,
  source     text not null default 'app' check (source in ('app', 'sos', 'manual', 'background')),
  created_at timestamptz not null default now()
);
create index if not exists location_points_user_idx on public.location_points (user_id, created_at desc);
alter table public.location_points enable row level security;
revoke all on public.location_points from anon, authenticated;
grant select, insert, update, delete on public.location_points to service_role;
grant usage, select on sequence public.location_points_id_seq to service_role;

-- SOS (isang active lang bawat user)
create table if not exists public.sos_alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  status     text not null default 'active' check (status in ('active', 'safe', 'cancelled')),
  lat        double precision,
  lng        double precision,
  acc        real,
  loc_at     timestamptz,
  note       text,
  started_at timestamptz not null default now(),
  ended_at   timestamptz
);
create unique index if not exists sos_one_active_idx on public.sos_alerts (user_id) where status = 'active';
create index if not exists sos_user_idx on public.sos_alerts (user_id, started_at desc);
alter table public.sos_alerts enable row level security;
revoke all on public.sos_alerts from anon, authenticated;
grant select, insert, update, delete on public.sos_alerts to service_role;

-- Sino ang nakakita / papunta na ("I'm on my way")
create table if not exists public.sos_acks (
  alert_id uuid not null references public.sos_alerts(id) on delete cascade,
  user_id  uuid not null references public.users(id) on delete cascade,
  acked_at timestamptz not null default now(),
  primary key (alert_id, user_id)
);
alter table public.sos_acks enable row level security;
revoke all on public.sos_acks from anon, authenticated;
grant select, insert, update, delete on public.sos_acks to service_role;

-- Push: web push ngayon; "fcm" naka-abang para sa APK
create table if not exists public.push_subs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  kind       text not null default 'webpush' check (kind in ('webpush', 'fcm')),
  endpoint   text not null unique,   -- web push URL, o FCM token sa APK
  p256dh     text,
  auth       text,
  created_at timestamptz not null default now(),
  last_ok_at timestamptz,
  fail_count integer not null default 0
);
create index if not exists push_subs_user_idx on public.push_subs (user_id);
alter table public.push_subs enable row level security;
revoke all on public.push_subs from anon, authenticated;
grant select, insert, update, delete on public.push_subs to service_role;

-- Mga key ng server (hal. VAPID para sa web push). Ginagawa mismo ng safety-fast sa unang gamit,
-- kaya hindi lumalabas ang private key kahit saan. service_role lang.
create table if not exists public.app_keys (
  name       text primary key,
  value      jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.app_keys enable row level security;
revoke all on public.app_keys from anon, authenticated;
grant select, insert, update, delete on public.app_keys to service_role;

-- Linis ng lumang data (location > 30 araw, tapos na SOS > 30 araw):
-- ginagawa ng safety-fast mismo (sa bawat "ping" para sa sarili, at paminsan-minsan para sa lahat),
-- kaya hindi na kailangan ng pg_cron.
