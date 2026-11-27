-- TigoMeNote · 132 — 📞 Tawag sa Messages (voice at video, 1-on-1; calls-fast)
-- call_keys: lihim na key ng bawat user para sa "ring" channel (Supabase Realtime) — dito tumutunog ang papasok na tawag habang bukas ang app.
-- calls: bawat tawag. signal_key = lihim na channel ng dalawang phone para sa WebRTC (offer/answer/ICE); walang audio/video na dumadaan sa server.
-- RLS naka-on; walang access ang anon/authenticated (ang edge function lang, gamit ang service_role).
create table if not exists public.call_keys (
  user_id uuid primary key references public.users(id) on delete cascade,
  ring_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  caller_id uuid not null references public.users(id) on delete cascade,
  callee_id uuid not null references public.users(id) on delete cascade,
  video boolean not null default false,
  status text not null default 'ringing' check (status in ('ringing', 'active', 'ended', 'missed', 'declined', 'busy')),
  signal_key text not null,
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  ended_at timestamptz
);
create index if not exists calls_callee on public.calls (callee_id, created_at desc);
create index if not exists calls_caller on public.calls (caller_id, created_at desc);
create index if not exists calls_open on public.calls (status) where status in ('ringing', 'active');

alter table public.call_keys enable row level security;
alter table public.calls enable row level security;
revoke all on public.call_keys, public.calls from anon, authenticated;
grant all on public.call_keys, public.calls to service_role;
