-- A executer dans Supabase > SQL Editor
insert into storage.buckets (id, name, public)
values ('seller-images', 'seller-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view seller images" on storage.objects;
drop policy if exists "Users can upload own seller image" on storage.objects;
drop policy if exists "Users can update own seller image" on storage.objects;

create policy "Public can view seller images" on storage.objects for select
using (bucket_id = 'seller-images');

create policy "Users can upload own seller image" on storage.objects for insert to authenticated
with check (
  bucket_id = 'seller-images'
  and (storage.foldername(name))[1] = (
    select sellers.id::text from public.sellers where sellers.user_id = auth.uid()
  )
);

create policy "Users can update own seller image" on storage.objects for update to authenticated
using (
  bucket_id = 'seller-images'
  and (storage.foldername(name))[1] = (
    select sellers.id::text from public.sellers where sellers.user_id = auth.uid()
  )
);
