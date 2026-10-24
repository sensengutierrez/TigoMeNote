-- TigoMeNote · 039 — GIF sa chat (KLIPY, sa pamamagitan ng gifs-fast)
-- messages.kind: dagdag na 'gif' (body = KLIPY link, media_w/media_h = laki)
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check check (kind in ('text', 'photo', 'location', 'system', 'sticker', 'gif'));
