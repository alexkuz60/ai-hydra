-- Add category column to custom_tools table
ALTER TABLE public.custom_tools 
ADD COLUMN category text NOT NULL DEFAULT 'general';

-- Add comment for documentation
COMMENT ON COLUMN public.custom_tools.category IS 'Tool category for grouping: general, data, integration, ai, automation, utility';