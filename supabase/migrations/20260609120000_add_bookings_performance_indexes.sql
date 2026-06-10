create index if not exists idx_bookings_service_type on public.bookings(service_type);
create index if not exists idx_bookings_created_at on public.bookings(created_at desc);
