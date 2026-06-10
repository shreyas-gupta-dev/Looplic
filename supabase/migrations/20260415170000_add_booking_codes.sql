create sequence if not exists public.booking_code_seq;

alter table public.bookings
  add column if not exists booking_code text;

create or replace function public.generate_booking_code(service text)
returns text
language plpgsql
as $$
declare
  prefix text;
  next_number bigint;
begin
  prefix := case service
    when 'screen_guard' then 'LLSG'
    when 'mobile_repair' then 'LLMR'
    when 'laptop_repair' then 'LLLR'
    else 'LLBK'
  end;

  next_number := nextval('public.booking_code_seq');
  return prefix || lpad(next_number::text, 6, '0');
end;
$$;

create or replace function public.assign_booking_code()
returns trigger
language plpgsql
as $$
begin
  if new.booking_code is null or btrim(new.booking_code) = '' then
    new.booking_code := public.generate_booking_code(new.service_type);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_assign_booking_code on public.bookings;
create trigger trg_assign_booking_code
before insert on public.bookings
for each row
execute function public.assign_booking_code();

update public.bookings
set booking_code = public.generate_booking_code(service_type)
where booking_code is null or btrim(booking_code) = '';

create unique index if not exists idx_bookings_booking_code on public.bookings(booking_code);
