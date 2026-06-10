alter table public.bookings
  add column if not exists manual_order boolean not null default false,
  add column if not exists order_source text not null default 'customer',
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists idx_bookings_manual_order on public.bookings(manual_order);
create index if not exists idx_bookings_created_by on public.bookings(created_by);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'Admins can create bookings'
  ) then
    create policy "Admins can create bookings"
    on public.bookings
    for insert
    to authenticated
    with check (public.has_role_name(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'Operations can create bookings'
  ) then
    create policy "Operations can create bookings"
    on public.bookings
    for insert
    to authenticated
    with check (public.has_role_name(auth.uid(), 'operation'));
  end if;
end $$;

grant insert on public.bookings to authenticated;
