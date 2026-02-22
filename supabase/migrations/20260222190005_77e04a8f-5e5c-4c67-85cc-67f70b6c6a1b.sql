-- Add English translation column to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content_en text;