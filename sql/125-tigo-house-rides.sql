-- TigoMeNote · 125 Tigo: antas ng bahay (1 = kubo, 2 = Cottage, 3 = Villa, 4 = Mansion). Ang mga sasakyan ay nasa pets.owned (bike, scooter, car).
alter table public.pets add column if not exists house smallint not null default 1 check (house between 1 and 4);
