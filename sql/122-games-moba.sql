-- TigoMeNote · 122 Bloom Clash (moba): payagan sa ranking (game_runs) at sa bukas na room (game_rooms)
alter table public.game_runs drop constraint if exists game_runs_game_check;
alter table public.game_runs add constraint game_runs_game_check check (game = any (array['ghost','dash','siege','sudoku','moba']));
alter table public.game_rooms drop constraint if exists game_rooms_game_check;
alter table public.game_rooms add constraint game_rooms_game_check check (game is null or game = any (array['ghost','dash','siege','sudoku','moba']));
