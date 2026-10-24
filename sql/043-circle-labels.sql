-- TigoMeNote · 043 — "Sino siya sa iyo" sa Family/Friends (asawa, anak, magulang, kaibigan…)
-- a_label = tawag ni a kay b; b_label = tawag ni b kay a. Key (hal. "spouse") o sariling sulat, hanggang 24 letra.
alter table public.safety_links add column if not exists a_label text check (a_label is null or char_length(a_label) <= 24);
alter table public.safety_links add column if not exists b_label text check (b_label is null or char_length(b_label) <= 24);
