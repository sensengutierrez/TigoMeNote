-- TigoMeNote · 140 — 🔴 Live gamit ang YouTube / Twitch / Facebook / TikTok (libre; sila ang nagpapadala ng video)
-- platform: cf (sariling Live sa Cloudflare) o ang platform ng link. embed: video id / channel / malinis na link para sa player. link: ang ipinaste ng user.
alter table public.lives add column if not exists platform text not null default 'cf';
alter table public.lives add column if not exists link text;
alter table public.lives add column if not exists embed text;
alter table public.lives drop constraint if exists lives_platform_check;
alter table public.lives add constraint lives_platform_check check (platform in ('cf', 'youtube', 'twitch', 'facebook', 'tiktok'));
