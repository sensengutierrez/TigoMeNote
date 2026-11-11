-- TigoMeNote · 114 · Taniman / bunga / pangingisda sa labas, at antas ng Lights Out (0.11.45)
-- 1) pets.farm: { plots: { "0": { s, t } }, trees: { "0": iso }, fish: { d, n, t } } — pet-fast lang ang sumusulat (oras at coins ay sa server).
alter table public.pets add column if not exists farm jsonb;
-- 2) Lights Out: may antas na ang ranking (easy / medium / hard). Ang mga dating takbo ay Easy (iyon ang nag-iisang mapa noon).
update public.game_runs set level = 'easy' where game = 'ghost' and level is null;
