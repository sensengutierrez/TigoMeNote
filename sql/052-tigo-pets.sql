-- TigoMeNote · 052 · Tigo (virtual pet, parang Tamagotchi pero sariling disenyo) + "Gather" ng magkakalapit na kaibigan
-- pets: isang Tigo bawat user. Ang stats ay kinukuwenta ng pet-fast (bumababa habang lumilipas ang oras).
-- near_*: tinatayang lokasyon (rounded ~100 m), kapag naka-on lang ang "Meet nearby friends", nawawala pagkalipas ng 20 min.
-- pet_meets: isang beses bawat araw bawat magkaibigan na nagkita ang mga Tigo.
create table if not exists public.pets (
  user_id    uuid primary key references public.users(id) on delete cascade,
  name       text not null default 'Tigo' check (char_length(name) between 1 and 20),
  color      text not null default 'coral',
  gear       text not null default 'none',
  hunger     smallint not null default 80 check (hunger between 0 and 100),
  joy        smallint not null default 80 check (joy between 0 and 100),
  energy     smallint not null default 80 check (energy between 0 and 100),
  clean      smallint not null default 90 check (clean between 0 and 100),
  xp         integer not null default 0 check (xp >= 0),
  asleep     boolean not null default false,
  stats_at   timestamptz not null default now(),
  counters   jsonb not null default '{}'::jsonb,
  near_on    boolean not null default false,
  near_lat   double precision,
  near_lng   double precision,
  near_at    timestamptz,
  born_at    timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pets_near_idx on public.pets (near_at) where near_on;

create table if not exists public.pet_meets (
  id         uuid primary key default gen_random_uuid(),
  a_id       uuid not null references public.users(id) on delete cascade,
  b_id       uuid not null references public.users(id) on delete cascade,
  by_id      uuid not null references public.users(id) on delete cascade,
  day        date not null default current_date,
  created_at timestamptz not null default now(),
  unique (a_id, b_id, day),
  check (a_id < b_id)
);
create index if not exists pet_meets_b_idx on public.pet_meets (b_id, day);

alter table public.pets enable row level security;
alter table public.pet_meets enable row level security;
revoke all on public.pets, public.pet_meets from anon, authenticated;
grant select, insert, update, delete on public.pets, public.pet_meets to service_role;
