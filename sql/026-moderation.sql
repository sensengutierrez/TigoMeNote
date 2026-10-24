-- TigoMeNote · 026 · Moderation: reports, nakatagong content, at log ng admin
-- RLS on, walang policy (service_role lang, galing sa moderation-fast at iba pang functions).
-- NAPATAKBO NA (migration 026_moderation, 2026-10-24).

-- Mga report ng users (isang report bawat tao bawat target)
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id) on delete set null,   -- null = automatic (text filter)
  target_type text not null check (target_type in ('post', 'comment', 'user', 'story')),
  target_id   uuid not null,
  owner_id    uuid references public.users(id) on delete cascade,    -- may-ari ng content
  reason      text not null check (reason in ('violence', 'nudity', 'crime', 'firearms', 'harassment', 'hate', 'child_safety', 'self_harm', 'spam', 'other')),
  note        text check (char_length(note) <= 500),
  auto        boolean not null default false,
  status      text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.users(id) on delete set null
);
create unique index if not exists reports_one_per_reporter on public.reports (reporter_id, target_type, target_id) where reporter_id is not null;
create index if not exists reports_open_idx on public.reports (status, created_at desc);
create index if not exists reports_target_idx on public.reports (target_type, target_id);

-- Nakatago habang nire-review (o tinanggal ng admin)
alter table public.posts          add column if not exists hidden_at timestamptz;
alter table public.posts          add column if not exists hidden_reason text;
alter table public.post_comments  add column if not exists hidden_at timestamptz;
alter table public.stories        add column if not exists hidden_at timestamptz;
-- Bilang ng paglabag (warning) bawat user
alter table public.users          add column if not exists strikes integer not null default 0;

-- Log ng ginawa ng admin at ng automatic na filter
create table if not exists public.moderation_log (
  id          bigserial primary key,
  actor_id    uuid references public.users(id) on delete set null,   -- null = automatic
  action      text not null,          -- hide, unhide, delete, dismiss, warn, suspend, unsuspend, auto_block, auto_flag, auto_hide
  target_type text,
  target_id   uuid,
  user_id     uuid references public.users(id) on delete set null,   -- kaninong content / account
  reason      text,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists moderation_log_user_idx on public.moderation_log (user_id, created_at desc);

alter table public.reports        enable row level security;
alter table public.moderation_log enable row level security;
revoke all on public.reports, public.moderation_log from anon, authenticated;
grant select, insert, update, delete on public.reports, public.moderation_log to service_role;
grant usage, select on sequence public.moderation_log_id_seq to service_role;
