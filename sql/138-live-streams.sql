-- TigoMeNote · 138 — 🔴 Live sa Explore (live-fast; video sa Cloudflare Realtime SFU)
-- lives: isang live bawat user (status live → ended). cf_session/tracks: para makahila ang nanonood. channel: Realtime para sa chat at "end".
-- live_chat: mga mensahe sa live (dumadaan sa moderation; para may record kapag may report).
create table if not exists public.lives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default '',
  source text not null default 'camera' check (source in ('camera', 'screen')),
  status text not null default 'live' check (status in ('live', 'ended')),
  cf_session text,
  tracks jsonb not null default '[]'::jsonb,
  channel text not null,
  viewers int not null default 0,
  peak int not null default 0,
  started_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists lives_live on public.lives (status, started_at desc);
create index if not exists lives_user on public.lives (user_id, started_at desc);
create unique index if not exists lives_one_live on public.lives (user_id) where status = 'live';
create table if not exists public.live_chat (
  id bigint generated always as identity primary key,
  live_id uuid not null references public.lives(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists live_chat_live on public.live_chat (live_id, created_at);
create index if not exists live_chat_user on public.live_chat (user_id, created_at);
alter table public.lives enable row level security;
alter table public.live_chat enable row level security;
revoke all on public.lives, public.live_chat from anon, authenticated;
grant all on public.lives, public.live_chat to service_role;
