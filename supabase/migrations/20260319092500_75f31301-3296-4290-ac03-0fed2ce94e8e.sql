
-- Create storage bucket for brand images
insert into storage.buckets (id, name, public) values ('brand-images', 'brand-images', true);

-- Allow anyone to view brand images
create policy "Anyone can view brand images" on storage.objects for select using (bucket_id = 'brand-images');

-- Allow authenticated admins to upload brand images
create policy "Admins can upload brand images" on storage.objects for insert to authenticated with check (bucket_id = 'brand-images' and public.has_role(auth.uid(), 'admin'));

-- Allow authenticated admins to delete brand images
create policy "Admins can delete brand images" on storage.objects for delete to authenticated using (bucket_id = 'brand-images' and public.has_role(auth.uid(), 'admin'));

-- Add image_url column to brands
alter table public.brands add column image_url text;
