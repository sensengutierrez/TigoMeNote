-- TigoMeNote · 063 · Maliit na preview ng photo para sa feed (tipid sa 5 GB/buwan na download ng Free plan, at mas mabilis sa phone)
-- post_media.thumb_path: <user>/<client_id>/<i>_t.jpg (960 px). Walang thumb = buong photo ang ipinapakita (lumang posts).
alter table public.post_media add column if not exists thumb_path text;
