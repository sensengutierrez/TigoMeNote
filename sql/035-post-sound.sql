-- TigoMeNote · 035 — sound sa post (TigoMeNote Sounds, gawa sa device)
-- { id: "golden-hour", vol: 0.8, orig: 0.4 }  · id lang at lakas, walang audio file na naka-upload
alter table public.posts add column if not exists sound jsonb;
alter table public.posts drop constraint if exists posts_sound_shape;
alter table public.posts add constraint posts_sound_shape check (
  sound is null or (jsonb_typeof(sound) = 'object' and (sound->>'id') ~ '^[a-z0-9-]{2,30}$')
);
