-- TigoMeNote · 050 · Daily: Reminders at Alarms (may push sa phone kahit sarado ang app)
-- Ang Daily notes ay nasa device lang; ang reminders lang ang nasa server (para maipadala ang push sa tamang oras).
create table if not exists public.reminders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  kind       text not null default 'reminder' check (kind in ('reminder','alarm')),
  title      text not null check (char_length(title) between 1 and 120),
  note       text check (note is null or char_length(note) <= 300),
  due_at     timestamptz not null,
  repeat     text not null default 'none' check (repeat in ('none','daily','weekly','monthly')),
  done_at    timestamptz,
  sent_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reminders_due_idx on public.reminders (due_at) where done_at is null;
create index if not exists reminders_user_idx on public.reminders (user_id, due_at);
alter table public.reminders enable row level security;
revoke all on public.reminders from anon, authenticated;
grant select, insert, update, delete on public.reminders to service_role;

-- Susi ng cron (random, ginagawa dito; hindi lumalabas kahit saan): daily-fast "due" ay tumatanggap lang nito
insert into public.app_keys (name, value)
values ('cron_daily', jsonb_build_object('k', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')))
on conflict (name) do nothing;

-- Bawat minuto: ipadala ang mga reminder na oras na (≈43k tawag/buwan). Patayin: select cron.unschedule('tmn-reminders');
select cron.unschedule('tmn-reminders') where exists (select 1 from cron.job where jobname = 'tmn-reminders');
select cron.schedule('tmn-reminders', '* * * * *', $job$
  select net.http_post(
    url := 'https://njwtfoimkorkcysxvrqb.supabase.co/functions/v1/daily-fast',
    body := jsonb_build_object('action', 'due', 'key', (select value->>'k' from public.app_keys where name = 'cron_daily')),
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 20000
  );
$job$);
