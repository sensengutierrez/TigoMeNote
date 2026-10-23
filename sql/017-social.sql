-- TigoMeNote · 017 · social: reactions, comments, bookmarks, shares (repost/link), stories (24 oras)
-- Lahat: RLS on, walang policy, service_role lang (dumadaan sa posts-fast / social-fast).

-- Isang reaction bawat user bawat post (pwedeng palitan ang emoji)
create table if not exists public.post_reactions (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  emoji      text not null check (emoji in ('❤️','😂','😮','😢','🔥','👏')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists post_reactions_user_idx on public.post_reactions (user_id, created_at desc);

create table if not exists public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);

create table if not exists public.post_bookmarks (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists post_bookmarks_user_idx on public.post_bookmarks (user_id, created_at desc);

-- kind: repost (lalabas sa feed ng followers) o link (kinopya/ipinadala ang link)
create table if not exists public.post_shares (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  kind       text not null check (kind in ('repost','link')),
  created_at timestamptz not null default now()
);
create unique index if not exists post_shares_one_repost on public.post_shares (post_id, user_id) where kind = 'repost';
create index if not exists post_shares_post_idx on public.post_shares (post_id, created_at desc);
create index if not exists post_shares_user_idx on public.post_shares (user_id, created_at desc);

-- Status / story: nawawala pagkalipas ng 24 oras
create table if not exists public.stories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  kind       text not null check (kind in ('photo','video')),
  path       text not null unique,            -- sa bucket post-media: <user_id>/stories/<file>
  mime       text not null,
  w int, h int, duration real,
  caption    text not null default '' check (char_length(caption) <= 200),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
create index if not exists stories_user_idx on public.stories (user_id, created_at desc);
create index if not exists stories_exp_idx on public.stories (expires_at);

create table if not exists public.story_views (
  story_id   uuid not null references public.stories(id) on delete cascade,
  viewer_id  uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

alter table public.post_reactions enable row level security;
alter table public.post_comments  enable row level security;
alter table public.post_bookmarks enable row level security;
alter table public.post_shares    enable row level security;
alter table public.stories        enable row level security;
alter table public.story_views    enable row level security;
revoke all on public.post_reactions, public.post_comments, public.post_bookmarks, public.post_shares, public.stories, public.story_views from anon, authenticated;
grant select, insert, update, delete on public.post_reactions, public.post_comments, public.post_bookmarks, public.post_shares, public.stories, public.story_views to service_role;
