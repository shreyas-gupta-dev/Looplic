alter table if exists public.repair_categories
  add column if not exists sort_order integer not null default 0;

alter table if exists public.repair_subcategories
  add column if not exists sort_order integer not null default 0;

with ranked as (
  select
    id,
    row_number() over (
      partition by service_type
      order by coalesce(nullif(sort_order, 0), 2147483647), name
    ) as position
  from public.repair_categories
)
update public.repair_categories as category
set sort_order = ranked.position
from ranked
where category.id = ranked.id;

with ranked as (
  select
    id,
    row_number() over (
      partition by category_id
      order by coalesce(nullif(sort_order, 0), 2147483647), name
    ) as position
  from public.repair_subcategories
)
update public.repair_subcategories as subcategory
set sort_order = ranked.position
from ranked
where subcategory.id = ranked.id;
