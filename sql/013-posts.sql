-- TigoMeNote · 013 · posts (offline queue + scheduled posts)
-- posts: isang post (caption, visibility, kailan lalabas). post_media: photos/videos ng post.
-- follows: para sa "Followers lang" na visibility. Bucket: post-media (PRIVATE, signed URLs lang).

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  client_id   text not null,                       -- galing sa device; pang-iwas sa doble kapag nag-retry offline
  caption     text not null default '' check (char_length(caption) <= 1000),
  visibility  text not null default 'public' check (visibility in ('public','followers','private')),
  publish_at  timestamptz not null default now(),  -- lalabas lang pag lumampas na ito
  taken_at    timestamptz,
  media_count int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (user_id, client_id)
);
create index if not exists posts_feed_idx on public.posts (publish_at desc) where deleted_at is null;
create index if not exists posts_user_idx on public.posts (user_id, publish_at desc);

create table if not exists public.post_media (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  kind       text not null check (kind in ('photo','video')),
  path       text not null unique,                 -- <user_id>/<client_id>/<n>.<ext> sa bucket post-media
  mime       text not null,
  size       int  not null default 0,
  w          int, h int,
  duration   real,
  position   int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists post_media_post_idx on public.post_media (post_id, position);

create table if not exists public.follows (
  follower_id  uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.follows enable row level security;
revoke all on public.posts, public.post_media, public.follows from anon, authenticated;
grant select, insert, update, delete on public.posts, public.post_media, public.follows to service_role;

-- Private bucket: hindi mabubuksan ang files nang walang signed URL galing sa posts-fast
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-media', 'post-media', false, 12582912, array['image/jpeg','image/webp','video/webm','video/mp4'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
