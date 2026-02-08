-- Add mistral_vault_id column to user_api_keys
ALTER TABLE public.user_api_keys ADD COLUMN IF NOT EXISTS mistral_vault_id UUID;