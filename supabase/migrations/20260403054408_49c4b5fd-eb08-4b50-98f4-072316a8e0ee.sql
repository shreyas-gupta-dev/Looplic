
-- Add image_url to series
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS image_url text;

-- Add image_url to models
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS image_url text;

-- Add image_url to repair_categories
ALTER TABLE public.repair_categories ADD COLUMN IF NOT EXISTS image_url text;

-- Fix repair_categories RLS: drop and recreate the read policy to include anon
DROP POLICY IF EXISTS "Anyone can read repair_categories" ON public.repair_categories;
CREATE POLICY "Anyone can read repair_categories"
ON public.repair_categories
FOR SELECT
TO public
USING (true);

-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for service-images
CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

CREATE POLICY "Admins can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete service images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-images' AND public.has_role(auth.uid(), 'admin'));
