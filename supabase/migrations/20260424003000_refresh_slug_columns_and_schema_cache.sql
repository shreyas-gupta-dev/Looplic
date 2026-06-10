create extension if not exists unaccent;

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(unaccent(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g'));
$$;

alter table public.series
  add column if not exists slug text;

alter table public.models
  add column if not exists slug text;

update public.series
set slug = coalesce(nullif(public.slugify(name), ''), id::text)
where slug is null or slug = '';

update public.models
set slug = coalesce(nullif(public.slugify(name), ''), id::text)
where slug is null or slug = '';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'series'
      and column_name = 'slug'
  ) then
    execute 'alter table public.series alter column slug set not null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'models'
      and column_name = 'slug'
  ) then
    execute 'alter table public.models alter column slug set not null';
  end if;
end $$;

create unique index if not exists series_brand_slug_key on public.series (brand_id, slug);
create unique index if not exists models_series_slug_key on public.models (series_id, slug);

notify pgrst, 'reload schema';
