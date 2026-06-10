alter table public.technician_applications
  add column if not exists service_types text[] not null default array[
    'mobile_repair',
    'laptop_repair',
    'screen_guard',
    'desktop_assembly',
    'cctv',
    'it_support',
    'managed_it_services'
  ];

update public.technician_applications
set service_types = array[
  'mobile_repair',
  'laptop_repair',
  'screen_guard',
  'desktop_assembly',
  'cctv',
  'it_support',
  'managed_it_services'
]
where service_types is null or cardinality(service_types) = 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'technician_applications_service_types_not_empty'
  ) then
    alter table public.technician_applications
      add constraint technician_applications_service_types_not_empty
      check (cardinality(service_types) > 0);
  end if;
end $$;

create index if not exists idx_technician_applications_service_types
  on public.technician_applications using gin (service_types);
