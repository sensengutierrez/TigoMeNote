-- TigoMeNote · 048 · Background ng app (kulay, gradient o sariling picture), naka-save sa account
-- users.appearance = { use: "none"|"preset"|"color"|"image", preset, color, strength 10..100, panels 30..100 }
-- Sariling picture: isa para sa desktop/laptop at isa para sa phone (public bucket profile-media, gaya ng avatar/cover).
alter table public.users add column if not exists appearance jsonb;
alter table public.users add column if not exists bg_desktop_url text;
alter table public.users add column if not exists bg_desktop_path text;
alter table public.users add column if not exists bg_phone_url text;
alter table public.users add column if not exists bg_phone_path text;
alter table public.users drop constraint if exists users_appearance_size;
alter table public.users add constraint users_appearance_size check (appearance is null or (jsonb_typeof(appearance) = 'object' and pg_column_size(appearance) < 2000));
-- RLS at grants: walang bagong table; ang users ay naka-RLS na at service_role lang ang may access.
