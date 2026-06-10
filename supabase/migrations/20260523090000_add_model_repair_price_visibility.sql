alter table public.model_repair_subcategory_prices
add column if not exists price_visible boolean not null default true;

update public.model_repair_subcategory_prices
set price_visible = true
where price_visible is null;
