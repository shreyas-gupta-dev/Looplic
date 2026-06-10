-- Add service_type to brands to differentiate mobile vs laptop brands
ALTER TABLE public.brands ADD COLUMN service_type text NOT NULL DEFAULT 'mobile';

-- Create repair categories table
CREATE TABLE public.repair_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  service_type text NOT NULL DEFAULT 'mobile',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create model repair services (links model to repair category with price)
CREATE TABLE public.model_repair_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  repair_category_id uuid NOT NULL REFERENCES public.repair_categories(id) ON DELETE CASCADE,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for repair_categories
CREATE POLICY "Anyone can read repair_categories" ON public.repair_categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert repair_categories" ON public.repair_categories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update repair_categories" ON public.repair_categories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete repair_categories" ON public.repair_categories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- RLS for model_repair_services
CREATE POLICY "Anyone can read model_repair_services" ON public.model_repair_services FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert model_repair_services" ON public.model_repair_services FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update model_repair_services" ON public.model_repair_services FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete model_repair_services" ON public.model_repair_services FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Add booking service_type to track which service the booking is for
ALTER TABLE public.bookings ADD COLUMN service_type text NOT NULL DEFAULT 'screen_guard';
ALTER TABLE public.bookings ADD COLUMN repair_category_id uuid REFERENCES public.repair_categories(id);

-- Insert default repair categories for mobile
INSERT INTO public.repair_categories (name, service_type) VALUES
  ('Screen Replacement', 'mobile'),
  ('Battery Replacement', 'mobile'),
  ('Charging Port Repair', 'mobile'),
  ('Speaker Repair', 'mobile'),
  ('Camera Repair', 'mobile'),
  ('Back Panel Replacement', 'mobile');

-- Insert default repair categories for laptop
INSERT INTO public.repair_categories (name, service_type) VALUES
  ('Screen Replacement', 'laptop'),
  ('Battery Replacement', 'laptop'),
  ('Keyboard Replacement', 'laptop'),
  ('Hinge Repair', 'laptop'),
  ('Motherboard Repair', 'laptop'),
  ('SSD/RAM Upgrade', 'laptop');