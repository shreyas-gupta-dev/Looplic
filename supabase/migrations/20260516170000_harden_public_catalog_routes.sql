alter table if exists public.brands enable row level security;
alter table if exists public.series enable row level security;
alter table if exists public.models enable row level security;
alter table if exists public.repair_categories enable row level security;
alter table if exists public.repair_subcategories enable row level security;

grant select on public.brands to anon, authenticated;
grant select on public.series to anon, authenticated;
grant select on public.models to anon, authenticated;
grant select on public.repair_categories to anon, authenticated;
grant select on public.repair_subcategories to anon, authenticated;

drop policy if exists "Anyone can read brands" on public.brands;
create policy "Anyone can read brands"
on public.brands
for select
to public
using (true);

drop policy if exists "Anyone can read series" on public.series;
create policy "Anyone can read series"
on public.series
for select
to public
using (true);

drop policy if exists "Anyone can read models" on public.models;
create policy "Anyone can read models"
on public.models
for select
to public
using (true);

drop policy if exists "Anyone can read repair_categories" on public.repair_categories;
create policy "Anyone can read repair_categories"
on public.repair_categories
for select
to public
using (true);

drop policy if exists "Anyone can read repair_subcategories" on public.repair_subcategories;
create policy "Anyone can read repair_subcategories"
on public.repair_subcategories
for select
to public
using (true);

update public.brands
set slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
where slug is null or btrim(slug) = '';

update public.series
set slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
where slug is null or btrim(slug) = '';

update public.models
set slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
where slug is null or btrim(slug) = '';

insert into public.repair_categories (id, name, service_type)
values
  ('d6a53ed0-b18c-46e4-8382-e6320f0a13b8', 'Battery', 'mobile'),
  ('b88532a2-198c-4489-938f-2dbf7b219075', 'Body', 'mobile'),
  ('f6f8a8a6-8867-4bf6-b73b-95e4c9b1618a', 'Camera', 'mobile'),
  ('2d3bd55b-8e05-4ad1-b78e-e8a76712ce35', 'Motherboard', 'mobile'),
  ('1dab65b6-cae3-485c-b231-4b551bc0fc43', 'Other Service', 'mobile'),
  ('a46f9cf5-c005-48c3-8672-3d097587e6fb', 'Screen', 'mobile'),
  ('c0ac6c43-850e-468e-befb-a1ee5a7ed063', 'Sensor', 'mobile'),
  ('32235a1e-52c7-44fc-8858-a448909b7ce9', 'Sound', 'mobile')
on conflict (id) do update
set name = excluded.name,
    service_type = excluded.service_type;

insert into public.repair_subcategories (id, category_id, name, price)
values
  ('1b078b94-bff1-4b7f-bc04-ac0fb2202630', 'b88532a2-198c-4489-938f-2dbf7b219075', 'Body Housing Replacement', 999),
  ('eeee700f-0d87-4ffe-b751-70226ed41434', 'a46f9cf5-c005-48c3-8672-3d097587e6fb', 'Back Glass Replacement', 199),
  ('8b220074-d814-47b8-ae20-c0c446744e94', 'a46f9cf5-c005-48c3-8672-3d097587e6fb', 'Screen Replacement', 999),
  ('c342e8e5-de15-4854-95cd-330c77b09257', 'a46f9cf5-c005-48c3-8672-3d097587e6fb', 'Glass Replacement', 699),
  ('a55f00fe-1686-425d-88b3-07c18622569c', 'd6a53ed0-b18c-46e4-8382-e6320f0a13b8', 'Battery Replacement', 599),
  ('09327a68-3e62-4870-973d-625e5f0f6d11', 'd6a53ed0-b18c-46e4-8382-e6320f0a13b8', 'Backup Issue', 299)
on conflict (id) do update
set category_id = excluded.category_id,
    name = excluded.name,
    price = excluded.price;

notify pgrst, 'reload schema';
