-- TigoMeNote · 117 Tigo social: World chat, mute, at susi ng isla (pasyal sa bahay ng kaibigan)
-- RLS naka-on at walang policy: ang Edge Function (service_role) lang ang nakakabasa/nakakasulat.
create table if not exists public.tigo_world (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 200),
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists tigo_world_user_idx on public.tigo_world (user_id, created_at desc);
alter table public.tigo_world enable row level security;
revoke all on public.tigo_world from anon, authenticated;
grant all on public.tigo_world to service_role;

create table if not exists public.tigo_mutes (
  user_id    uuid not null references public.users(id) on delete cascade,
  muted_id   uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, muted_id),
  check (user_id <> muted_id)
);
alter table public.tigo_mutes enable row level security;
revoke all on public.tigo_mutes from anon, authenticated;
grant all on public.tigo_mutes to service_role;

-- lihim na susi ng realtime channel ng isla; ibinibigay lang sa may-ari at sa mga follower na bumibisita
alter table public.pets add column if not exists isle_key uuid not null default gen_random_uuid();
