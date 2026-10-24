-- TigoMeNote · 029 · Notifications (activity) at notification settings
-- RLS on, walang policy (service_role lang, galing sa notify-fast at iba pang functions).
-- NAPATAKBO NA (migration 029_notifications, 2026-10-24).

-- Bawat notification ng isang user (tatanggap = user_id, gumawa = actor_id)
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  actor_id   uuid references public.users(id) on delete cascade,          -- null = galing sa TigoMeNote
  type       text not null check (type in ('like', 'comment', 'repost', 'follow', 'follow_request', 'follow_accept', 'milestone', 'recap', 'moderation')),
  post_id    uuid references public.posts(id) on delete cascade,
  comment_id uuid,
  emoji      text,
  body       text check (char_length(body) <= 300),                         -- hal. sipi ng comment
  data       jsonb,                                                          -- hal. bilang ng recap, desisyon ng admin
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;
create index if not exists notifications_actor_idx on public.notifications (actor_id, type, post_id);

-- Settings ng notifications bawat user. off = wala; app = sa listahan lang; push = listahan + sa phone
create table if not exists public.notif_prefs (
  user_id      uuid primary key references public.users(id) on delete cascade,
  paused_until timestamptz,
  sleep_mute   boolean not null default true,
  likes        text not null default 'push' check (likes    in ('off', 'app', 'push')),
  comments     text not null default 'push' check (comments in ('off', 'app', 'push')),
  reposts      text not null default 'push' check (reposts  in ('off', 'app', 'push')),
  follows      text not null default 'push' check (follows  in ('off', 'app', 'push')),
  updates      text not null default 'push' check (updates  in ('off', 'app', 'push')),
  updated_at   timestamptz not null default now()
);

alter table public.notifications enable row level security;
alter table public.notif_prefs   enable row level security;
revoke all on public.notifications, public.notif_prefs from anon, authenticated;
grant select, insert, update, delete on public.notifications, public.notif_prefs to service_role;
