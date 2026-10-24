-- TigoMeNote · 055 · Tigo v2: coins, closet (outfit), mga nabiling item, at gantimpala sa bawat level
-- coins: pambili sa shop (galing sa Coin Rush at sa pag-level up). owned: mga nabiling item (id mula sa catalog).
-- outfit: { hat, face, body, hand, buddy, backdrop }. rewarded_level: hanggang anong level na naibigay ang coins.
-- Walang bagong table; ang pets ay may RLS na at service_role lang ang may grant (052).
alter table public.pets add column if not exists coins integer not null default 50 check (coins >= 0);
alter table public.pets add column if not exists owned text[] not null default '{}';
alter table public.pets add column if not exists outfit jsonb not null default '{}'::jsonb;
alter table public.pets add column if not exists rewarded_level integer not null default 1;

-- lumang "gear" → outfit.hat; at huwag nang bigyan ng coins ang mga level na naabot na bago ito
update public.pets set outfit = jsonb_build_object('hat', gear) where gear <> 'none' and outfit = '{}'::jsonb;
update public.pets set rewarded_level = floor(sqrt(greatest(xp, 0) / 20.0))::int + 1 where rewarded_level = 1;
