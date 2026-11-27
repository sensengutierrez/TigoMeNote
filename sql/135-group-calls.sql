-- TigoMeNote · 135 — 📞 Group call (voice at video, hanggang 8; calls-fast)
-- calls.is_group: tawag sa buong group chat (walang iisang callee). call_members: sino ang sumali at kailan umalis.
alter table public.calls alter column callee_id drop not null;
alter table public.calls add column if not exists is_group boolean not null default false;
create table if not exists public.call_members (
  call_id uuid not null references public.calls(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (call_id, user_id)
);
create index if not exists calls_conv_open on public.calls (conversation_id) where status in ('ringing', 'active');
alter table public.call_members enable row level security;
revoke all on public.call_members from anon, authenticated;
grant all on public.call_members to service_role;
