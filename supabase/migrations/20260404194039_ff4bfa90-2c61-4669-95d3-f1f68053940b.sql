
-- Create repair_subcategories table
CREATE TABLE public.repair_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.repair_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.repair_subcategories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read repair_subcategories" ON public.repair_subcategories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert repair_subcategories" ON public.repair_subcategories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update repair_subcategories" ON public.repair_subcategories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete repair_subcategories" ON public.repair_subcategories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Grants
GRANT SELECT ON public.repair_subcategories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_subcategories TO authenticated;

-- Add user_id to bookings for tracking
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add repair_subcategory_id to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS repair_subcategory_id uuid REFERENCES public.repair_subcategories(id) ON DELETE SET NULL;

-- Allow authenticated users to read their own bookings
CREATE POLICY "Users can read own bookings" ON public.bookings FOR SELECT TO authenticated USING (user_id = auth.uid());
