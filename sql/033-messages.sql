-- TigoMeNote · 033 · Messages (Tigo Messenger): chats, groups, messages, reactions, message requests
-- RLS on, walang policy (service_role lang, galing sa messages-fast). Files: private bucket "chat-media".
-- NAPATAKBO NA (migration 033_messages, 2026-10-24).

create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  kind            text not null check (kind in ('dm', 'group')),
  title           text check (char_length(title) <= 60),
  dm_key          text unique,                                  -- "<id1>:<id2>" (naka-sort) para sa iisang DM bawat pares
  created_by      uuid references public.users(id) on delete set null,
  channel_key     uuid not null default gen_random_uuid(),      -- lihim na pangalan ng realtime channel (members lang ang may alam)
  pinned_message_id uuid,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  role            text not null default 'member' check (role in ('admin', 'member')),
  status          text not null default 'active' check (status in ('active', 'request', 'left')),
  joined_at       timestamptz not null default now(),
  last_read_at    timestamptz not null default now(),
  muted           boolean not null default false,
  primary key (conversation_id, user_id)
);
create index if not exists conversation_members_user_idx on public.conversation_members (user_id, status);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid references public.users(id) on delete set null, -- nagpadala (null = system)
  client_id       text,
  kind            text not null default 'text' check (kind in ('text', 'photo', 'location', 'system')),
  body            text check (char_length(body) <= 2000),
  media_path      text,
  media_w         integer,
  media_h         integer,
  lat             double precision,
  lng             double precision,
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  hidden_at       timestamptz
);
create index if not exists messages_conv_idx on public.messages (conversation_id, created_at desc);
create unique index if not exists messages_client_idx on public.messages (user_id, client_id) where client_id is not null;

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages             enable row level security;
alter table public.message_reactions    enable row level security;
revoke all on public.conversations, public.conversation_members, public.messages, public.message_reactions from anon, authenticated;
grant select, insert, update, delete on public.conversations, public.conversation_members, public.messages, public.message_reactions to service_role;

-- Report ng message, at setting ng push para sa messages
alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports add constraint reports_target_type_check check (target_type in ('post', 'comment', 'user', 'story', 'message'));
alter table public.notif_prefs add column if not exists messages text not null default 'push' check (messages in ('off', 'app', 'push'));

-- Private bucket para sa photos ng chat (signed URL lang)
insert into storage.buckets (id, name, public) values ('chat-media', 'chat-media', false) on conflict (id) do nothing;
