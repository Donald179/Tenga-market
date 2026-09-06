create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  whatsapp text not null,
  store_name text not null,
  address text not null,
  description text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  name text not null,
  category text not null check (category in ('ordinateurs', 'telephones', 'accessoires', 'services')),
  price numeric not null check (price >= 0),
  description text not null,
  image_url text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.sellers enable row level security;
alter table public.products enable row level security;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('seller-images', 'seller-images', true)
on conflict (id) do update set public = true;

alter table public.sellers add column if not exists description text not null default '';
alter table public.sellers add column if not exists image_url text;

drop policy if exists "Public can read published products" on public.products;
drop policy if exists "Users can create own seller profile" on public.sellers;
drop policy if exists "Users can update own seller profile" on public.sellers;
drop policy if exists "Users can read own seller profile" on public.sellers;
drop policy if exists "Users can create own products" on public.products;
drop policy if exists "Users can update own products" on public.products;
drop policy if exists "Users can delete own products" on public.products;
drop policy if exists "Public can view product images" on storage.objects;
drop policy if exists "Users can upload own product images" on storage.objects;
drop policy if exists "Users can update own product images" on storage.objects;
drop policy if exists "Users can delete own product images" on storage.objects;

create policy "Public can read published products" on public.products for select using (published = true);
create policy "Users can create own seller profile" on public.sellers for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own seller profile" on public.sellers for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can read own seller profile" on public.sellers for select to authenticated using (auth.uid() = user_id);

create or replace view public.seller_public_profiles
with (security_invoker = false)
as select id, store_name, first_name, last_name, whatsapp, address, description, image_url
from public.sellers;
grant select on public.seller_public_profiles to anon, authenticated;
create policy "Users can create own products" on public.products for insert to authenticated with check (
  exists (select 1 from public.sellers where sellers.id = seller_id and sellers.user_id = auth.uid())
);
create policy "Users can update own products" on public.products for update to authenticated using (
  exists (select 1 from public.sellers where sellers.id = seller_id and sellers.user_id = auth.uid())
) with check (
  exists (select 1 from public.sellers where sellers.id = seller_id and sellers.user_id = auth.uid())
);
create policy "Users can delete own products" on public.products for delete to authenticated using (
  exists (select 1 from public.sellers where sellers.id = seller_id and sellers.user_id = auth.uid())
);

create policy "Public can view product images" on storage.objects for select
using (bucket_id = 'product-images');
create policy "Users can upload own product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = (
  select sellers.id::text from public.sellers where sellers.user_id = auth.uid()
));
create policy "Users can update own product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (
  select sellers.id::text from public.sellers where sellers.user_id = auth.uid()
));
create policy "Users can delete own product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (
  select sellers.id::text from public.sellers where sellers.user_id = auth.uid()
));

create policy "Public can view seller images" on storage.objects for select
using (bucket_id = 'seller-images');
create policy "Users can upload own seller image" on storage.objects for insert to authenticated
with check (bucket_id = 'seller-images' and (storage.foldername(name))[1] = (
  select sellers.id::text from public.sellers where sellers.user_id = auth.uid()
));
create policy "Users can update own seller image" on storage.objects for update to authenticated
using (bucket_id = 'seller-images' and (storage.foldername(name))[1] = (
  select sellers.id::text from public.sellers where sellers.user_id = auth.uid()
));