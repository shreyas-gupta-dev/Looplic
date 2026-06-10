do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'service_bills'
      and policyname = 'Customers can read own service_bills'
  ) then
    create policy "Customers can read own service_bills"
    on public.service_bills
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.bookings
        where bookings.id = service_bills.booking_id
          and bookings.user_id = auth.uid()
      )
    );
  end if;
end $$;
