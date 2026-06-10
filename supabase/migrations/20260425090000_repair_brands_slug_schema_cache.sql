alter table public.brands
  add column if not exists slug text;

update public.brands
set slug = coalesce(nullif(public.slugify(name), ''), id::text)
where slug is null or slug = '';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'brands'
      and column_name = 'slug'
  ) then
    execute 'alter table public.brands alter column slug set not null';
  end if;
end $$;

create unique index if not exists brands_slug_key on public.brands (slug);

notify pgrst, 'reload schema';
