-- TigoMeNote · 015 · profile: banner (cover photo) + avatar files
-- avatar_url / banner_url = public link ng larawan. *_path = file sa bucket (para mabura ang luma pag pinalitan).
-- Bucket: profile-media (PUBLIC read: profile photo at cover ay talagang nakikita ng iba). Upload ay dumadaan sa profile-fast lang.

alter table public.users add column if not exists banner_url  text;
alter table public.users add column if not exists avatar_path text;
alter table public.users add column if not exists banner_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-media', 'profile-media', true, 3145728, array['image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
