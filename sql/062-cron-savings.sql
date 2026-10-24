-- TigoMeNote · 062 · Tipid sa Free plan (500k na tawag sa functions bawat buwan)
-- 1) Reminders: tatawagin lang ang daily-fast kapag may reminder/alarm na dapat nang ipadala (dati: bawat minuto, ~43k bawat buwan).
-- 2) Keep-warm: kapag may gumagamit lang ng app (may screen time sa huling 15 minuto) at bawat 4 minuto (dati: laging bawat 3 min, ~130k bawat buwan).
--    Kapag walang gumagamit, puwedeng mabagal nang kaunti ang unang bukas (cold start) — normal iyon.
select cron.unschedule('tmn-reminders') where exists (select 1 from cron.job where jobname = 'tmn-reminders');
select cron.schedule('tmn-reminders', '* * * * *', $job$
  select net.http_post(
    url := 'https://njwtfoimkorkcysxvrqb.supabase.co/functions/v1/daily-fast?forceFunctionRegion=ap-south-1',
    body := jsonb_build_object('action', 'due', 'key', (select value->>'k' from public.app_keys where name = 'cron_daily')),
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 20000
  )
  where exists (select 1 from public.reminders where done_at is null and sent_at is null and due_at <= now() + interval '30 seconds');
$job$);

select cron.unschedule('tmn-keep-warm') where exists (select 1 from cron.job where jobname = 'tmn-keep-warm');
select cron.schedule('tmn-keep-warm', '*/4 * * * *', $job$
  select net.http_post(
    url := 'https://njwtfoimkorkcysxvrqb.supabase.co/functions/v1/' || f || '?forceFunctionRegion=ap-south-1',
    body := '{"action":"warm"}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 8000
  )
  from unnest(array['auth-fast','notify-fast','wellbeing-fast','safety-fast','messages-fast','posts-fast','social-fast']) as f
  where exists (select 1 from public.usage_days where updated_at > now() - interval '15 minutes');
$job$);
