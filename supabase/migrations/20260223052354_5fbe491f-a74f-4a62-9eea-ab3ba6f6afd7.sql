-- Add English translation column for prompt content
ALTER TABLE public.prompt_library
ADD COLUMN content_en text NULL;