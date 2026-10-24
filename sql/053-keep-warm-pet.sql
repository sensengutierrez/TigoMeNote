-- TigoMeNote · 053 · Isama ang pet-fast sa keep-warm (sql/041). Ang daily-fast ay mainit na dahil sa cron ng reminders (bawat minuto).
select cron.unschedule('tmn-keep-warm') where exists (select 1 from cron.job where jobname = 'tmn-keep-warm');
select cron.schedule('tmn-keep-warm', '*/3 * * * *', $job$
  select net.http_post(
    url := 'https://njwtfoimkorkcysxvrqb.supabase.co/functions/v1/' || f,
    body := '{"action":"warm"}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 8000
  )
  from unnest(array['auth-fast','notify-fast','wellbeing-fast','safety-fast','messages-fast','posts-fast','social-fast','profile-fast','pet-fast']) as f;
$job$);
