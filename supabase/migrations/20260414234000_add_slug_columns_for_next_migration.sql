create extension if not exists unaccent;

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(unaccent(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g'));
$$;

alter table public.brands
  add column if not exists slug text;

alter table public.series
  add column if not exists slug text;

alter table public.models
  add column if not exists slug text;

with ranked_brands as (
  select
    id,
    public.slugify(name) as base_slug,
    row_number() over (
      partition by public.slugify(name)
      order by created_at, id
    ) as slug_rank
  from public.brands
)
update public.brands as b
set slug = case
  when rb.slug_rank = 1 then rb.base_slug
  else rb.base_slug || '-' || rb.slug_rank
end
from ranked_brands as rb
where b.id = rb.id
  and (b.slug is null or b.slug = '');

with ranked_series as (
  select
    id,
    brand_id,
    public.slugify(name) as base_slug,
    row_number() over (
      partition by brand_id, public.slugify(name)
      order by created_at, id
    ) as slug_rank
  from public.series
)
update public.series as s
set slug = case
  when rs.slug_rank = 1 then rs.base_slug
  else rs.base_slug || '-' || rs.slug_rank
end
from ranked_series as rs
where s.id = rs.id
  and (s.slug is null or s.slug = '');

with ranked_models as (
  select
    id,
    series_id,
    public.slugify(name) as base_slug,
    row_number() over (
      partition by series_id, public.slugify(name)
      order by created_at, id
    ) as slug_rank
  from public.models
)
update public.models as m
set slug = case
  when rm.slug_rank = 1 then rm.base_slug
  else rm.base_slug || '-' || rm.slug_rank
end
from ranked_models as rm
where m.id = rm.id
  and (m.slug is null or m.slug = '');

update public.brands
set slug = id::text
where slug = '';

update public.series
set slug = id::text
where slug = '';

update public.models
set slug = id::text
where slug = '';

alter table public.brands
  alter column slug set not null;

alter table public.series
  alter column slug set not null;

alter table public.models
  alter column slug set not null;

create unique index if not exists brands_slug_key on public.brands (slug);
create unique index if not exists series_brand_slug_key on public.series (brand_id, slug);
create unique index if not exists models_series_slug_key on public.models (series_id, slug);

create or replace function public.set_entity_slug()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.name is distinct from old.name then
    new.slug := public.slugify(new.name);
  elsif new.slug is null or new.slug = '' then
    new.slug := public.slugify(new.name);
  end if;

  if new.slug is null or new.slug = '' then
    new.slug := new.id::text;
  end if;

  return new;
end;
$$;

drop trigger if exists set_brands_slug on public.brands;
create trigger set_brands_slug
before insert or update on public.brands
for each row
execute function public.set_entity_slug();

drop trigger if exists set_series_slug on public.series;
create trigger set_series_slug
before insert or update on public.series
for each row
execute function public.set_entity_slug();

drop trigger if exists set_models_slug on public.models;
create trigger set_models_slug
before insert or update on public.models
for each row
execute function public.set_entity_slug();
