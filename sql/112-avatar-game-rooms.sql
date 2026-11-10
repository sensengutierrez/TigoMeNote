-- TigoMeNote · 112 · Avatar ni Tigo (parang tao) at "sino ang naglalaro" (0.11.43)
-- 1) pets.avatar: { kind: "tigo" | "kid", skin, hair, hairColor, top, topColor, bottom, bottomColor, shoes } — pet-fast lang ang sumusulat (may tsek).
alter table public.pets add column if not exists avatar jsonb;

-- 2) game_rooms: isang hilera bawat user = "online sa Tigo" (game = null) o "may bukas na room" (game + code).
--    Luma na kapag lampas 90 s ang updated_at. games-fast lang ang gumagamit (service role); walang access ang anon / authenticated.
create table if not exists public.game_rooms (
  user_id uuid primary key references public.users(id) on delete cascade,
  game text check (game is null or game in ('ghost','dash','siege','sudoku')),
  code text check (code is null or code ~ '^[A-Z0-9]{5}$'),
  players smallint not null default 1 check (players between 1 and 8),
  max_players smallint not null default 4 check (max_players between 1 and 8),
  updated_at timestamptz not null default now()
);
create index if not exists game_rooms_recent on public.game_rooms (updated_at desc);
alter table public.game_rooms enable row level security;
revoke all on public.game_rooms from anon, authenticated;
grant select, insert, update, delete on public.game_rooms to service_role;
