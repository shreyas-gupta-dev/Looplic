
create table public.screen_guard_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.screen_guard_types (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.screen_guard_categories(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- RLS for categories
create policy "Anyone can read categories" on public.screen_guard_categories for select to public using (true);
create policy "Admins can insert categories" on public.screen_guard_categories for insert to authenticated with check (has_role(auth.uid(), 'admin'));
create policy "Admins can update categories" on public.screen_guard_categories for update to authenticated using (has_role(auth.uid(), 'admin'));
create policy "Admins can delete categories" on public.screen_guard_categories for delete to authenticated using (has_role(auth.uid(), 'admin'));

-- RLS for types
create policy "Anyone can read types" on public.screen_guard_types for select to public using (true);
create policy "Admins can insert types" on public.screen_guard_types for insert to authenticated with check (has_role(auth.uid(), 'admin'));
create policy "Admins can update types" on public.screen_guard_types for update to authenticated using (has_role(auth.uid(), 'admin'));
create policy "Admins can delete types" on public.screen_guard_types for delete to authenticated using (has_role(auth.uid(), 'admin'));
