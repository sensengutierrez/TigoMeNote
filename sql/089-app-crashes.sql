-- TigoMeNote · 089 · app_crashes — crash report ng Android apps (galing sa crash-fast). Para malaman kung bakit nagfo-force close.
-- Service role lang ang may access (RLS naka-on, walang policy). Binubura ang lampas 30 araw ng crash-fast.
create table if not exists public.app_crashes (
  id bigint generated always as identity primary key,
  user_id uuid references public.users(id) on delete set null,
  app text not null check (app in ('main', 'chat', 'tigo')),
  version text not null,
  kind text not null default 'crash',
  report text not null,
  created_at timestamptz not null default now()
);
create index if not exists app_crashes_created on public.app_crashes (created_at desc);
alter table public.app_crashes enable row level security;
grant select, insert, delete on public.app_crashes to service_role;
grant usage, select on sequence public.app_crashes_id_seq to service_role;
