alter table public.bookings
  drop column if exists latitude,
  drop column if exists longitude;
