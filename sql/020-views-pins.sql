-- TigoMeNote · 020 · views ng post + pin (hanggang 3) sa profile
alter table public.posts add column if not exists pinned_at timestamptz;
alter table public.posts add column if not exists view_count integer not null default 0;
create index if not exists posts_user_pinned_idx on public.posts (user_id, pinned_at desc) where pinned_at is not null;

-- Sino ang nakakita (isang row bawat tao bawat post) — para sa "History" at para hindi madoble ang bilang
create table if not exists public.post_views (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists post_views_user_idx on public.post_views (user_id, viewed_at desc);
alter table public.post_views enable row level security;
revoke all on public.post_views from anon, authenticated;
grant select, insert, update, delete on public.post_views to service_role;

-- Bilang ng views: +1 kapag unang tingin ng isang tao, o kung lampas 6 na oras mula sa huli niyang tingin.
-- Hindi binibilang ang sariling post. Ibinabalik ang bilang ng na-dagdag.
create or replace function public.record_post_views(p_user uuid, p_posts uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare pid uuid; prev timestamptz; added integer := 0;
begin
  foreach pid in array p_posts loop
    if exists (select 1 from posts where id = pid and user_id <> p_user and deleted_at is null) then
      select viewed_at into prev from post_views where post_id = pid and user_id = p_user;
      if prev is null then
        insert into post_views (post_id, user_id) values (pid, p_user) on conflict do nothing;
        update posts set view_count = view_count + 1 where id = pid; added := added + 1;
      elsif prev < now() - interval '6 hours' then
        update post_views set viewed_at = now() where post_id = pid and user_id = p_user;
        update posts set view_count = view_count + 1 where id = pid; added := added + 1;
      else
        update post_views set viewed_at = now() where post_id = pid and user_id = p_user;
      end if;
    end if;
  end loop;
  return added;
end $$;
revoke all on function public.record_post_views(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.record_post_views(uuid, uuid[]) to service_role;
