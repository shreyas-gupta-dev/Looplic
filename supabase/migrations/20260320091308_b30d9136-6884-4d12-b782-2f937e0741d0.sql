
-- Grant table access permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.screen_guard_categories TO authenticated;
GRANT SELECT ON public.screen_guard_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.screen_guard_types TO authenticated;
GRANT SELECT ON public.screen_guard_types TO anon;

-- Add image_url column to screen_guard_types
ALTER TABLE public.screen_guard_types ADD COLUMN image_url text;
