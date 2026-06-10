alter table public.bookings
  add column if not exists warranty_duration_value integer,
  add column if not exists warranty_duration_unit text,
  add column if not exists warranty_label text;

alter table public.booking_inspections
  add column if not exists warranty_duration_value integer,
  add column if not exists warranty_duration_unit text,
  add column if not exists warranty_label text;

alter table public.service_bills
  add column if not exists warranty_duration_value integer,
  add column if not exists warranty_duration_unit text,
  add column if not exists warranty_label text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_warranty_duration_valid'
  ) then
    alter table public.bookings
      add constraint bookings_warranty_duration_valid
      check (
        (warranty_duration_value is null and warranty_duration_unit is null)
        or (warranty_duration_value > 0 and warranty_duration_unit in ('days', 'months', 'years'))
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'booking_inspections_warranty_duration_valid'
  ) then
    alter table public.booking_inspections
      add constraint booking_inspections_warranty_duration_valid
      check (
        (warranty_duration_value is null and warranty_duration_unit is null)
        or (warranty_duration_value > 0 and warranty_duration_unit in ('days', 'months', 'years'))
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_bills_warranty_duration_valid'
  ) then
    alter table public.service_bills
      add constraint service_bills_warranty_duration_valid
      check (
        (warranty_duration_value is null and warranty_duration_unit is null)
        or (warranty_duration_value > 0 and warranty_duration_unit in ('days', 'months', 'years'))
      );
  end if;
end $$;
