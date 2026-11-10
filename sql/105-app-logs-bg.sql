-- TigoMeNote · 105 · app_logs: bagong kind "bg" = isinara ng phone ang app habang nasa background (hindi crash; kind=bgkill galing sa MainActivity)
alter table public.app_logs drop constraint if exists app_logs_kind_check;
alter table public.app_logs add constraint app_logs_kind_check check (kind in ('crash','error','slow','bug','bg'));
