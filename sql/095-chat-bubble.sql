-- TigoMeNote · 095 · bubble ng chat: gaano kalinaw (para kita ang wallpaper) at glossy — pareho sa lahat ng nasa chat
-- bubble_alpha = 15..100 (porsiyento ng kulay ng bubble; null = 100, buo) · bubble_gloss = may kintab
alter table public.conversations add column if not exists bubble_alpha smallint check (bubble_alpha is null or bubble_alpha between 15 and 100);
alter table public.conversations add column if not exists bubble_gloss boolean not null default false;
grant select, insert, update, delete on public.conversations to service_role;
