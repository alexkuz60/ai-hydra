-- Add visionary and strategist to message_role enum
ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'visionary';
ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'strategist';