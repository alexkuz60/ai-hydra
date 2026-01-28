-- Add 'consultant' to the message_role enum
ALTER TYPE public.message_role ADD VALUE IF NOT EXISTS 'consultant';