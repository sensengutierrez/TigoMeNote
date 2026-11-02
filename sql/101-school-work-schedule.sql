-- TigoMeNote · 101 · Daily: School & work schedule (paalala bago magsimula ang klase o trabaho)
-- Gamit ang reminders table: kind 'class' | 'work', repeat 'days', at sched = { days:[0–6], start, end, lead, tz } (daily-fast).
alter table public.reminders add column if not exists sched jsonb;
alter table public.reminders drop constraint if exists reminders_kind_check;
alter table public.reminders add constraint reminders_kind_check check (kind in ('reminder','alarm','class','work'));
alter table public.reminders drop constraint if exists reminders_repeat_check;
alter table public.reminders add constraint reminders_repeat_check check (repeat in ('none','daily','weekly','monthly','days'));
alter table public.reminders drop constraint if exists reminders_sched_check;
alter table public.reminders add constraint reminders_sched_check check ((repeat = 'days') = (sched is not null));
revoke all on public.reminders from anon, authenticated;
grant select, insert, update, delete on public.reminders to service_role;
