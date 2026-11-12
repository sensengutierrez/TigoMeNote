-- TigoMeNote · 127 — 💎 Gem Duel: ranking (trophies bawat season), pila ng matchmaking at mga laban (duel-fast)
-- RLS naka-on; walang access ang anon/authenticated (ang edge function lang, gamit ang service_role).
create table if not exists public.duel_ranks (
  user_id uuid not null references public.users(id) on delete cascade,
  season text not null,                      -- 'YYYY-MM' (UTC)
  trophies int not null default 0 check (trophies >= 0),
  wins int not null default 0, losses int not null default 0, draws int not null default 0,
  streak int not null default 0, best int not null default 0,
  bot_day date, bot_n int not null default 0, -- ranked na laban sa bot bawat araw (hanggang 20)
  updated_at timestamptz not null default now(),
  primary key (user_id, season)
);
create index if not exists duel_ranks_top on public.duel_ranks (season, trophies desc);

create table if not exists public.duel_queue (
  user_id uuid primary key references public.users(id) on delete cascade,
  trophies int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.duel_matches (
  id bigserial primary key,
  a_id uuid not null references public.users(id) on delete cascade,   -- nauuna
  b_id uuid references public.users(id) on delete cascade,            -- null = bot
  bot boolean not null default false,
  seed int not null,
  code text not null,
  a_rep jsonb, b_rep jsonb,
  settled boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists duel_matches_a on public.duel_matches (a_id, created_at desc);
create index if not exists duel_matches_b on public.duel_matches (b_id, created_at desc);

alter table public.duel_ranks enable row level security;
alter table public.duel_queue enable row level security;
alter table public.duel_matches enable row level security;
revoke all on public.duel_ranks, public.duel_queue, public.duel_matches from anon, authenticated;
grant all on public.duel_ranks, public.duel_queue, public.duel_matches to service_role;
grant usage, select on sequence public.duel_matches_id_seq to service_role;
