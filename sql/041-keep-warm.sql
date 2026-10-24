-- TigoMeNote · 041 — "Keep warm": iwas mabagal na unang tawag (cold start 2–3 s) ng edge functions
-- Bawat 3 minuto, may maliit na tawag sa mga function na ginagamit sa bawat page (walang token → 401 agad, walang DB query).
-- Gastos: ~8 function × 20/oras ≈ 115k invocations/buwan (free plan: 500k). Patayin: select cron.unschedule('tmn-keep-warm');
create extension if not exists pg_net;
create extension if not exists pg_cron;
select cron.unschedule('tmn-keep-warm') where exists (select 1 from cron.job where jobname = 'tmn-keep-warm');
select cron.schedule('tmn-keep-warm', '*/3 * * * *', $job$
  select net.http_post(
    url := 'https://njwtfoimkorkcysxvrqb.supabase.co/functions/v1/' || f,
    body := '{"action":"warm"}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 8000
  )
  from unnest(array['auth-fast','notify-fast','wellbeing-fast','safety-fast','messages-fast','posts-fast','social-fast','profile-fast']) as f;
$job$);
