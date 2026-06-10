alter table public.customer_profiles
  add column if not exists inspect_latitude numeric,
  add column if not exists inspect_longitude numeric;

notify pgrst, 'reload schema';
