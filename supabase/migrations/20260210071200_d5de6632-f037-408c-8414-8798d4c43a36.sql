
-- ═══════════════════════════════════════════
-- Guide Tours system tables
-- ═══════════════════════════════════════════

-- 1. Tours
CREATE TABLE public.guide_tours (
  id text NOT NULL PRIMARY KEY,
  title_ru text NOT NULL,
  title_en text NOT NULL,
  description_ru text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Compass',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guide_tours ENABLE ROW LEVEL SECURITY;

-- Public read for all authenticated users
CREATE POLICY "Anyone can view active tours"
  ON public.guide_tours FOR SELECT
  USING (is_active = true);

-- Only admins/supervisors can manage
CREATE POLICY "Admins can insert tours"
  ON public.guide_tours FOR INSERT
  WITH CHECK (public.is_admin_or_supervisor(auth.uid()));

CREATE POLICY "Admins can update tours"
  ON public.guide_tours FOR UPDATE
  USING (public.is_admin_or_supervisor(auth.uid()));

CREATE POLICY "Admins can delete tours"
  ON public.guide_tours FOR DELETE
  USING (public.is_admin_or_supervisor(auth.uid()));

-- 2. Tour Steps
CREATE TABLE public.guide_tour_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id text NOT NULL REFERENCES public.guide_tours(id) ON DELETE CASCADE,
  step_index integer NOT NULL,
  selector text NOT NULL,
  route text,
  placement text NOT NULL DEFAULT 'bottom',
  title_ru text NOT NULL,
  title_en text NOT NULL,
  description_ru text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  delay_ms integer,
  action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tour_id, step_index)
);

ALTER TABLE public.guide_tour_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tour steps"
  ON public.guide_tour_steps FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert steps"
  ON public.guide_tour_steps FOR INSERT
  WITH CHECK (public.is_admin_or_supervisor(auth.uid()));

CREATE POLICY "Admins can update steps"
  ON public.guide_tour_steps FOR UPDATE
  USING (public.is_admin_or_supervisor(auth.uid()));

CREATE POLICY "Admins can delete steps"
  ON public.guide_tour_steps FOR DELETE
  USING (public.is_admin_or_supervisor(auth.uid()));

-- 3. Panel Elements (UI explanations)
CREATE TABLE public.guide_panel_elements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id text NOT NULL REFERENCES public.guide_tours(id) ON DELETE CASCADE,
  step_index integer NOT NULL,
  element_id text NOT NULL,
  label_ru text NOT NULL,
  label_en text NOT NULL,
  description_ru text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  selector text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guide_panel_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view panel elements"
  ON public.guide_panel_elements FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert panel elements"
  ON public.guide_panel_elements FOR INSERT
  WITH CHECK (public.is_admin_or_supervisor(auth.uid()));

CREATE POLICY "Admins can update panel elements"
  ON public.guide_panel_elements FOR UPDATE
  USING (public.is_admin_or_supervisor(auth.uid()));

CREATE POLICY "Admins can delete panel elements"
  ON public.guide_panel_elements FOR DELETE
  USING (public.is_admin_or_supervisor(auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_guide_steps_tour ON public.guide_tour_steps(tour_id, step_index);
CREATE INDEX idx_guide_elements_tour_step ON public.guide_panel_elements(tour_id, step_index);
