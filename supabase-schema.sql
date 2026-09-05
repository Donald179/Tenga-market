create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  whatsapp text not null,
  store_name text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table public.products (
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

create policy "Public can read published products" on public.products for select using (published = true);
create policy "Users can create own seller profile" on public.sellers for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own seller profile" on public.sellers for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can read own seller profile" on public.sellers for select to authenticated using (auth.uid() = user_id);
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