create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('repair_subcategory_prices', '{"visible": true}'::jsonb)
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

grant select on public.app_settings to anon, authenticated;
grant insert, update on public.app_settings to authenticated;

create or replace function public.set_app_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_app_settings_updated_at on public.app_settings;
create trigger trg_set_app_settings_updated_at
before update on public.app_settings
for each row
execute function public.set_app_settings_updated_at();

drop policy if exists "Anyone can read app settings" on public.app_settings;
create policy "Anyone can read app settings"
on public.app_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Staff can insert app settings" on public.app_settings;
create policy "Staff can insert app settings"
on public.app_settings
for insert
to authenticated
with check (
  public.has_role_name(auth.uid(), 'admin')
  or public.has_role_name(auth.uid(), 'operation')
);

drop policy if exists "Staff can update app settings" on public.app_settings;
create policy "Staff can update app settings"
on public.app_settings
for update
to authenticated
using (
  public.has_role_name(auth.uid(), 'admin')
  or public.has_role_name(auth.uid(), 'operation')
)
with check (
  public.has_role_name(auth.uid(), 'admin')
  or public.has_role_name(auth.uid(), 'operation')
);

alter table public.model_repair_subcategory_prices
drop column if exists price_visible;
