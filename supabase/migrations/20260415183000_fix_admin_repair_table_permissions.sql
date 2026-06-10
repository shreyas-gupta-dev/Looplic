alter table if exists public.repair_categories enable row level security;
alter table if exists public.model_repair_services enable row level security;
alter table if exists public.repair_subcategories enable row level security;

grant select on public.repair_categories to anon;
grant select, insert, update, delete on public.repair_categories to authenticated;

grant select on public.model_repair_services to anon;
grant select, insert, update, delete on public.model_repair_services to authenticated;

grant select on public.repair_subcategories to anon;
grant select, insert, update, delete on public.repair_subcategories to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'repair_categories' and policyname = 'Admins can insert repair_categories'
  ) then
    create policy "Admins can insert repair_categories"
    on public.repair_categories
    for insert
    to authenticated
    with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'repair_categories' and policyname = 'Admins can update repair_categories'
  ) then
    create policy "Admins can update repair_categories"
    on public.repair_categories
    for update
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'repair_categories' and policyname = 'Admins can delete repair_categories'
  ) then
    create policy "Admins can delete repair_categories"
    on public.repair_categories
    for delete
    to authenticated
    using (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'model_repair_services' and policyname = 'Admins can insert model_repair_services'
  ) then
    create policy "Admins can insert model_repair_services"
    on public.model_repair_services
    for insert
    to authenticated
    with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'model_repair_services' and policyname = 'Admins can update model_repair_services'
  ) then
    create policy "Admins can update model_repair_services"
    on public.model_repair_services
    for update
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'model_repair_services' and policyname = 'Admins can delete model_repair_services'
  ) then
    create policy "Admins can delete model_repair_services"
    on public.model_repair_services
    for delete
    to authenticated
    using (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'repair_subcategories' and policyname = 'Admins can insert repair_subcategories'
  ) then
    create policy "Admins can insert repair_subcategories"
    on public.repair_subcategories
    for insert
    to authenticated
    with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'repair_subcategories' and policyname = 'Admins can update repair_subcategories'
  ) then
    create policy "Admins can update repair_subcategories"
    on public.repair_subcategories
    for update
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'repair_subcategories' and policyname = 'Admins can delete repair_subcategories'
  ) then
    create policy "Admins can delete repair_subcategories"
    on public.repair_subcategories
    for delete
    to authenticated
    using (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;
