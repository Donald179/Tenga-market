-- Migration du profil vendeur a executer dans Supabase > SQL Editor
alter table public.sellers
  add column if not exists description text not null default '',
  add column if not exists image_url text;

create or replace view public.seller_public_profiles
with (security_invoker = false)
as
select id, store_name, first_name, last_name, whatsapp, address, description, image_url
from public.sellers;

grant select on public.seller_public_profiles to anon, authenticated;
