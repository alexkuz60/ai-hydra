-- Add language column to prompt_library table
ALTER TABLE public.prompt_library
ADD COLUMN language TEXT DEFAULT 'auto' CHECK (language IN ('ru', 'en', 'auto'));

-- Update existing prompts to auto (will use detection)
UPDATE public.prompt_library SET language = 'auto' WHERE language IS NULL;