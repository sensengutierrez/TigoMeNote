-- TigoMeNote · 003 · write_action_dedup
-- Duplicate-save guard + simpleng rate limit (hal. register per IP).

create table if not exists public.write_action_dedup (
  id          bigint generated always as identity primary key,
  dedup_key   text not null,
  action      text not null,
  user_id     uuid,
  created_at  timestamptz not null default now()
);

create index if not exists dedup_key_time_idx on public.write_action_dedup (dedup_key, created_at desc);

alter table public.write_action_dedup enable row level security;
revoke all on public.write_action_dedup from anon, authenticated;
grant select, insert, update, delete on public.write_action_dedup to service_role;
grant usage, select on sequence public.write_action_dedup_id_seq to service_role;
