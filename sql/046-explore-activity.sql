-- TigoMeNote · 046 · Explore activity (parang Komoot): route sa mapa + stats sa isang post
-- posts.activity = { type, title, route: [[lat,lng,ele]], stats: { dist_m, dur_s, up_m, down_m }, start_at }
-- Puwedeng walang photo/video ang post kapag may activity (mapa ang ipinapakita).
alter table public.posts add column if not exists activity jsonb;
alter table public.posts drop constraint if exists posts_activity_size;
alter table public.posts add constraint posts_activity_size check (activity is null or (jsonb_typeof(activity) = 'object' and pg_column_size(activity) < 80000));
create index if not exists posts_activity_idx on public.posts (publish_at desc) where activity is not null and deleted_at is null;
-- RLS at grants: walang bagong table; ang posts ay naka-RLS na at service_role lang ang may access (sql/013).
