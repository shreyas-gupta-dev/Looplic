alter type public.app_role add value if not exists 'operation';
alter type public.app_role add value if not exists 'technician';

alter table public.bookings
  add column if not exists assigned_rider text,
  add column if not exists assignment_notes text,
  add column if not exists assigned_at timestamptz;

create or replace function public.has_role_name(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role::text = _role
  )
$$;

create table if not exists public.service_bills (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  invoice_number text not null unique,
  customer_name text not null,
  customer_phone text,
  service_type text not null,
  repair_category_id uuid references public.repair_categories(id) on delete set null,
  repair_subcategory_id uuid references public.repair_subcategories(id) on delete set null,
  description text,
  amount numeric not null default 0,
  discount numeric not null default 0,
  tax numeric not null default 0,
  total_amount numeric generated always as (greatest(amount - discount + tax, 0)) stored,
  payment_status text not null default 'unpaid',
  payment_mode text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_inspections (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  technician_id uuid references auth.users(id) on delete set null,
  technician_name text,
  device_brand text,
  device_model text,
  reported_issue text,
  repair_category_id uuid references public.repair_categories(id) on delete set null,
  repair_subcategory_id uuid references public.repair_subcategories(id) on delete set null,
  issue_severity text,
  device_condition text,
  accessories_received text,
  customer_approval text not null default 'pending',
  pickup_required boolean not null default true,
  pickup_notes text,
  quote_amount numeric not null default 0,
  quote_notes text,
  status text not null default 'inspection',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.technician_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  city text,
  vehicle_type text,
  experience text,
  status text not null default 'pending',
  review_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_assigned_rider on public.bookings(assigned_rider);
create index if not exists idx_service_bills_booking_id on public.service_bills(booking_id);
create index if not exists idx_service_bills_payment_status on public.service_bills(payment_status);
create index if not exists idx_service_bills_created_at on public.service_bills(created_at);
create index if not exists idx_booking_inspections_booking_id on public.booking_inspections(booking_id);
create index if not exists idx_booking_inspections_technician_id on public.booking_inspections(technician_id);
create index if not exists idx_booking_inspections_status on public.booking_inspections(status);
create index if not exists idx_technician_applications_status on public.technician_applications(status);
create index if not exists idx_technician_applications_email on public.technician_applications(email);

create or replace function public.set_service_bills_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_service_bills_updated_at on public.service_bills;
create trigger trg_set_service_bills_updated_at
before update on public.service_bills
for each row
execute function public.set_service_bills_updated_at();

drop trigger if exists trg_set_booking_inspections_updated_at on public.booking_inspections;
create trigger trg_set_booking_inspections_updated_at
before update on public.booking_inspections
for each row
execute function public.set_service_bills_updated_at();

drop trigger if exists trg_set_technician_applications_updated_at on public.technician_applications;
create trigger trg_set_technician_applications_updated_at
before update on public.technician_applications
for each row
execute function public.set_service_bills_updated_at();

create or replace function public.generate_invoice_number()
returns trigger
language plpgsql
as $$
begin
  if new.invoice_number is null or new.invoice_number = '' then
    new.invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_generate_invoice_number on public.service_bills;
create trigger trg_generate_invoice_number
before insert on public.service_bills
for each row
execute function public.generate_invoice_number();

alter table public.service_bills enable row level security;
alter table public.booking_inspections enable row level security;
alter table public.technician_applications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'Operations can read bookings'
  ) then
    create policy "Operations can read bookings"
    on public.bookings
    for select
    to authenticated
    using (public.has_role_name(auth.uid(), 'operation'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'technician_applications' and policyname = 'Anyone can apply as technician'
  ) then
    create policy "Anyone can apply as technician"
    on public.technician_applications
    for insert
    to anon, authenticated
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'technician_applications' and policyname = 'Admins can manage technician applications'
  ) then
    create policy "Admins can manage technician applications"
    on public.technician_applications
    for all
    to authenticated
    using (public.has_role_name(auth.uid(), 'admin'))
    with check (public.has_role_name(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'technician_applications' and policyname = 'Operations can manage technician applications'
  ) then
    create policy "Operations can manage technician applications"
    on public.technician_applications
    for all
    to authenticated
    using (public.has_role_name(auth.uid(), 'operation'))
    with check (public.has_role_name(auth.uid(), 'operation'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'technician_applications' and policyname = 'Applicants can read own application'
  ) then
    create policy "Applicants can read own application"
    on public.technician_applications
    for select
    to authenticated
    using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'Technicians can read assigned bookings'
  ) then
    create policy "Technicians can read assigned bookings"
    on public.bookings
    for select
    to authenticated
    using (public.has_role_name(auth.uid(), 'technician'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'Technicians can update assigned bookings'
  ) then
    create policy "Technicians can update assigned bookings"
    on public.bookings
    for update
    to authenticated
    using (public.has_role_name(auth.uid(), 'technician'))
    with check (public.has_role_name(auth.uid(), 'technician'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'Operations can update bookings'
  ) then
    create policy "Operations can update bookings"
    on public.bookings
    for update
    to authenticated
    using (public.has_role_name(auth.uid(), 'operation'))
    with check (public.has_role_name(auth.uid(), 'operation'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'service_bills' and policyname = 'Technicians can manage service_bills'
  ) then
    create policy "Technicians can manage service_bills"
    on public.service_bills
    for all
    to authenticated
    using (public.has_role_name(auth.uid(), 'technician'))
    with check (public.has_role_name(auth.uid(), 'technician'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'booking_inspections' and policyname = 'Admins can manage booking_inspections'
  ) then
    create policy "Admins can manage booking_inspections"
    on public.booking_inspections
    for all
    to authenticated
    using (public.has_role_name(auth.uid(), 'admin'))
    with check (public.has_role_name(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'booking_inspections' and policyname = 'Operations can manage booking_inspections'
  ) then
    create policy "Operations can manage booking_inspections"
    on public.booking_inspections
    for all
    to authenticated
    using (public.has_role_name(auth.uid(), 'operation'))
    with check (public.has_role_name(auth.uid(), 'operation'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'booking_inspections' and policyname = 'Technicians can manage booking_inspections'
  ) then
    create policy "Technicians can manage booking_inspections"
    on public.booking_inspections
    for all
    to authenticated
    using (public.has_role_name(auth.uid(), 'technician'))
    with check (public.has_role_name(auth.uid(), 'technician'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'service_bills' and policyname = 'Admins can manage service_bills'
  ) then
    create policy "Admins can manage service_bills"
    on public.service_bills
    for all
    to authenticated
    using (public.has_role_name(auth.uid(), 'admin'))
    with check (public.has_role_name(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'service_bills' and policyname = 'Operations can manage service_bills'
  ) then
    create policy "Operations can manage service_bills"
    on public.service_bills
    for all
    to authenticated
    using (public.has_role_name(auth.uid(), 'operation'))
    with check (public.has_role_name(auth.uid(), 'operation'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Operations can read own role'
  ) then
    create policy "Operations can read own role"
    on public.user_roles
    for select
    to authenticated
    using (user_id = auth.uid() and role::text = 'operation');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Technicians can read own role'
  ) then
    create policy "Technicians can read own role"
    on public.user_roles
    for select
    to authenticated
    using (user_id = auth.uid() and role::text = 'technician');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Admins can assign roles'
  ) then
    create policy "Admins can assign roles"
    on public.user_roles
    for insert
    to authenticated
    with check (public.has_role_name(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Operations can assign technician roles'
  ) then
    create policy "Operations can assign technician roles"
    on public.user_roles
    for insert
    to authenticated
    with check (public.has_role_name(auth.uid(), 'operation') and role::text = 'technician');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Admins can remove roles'
  ) then
    create policy "Admins can remove roles"
    on public.user_roles
    for delete
    to authenticated
    using (public.has_role_name(auth.uid(), 'admin'));
  end if;
end $$;

grant select, insert, update, delete on public.service_bills to authenticated;
grant select, insert, update, delete on public.booking_inspections to authenticated;
grant select, insert, update, delete on public.technician_applications to authenticated;
grant insert on public.technician_applications to anon;
grant insert, delete on public.user_roles to authenticated;
grant select, update on public.bookings to authenticated;
