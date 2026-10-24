-- TigoMeNote · 059 · Status: ❤️ like, sound (TigoMeNote Sounds), at "Trending sounds"
-- story_views.liked_at: kailan ni-like ng nanood (null = hindi). Walang bagong table (may RLS at service_role grant na sa 017).
alter table public.story_views add column if not exists liked_at timestamptz;
-- stories.sound: { id, vol, orig } gaya ng posts.sound (035)
alter table public.stories add column if not exists sound jsonb;
alter table public.stories drop constraint if exists stories_sound_shape;
alter table public.stories add constraint stories_sound_shape check (
  sound is null or (jsonb_typeof(sound) = 'object' and (sound->>'id') ~ '^[a-z0-9-]{2,30}$')
);
-- notification: may nag-like ng status mo
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'like', 'comment', 'repost', 'follow', 'follow_request', 'follow_accept', 'milestone', 'recap', 'moderation',
  'circle_invite', 'circle_accept', 'story_like'));
-- Para mabilis ang "Trending sounds" (pinakaginagamit sa nakaraang 7 araw)
create index if not exists posts_sound_recent_idx on public.posts (publish_at desc) where sound is not null and deleted_at is null;
create index if not exists stories_sound_recent_idx on public.stories (created_at desc) where sound is not null;
