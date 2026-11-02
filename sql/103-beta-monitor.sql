-- TigoMeNote · 103 · Beta monitor: app_logs (crash, error, slow, bug) at app_testers (sino ang gumagamit, aling app/version, ilang araw)
-- Galing sa crash-fast (app-health.js sa bawat page; app-mode.js para sa crash ng Android; Settings → Report a bug).
-- Admin page: app/admin/beta.html. Service role lang (RLS naka-on, walang policy). Binubura ang lampas 30 araw (crash-fast).
create table if not exists public.app_logs (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('crash','error','slow','bug')),
  app text not null default 'web' check (app in ('web','main','chat','tigo')),
  version text not null default '?',
  user_id uuid references public.users(id) on delete set null,
  page text,
  message text not null check (char_length(message) <= 500),
  detail text check (detail is null or char_length(detail) <= 12000),
  ms integer,
  device text,
  shot text check (shot is null or char_length(shot) <= 400000),
  fp text not null,
  hits integer not null default 1,
  status text not null default 'open' check (status in ('open','fixed')),
  created_at timestamptz not null default now(),
  last_at timestamptz not null default now()
);
create index if not exists app_logs_kind_last on public.app_logs (kind, last_at desc);
create index if not exists app_logs_fp on public.app_logs (fp, last_at desc);

create table if not exists public.app_testers (
  user_id uuid not null references public.users(id) on delete cascade,
  app text not null check (app in ('web','main','chat','tigo')),
  version text not null default '?',
  device text,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  last_day date not null default current_date,
  days integer not null default 1,
  opens integer not null default 1,
  primary key (user_id, app)
);

-- lumang crash reports → app_logs
insert into public.app_logs (kind, app, version, user_id, page, message, detail, fp, created_at, last_at)
select 'crash', c.app, c.version, c.user_id, substring(c.report from 'page=([^\s]+)'),
       left(coalesce(nullif(split_part(c.report, E'\n', 1), ''), c.kind), 500), left(c.report, 12000),
       md5('crash|' || c.app || '|' || left(c.report, 200)), c.created_at, c.created_at
from public.app_crashes c
where not exists (select 1 from public.app_logs l where l.kind = 'crash' and l.created_at = c.created_at);

alter table public.app_logs enable row level security;
alter table public.app_testers enable row level security;
revoke all on public.app_logs, public.app_testers from anon, authenticated;
grant select, insert, update, delete on public.app_logs, public.app_testers to service_role;
grant usage, select on sequence public.app_logs_id_seq to service_role;
