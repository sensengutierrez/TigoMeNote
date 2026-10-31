-- TigoMeNote · 093 · chat themes at wallpaper (pareho sa lahat ng nasa chat) — napatakbo na
-- theme = id ng theme (tingnan ang THEMES sa backend/messages-fast.ts at assets/js/components/chat-theme.js); null = default
-- wallpaper_path = larawan sa bucket na chat-media (<chat id>/wp-<user id>-….jpg); null = walang wallpaper
alter table public.conversations add column if not exists theme text check (theme is null or char_length(theme) <= 24);
alter table public.conversations add column if not exists wallpaper_path text check (wallpaper_path is null or char_length(wallpaper_path) <= 200);
grant select, insert, update, delete on public.conversations to service_role;
