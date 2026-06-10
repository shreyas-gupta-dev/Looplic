
-- Grant required table privileges (RLS still enforces row-level access)
grant usage on schema public to anon, authenticated;

grant select on table public.brands, public.series, public.models, public.model_screen_guards to anon, authenticated;

grant insert on table public.bookings to anon, authenticated;
grant select, update, delete on table public.bookings to authenticated;

grant select on table public.user_roles to authenticated;

grant insert, update, delete on table public.brands, public.series, public.models, public.model_screen_guards to authenticated;
