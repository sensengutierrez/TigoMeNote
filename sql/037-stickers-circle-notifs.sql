-- TigoMeNote · 037 — stickers sa chat, at notification ng Family/Friends invite
-- messages.kind: dagdag na 'sticker' (body = sticker id, hal. "tigo-hello")
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check check (kind in ('text', 'photo', 'location', 'system', 'sticker'));
-- notifications.type: dagdag na 'circle_invite' (may nag-invite sa Family/Friends) at 'circle_accept' (tinanggap)
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'like', 'comment', 'repost', 'follow', 'follow_request', 'follow_accept', 'milestone', 'recap', 'moderation',
  'circle_invite', 'circle_accept'));
-- Ang invite na naghihintay pa (para lumabas agad sa Notifications ng inimbitahan)
insert into public.notifications (user_id, actor_id, type, data)
select case when l.invited_by = l.a_id then l.b_id else l.a_id end, l.invited_by, 'circle_invite', jsonb_build_object('link', l.id, 'kind', l.kind)
from public.safety_links l
where l.status = 'pending'
  and not exists (select 1 from public.notifications n where n.type = 'circle_invite' and n.data->>'link' = l.id::text);
