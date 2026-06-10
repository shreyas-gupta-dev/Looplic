create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address text,
  city text,
  pincode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_customer_profiles_updated_at on public.customer_profiles;
create trigger set_customer_profiles_updated_at
before update on public.customer_profiles
for each row
execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customer_profiles' and policyname = 'Users can read own profile'
  ) then
    create policy "Users can read own profile"
    on public.customer_profiles
    for select
    to authenticated
    using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customer_profiles' and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
    on public.customer_profiles
    for insert
    to authenticated
    with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customer_profiles' and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
    on public.customer_profiles
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customer_profiles' and policyname = 'Admins can read customer profiles'
  ) then
    create policy "Admins can read customer profiles"
    on public.customer_profiles
    for select
    to authenticated
    using (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

grant select, insert, update on public.customer_profiles to authenticated;

alter table public.bookings
  add column if not exists location text,
  add column if not exists pincode text,
  add column if not exists service_type text not null default 'screen_guard',
  add column if not exists repair_category_id uuid references public.repair_categories(id) on delete set null,
  add column if not exists repair_subcategory_id uuid references public.repair_subcategories(id) on delete set null,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists scheduled_date date,
  add column if not exists time_slot text,
  add column if not exists status text not null default 'pending';

create index if not exists idx_bookings_user_id on public.bookings(user_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_scheduled_date on public.bookings(scheduled_date);

grant insert on public.bookings to anon, authenticated;
grant select, update, delete on public.bookings to authenticated;

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.bookings;
    exception
      when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.customer_profiles;
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;
