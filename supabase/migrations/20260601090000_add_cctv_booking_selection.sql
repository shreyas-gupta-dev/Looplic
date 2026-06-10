alter table public.bookings
  add column if not exists cctv_service text,
  add column if not exists cctv_brand text;

create index if not exists idx_bookings_cctv_service on public.bookings(cctv_service);
create index if not exists idx_bookings_cctv_brand on public.bookings(cctv_brand);
