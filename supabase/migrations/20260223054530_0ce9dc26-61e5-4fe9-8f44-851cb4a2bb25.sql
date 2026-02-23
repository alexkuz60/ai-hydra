-- Add source_title_en column for bilingual knowledge display
ALTER TABLE public.role_knowledge ADD COLUMN IF NOT EXISTS source_title_en text;