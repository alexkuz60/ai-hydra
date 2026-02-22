
-- Add English translation columns to chronicles
ALTER TABLE public.chronicles
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS hypothesis_en text,
  ADD COLUMN IF NOT EXISTS supervisor_comment_en text,
  ADD COLUMN IF NOT EXISTS summary_en text;
