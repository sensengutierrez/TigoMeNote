-- TigoMeNote · 066 · Sound Maker: sariling gawang tunog ng user (beat + chords + melody, tinutugtog ng device)
-- recipe = { v, name, bpm, root, scale, prog[4], drums{k,s,h,p,c,d,t}, bass, chord, lead, swing, rain, crackle, seed, by }
-- Kapag ginamit sa post/status, kinokopya ang recipe sa sound ng post (kaya tumutugtog pa rin kahit burahin ang sound).
-- Hanggang 30 bawat user (sounds-fast ang nagbabantay).
create table if not exists public.user_sounds (
  id         text primary key check (id ~ '^u-[a-z0-9]{8}$'),
  user_id    uuid not null references public.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 30),
  recipe     jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_sounds_user_idx on public.user_sounds (user_id, updated_at desc);
alter table public.user_sounds enable row level security;
revoke all on public.user_sounds from anon, authenticated;
grant select, insert, update, delete on public.user_sounds to service_role;
