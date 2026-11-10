-- TigoMeNote · 106 · Ranking ng mga laro (unang laro: "ghost" = Lights Out). games-fast lang ang gumagamit (service role).
create table if not exists public.game_runs (
  id bigint generated always as identity primary key,
  game text not null check (game in ('ghost')),
  mode text not null check (mode in ('solo','duo')),
  user_id uuid not null references public.users(id) on delete cascade,
  partner_id uuid references public.users(id) on delete set null,
  ms integer not null check (ms between 0 and 900000),
  keys smallint not null default 0 check (keys between 0 and 10),
  win boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists game_runs_rank on public.game_runs (game, mode, win, ms) where win;
create index if not exists game_runs_user on public.game_runs (user_id, created_at desc);
create index if not exists game_runs_partner on public.game_runs (partner_id);
alter table public.game_runs enable row level security;
revoke all on public.game_runs from anon, authenticated;
grant select, insert, delete on public.game_runs to service_role;
grant usage, select on sequence public.game_runs_id_seq to service_role;
