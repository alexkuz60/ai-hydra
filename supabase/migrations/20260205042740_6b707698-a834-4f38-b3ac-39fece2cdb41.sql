-- Add missing roles to message_role enum
-- Current: user, assistant, critic, arbiter, consultant
-- Missing: moderator, advisor, archivist, analyst, webhunter, promptengineer, flowregulator, toolsmith

ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'advisor';
ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'archivist';
ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'analyst';
ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'webhunter';
ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'promptengineer';
ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'flowregulator';
ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'toolsmith';