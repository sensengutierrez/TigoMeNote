-- TigoMeNote · 108 · game_runs: Sky Dash, Gloom Siege, Sudoku (ranking ayon sa oras o puntos), mode "multi" (2–4)
alter table public.game_runs add column if not exists score integer not null default 0;
alter table public.game_runs add column if not exists level text;
alter table public.game_runs drop constraint if exists game_runs_game_check;
alter table public.game_runs add constraint game_runs_game_check check (game in ('ghost','dash','siege','sudoku'));
alter table public.game_runs drop constraint if exists game_runs_mode_check;
alter table public.game_runs add constraint game_runs_mode_check check (mode in ('solo','duo','multi'));
alter table public.game_runs drop constraint if exists game_runs_level_check;
alter table public.game_runs add constraint game_runs_level_check check (level is null or level in ('easy','medium','hard'));
create index if not exists game_runs_score on public.game_runs (game, score desc) where win;
