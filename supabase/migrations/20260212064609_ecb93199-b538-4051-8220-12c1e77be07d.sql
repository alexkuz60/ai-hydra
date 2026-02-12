ALTER TABLE public.model_statistics
ADD COLUMN IF NOT EXISTS criteria_averages jsonb DEFAULT '{}'::jsonb;