drop index if exists public.brands_slug_key;

create unique index if not exists brands_service_type_slug_key
  on public.brands (service_type, slug);

update public.brands
set service_type = 'laptop'
where lower(name) in (
  'acer',
  'alienware',
  'asus',
  'avita',
  'dell',
  'gigabyte',
  'hp',
  'lenovo',
  'microsoft',
  'msi',
  'razer'
);

insert into public.brands (name, slug, letter, gradient, service_type, sort_order)
values
  ('Dell', 'dell', 'D', 'from-sky-500 to-blue-600', 'laptop', 1),
  ('HP', 'hp', 'HP', 'from-indigo-500 to-sky-500', 'laptop', 2),
  ('Lenovo', 'lenovo', 'L', 'from-red-500 to-rose-600', 'laptop', 3),
  ('Asus', 'asus', 'A', 'from-blue-600 to-indigo-700', 'laptop', 4),
  ('Acer', 'acer', 'A', 'from-emerald-500 to-lime-600', 'laptop', 5),
  ('MSI', 'msi', 'M', 'from-red-600 to-zinc-900', 'laptop', 6),
  ('Apple', 'apple', 'A', 'from-gray-700 to-gray-900', 'laptop', 7),
  ('Microsoft', 'microsoft', 'M', 'from-sky-600 to-cyan-500', 'laptop', 8),
  ('Samsung', 'samsung', 'S', 'from-blue-500 to-blue-700', 'laptop', 9),
  ('Razer', 'razer', 'R', 'from-lime-500 to-green-700', 'laptop', 10)
on conflict (service_type, slug) do nothing;

notify pgrst, 'reload schema';
