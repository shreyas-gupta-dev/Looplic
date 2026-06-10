
-- Create storage bucket for screen guard type images
INSERT INTO storage.buckets (id, name, public) VALUES ('guard-type-images', 'guard-type-images', true);

-- RLS policies for the bucket
CREATE POLICY "Anyone can view guard images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'guard-type-images');
CREATE POLICY "Admins can upload guard images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'guard-type-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete guard images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'guard-type-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
