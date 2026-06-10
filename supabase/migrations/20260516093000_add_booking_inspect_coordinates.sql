alter table public.bookings
  add column if not exists inspect_latitude numeric,
  add column if not exists inspect_longitude numeric;

notify pgrst, 'reload schema';
