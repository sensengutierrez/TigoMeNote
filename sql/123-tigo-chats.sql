-- TigoMeNote · 123 Tigo in-game chat: hiwalay sa Messenger. Pribado/grupo (tigo_threads, tigo_thread_members, tigo_msgs) at chat ng lugar (tigo_world.place).
-- RLS naka-on at walang policy: ang Edge Function (service_role) lang ang nakakabasa/nakakasulat.
alter table public.tigo_world add column if not exists place text not null default 'world' check (place = 'world' or place ~ '^isle:[0-9a-f-]{36}$');
create index if not exists tigo_world_place_idx on public.tigo_world (place, id desc);

create table if not exists public.tigo_threads (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('dm','group')),
  title       text check (title is null or char_length(title) <= 60),
  dm_key      text unique,
  channel_key uuid not null default gen_random_uuid(),
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  last_at     timestamptz not null default now()
);
create table if not exists public.tigo_thread_members (
  thread_id    uuid not null references public.tigo_threads(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  left_at      timestamptz,
  primary key (thread_id, user_id)
);
create index if not exists tigo_thread_members_user_idx on public.tigo_thread_members (user_id);
create table if not exists public.tigo_msgs (
  id         bigint generated always as identity primary key,
  thread_id  uuid not null references public.tigo_threads(id) on delete cascade,
  user_id    uuid references public.users(id) on delete set null,
  kind       text not null default 'text' check (kind in ('text','system')),
  body       text not null check (char_length(body) between 1 and 500),
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists tigo_msgs_thread_idx on public.tigo_msgs (thread_id, id desc);
alter table public.tigo_threads enable row level security;
alter table public.tigo_thread_members enable row level security;
alter table public.tigo_msgs enable row level security;
revoke all on public.tigo_threads, public.tigo_thread_members, public.tigo_msgs from anon, authenticated;
grant all on public.tigo_threads, public.tigo_thread_members, public.tigo_msgs to service_role;
