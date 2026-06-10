create table if not exists public.model_repair_subcategory_prices (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  repair_subcategory_id uuid not null references public.repair_subcategories(id) on delete cascade,
  price numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_id, repair_subcategory_id)
);

alter table public.model_repair_subcategory_prices enable row level security;

grant select on public.model_repair_subcategory_prices to anon, authenticated;
grant insert, update, delete on public.model_repair_subcategory_prices to authenticated;

drop policy if exists "Anyone can read model repair subcategory prices" on public.model_repair_subcategory_prices;
create policy "Anyone can read model repair subcategory prices"
on public.model_repair_subcategory_prices
for select
to anon, authenticated
using (true);

drop policy if exists "Staff can insert model repair subcategory prices" on public.model_repair_subcategory_prices;
create policy "Staff can insert model repair subcategory prices"
on public.model_repair_subcategory_prices
for insert
to authenticated
with check (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'operation')
);

drop policy if exists "Staff can update model repair subcategory prices" on public.model_repair_subcategory_prices;
create policy "Staff can update model repair subcategory prices"
on public.model_repair_subcategory_prices
for update
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'operation')
)
with check (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'operation')
);

drop policy if exists "Staff can delete model repair subcategory prices" on public.model_repair_subcategory_prices;
create policy "Staff can delete model repair subcategory prices"
on public.model_repair_subcategory_prices
for delete
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'operation')
);
