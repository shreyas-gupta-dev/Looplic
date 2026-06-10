-- Fix GRANT permissions for repair_categories
GRANT SELECT ON public.repair_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_categories TO authenticated;

-- Fix GRANT permissions for model_repair_services
GRANT SELECT ON public.model_repair_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_repair_services TO authenticated;
