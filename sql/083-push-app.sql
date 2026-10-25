-- TigoMeNote · 083 · push_subs.app — aling Android app ang may FCM token (para sa push.ts routing) — napatakbo na
-- tigomenote = TigoMeNote app · messenger = TigoMeNote Chat · tigo = Tigo app · null = web push
alter table public.push_subs add column if not exists app text check (app in ('tigomenote', 'messenger', 'tigo'));
grant select, insert, update, delete on public.push_subs to service_role;
