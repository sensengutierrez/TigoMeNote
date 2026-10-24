-- TigoMeNote · 065 · Loob ng bahay ni Tigo: ayos ng kwarto (dingding, sahig, gamit)
-- pets.room = { wall, floor, items: [{ id, x, z, r }] } — sine-save ng pet-fast (action "room"); null = default na kwarto.
-- Walang bagong table (nasa pets na ang RLS at grant).
alter table public.pets add column if not exists room jsonb;
