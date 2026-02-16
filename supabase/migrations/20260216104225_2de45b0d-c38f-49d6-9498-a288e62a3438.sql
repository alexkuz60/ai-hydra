-- Add new technical staff roles to message_role enum
ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'technocritic';
ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'technoarbiter';
ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'technomoderator';
