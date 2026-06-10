do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'bookings'
      and policyname = 'Users can cancel own pending bookings'
  ) then
    create policy "Users can cancel own pending bookings"
    on public.bookings
    for update
    to authenticated
    using (
      user_id = auth.uid()
      and status = 'pending'
    )
    with check (
      user_id = auth.uid()
      and status in ('pending', 'cancelled')
    );
  end if;
end $$;
