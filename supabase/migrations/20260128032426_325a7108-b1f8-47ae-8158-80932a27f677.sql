-- Add column to store translated reasoning text
ALTER TABLE public.messages 
ADD COLUMN reasoning_translated text DEFAULT NULL;