create or replace function public.generate_booking_code(service text)
returns text
language plpgsql
as $$
declare
  prefix text;
  next_number bigint;
begin
  prefix := case service
    when 'screen_guard' then 'SGLL'
    when 'mobile_repair' then 'MSLL'
    when 'laptop_repair' then 'LSLL'
    else 'BKLL'
  end;

  next_number := nextval('public.booking_code_seq');
  return prefix || lpad(next_number::text, 6, '0');
end;
$$;
