-- TigoMeNote · 100 · pangalawang kandado: walang direktang access ang anon/authenticated sa kahit anong table
-- Lahat ng basa/sulat ay dumadaan sa edge functions (service_role). Naka-RLS na ang lahat (walang policy = bawal),
-- pero inaalis din ang mga privilege para kahit may maidagdag na policy o ma-off ang RLS nang hindi sinasadya, sarado pa rin.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;   -- (may PUBLIC na execute ang functions bilang default)
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
-- service_role: tuloy ang access (gamit ng edge functions)
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;   -- hal. record_post_views, add_usage (db.rpc ng edge functions)
