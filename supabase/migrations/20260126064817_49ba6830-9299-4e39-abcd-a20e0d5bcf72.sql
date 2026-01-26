-- Create helper functions for Vault operations
-- These functions will encrypt/decrypt user API keys using Supabase Vault

-- Function to store an encrypted secret and return the vault secret ID
CREATE OR REPLACE FUNCTION public.store_user_secret(
  p_user_id uuid,
  p_secret_value text,
  p_secret_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_id uuid;
  v_unique_name text;
BEGIN
  -- Generate unique name for this user's secret
  v_unique_name := p_user_id::text || '_' || p_secret_name;
  
  -- Check if secret already exists for this user
  SELECT id INTO v_secret_id
  FROM vault.secrets
  WHERE name = v_unique_name;
  
  IF v_secret_id IS NOT NULL THEN
    -- Update existing secret
    PERFORM vault.update_secret(v_secret_id, p_secret_value);
    RETURN v_secret_id;
  ELSE
    -- Create new secret
    SELECT vault.create_secret(p_secret_value, v_unique_name) INTO v_secret_id;
    RETURN v_secret_id;
  END IF;
END;
$$;

-- Function to retrieve a decrypted secret by its ID
CREATE OR REPLACE FUNCTION public.get_decrypted_secret(p_secret_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_decrypted text;
BEGIN
  SELECT decrypted_secret INTO v_decrypted
  FROM vault.decrypted_secrets
  WHERE id = p_secret_id;
  
  RETURN v_decrypted;
END;
$$;

-- Function to delete a secret from the vault
CREATE OR REPLACE FUNCTION public.delete_user_secret(p_secret_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM vault.secrets WHERE id = p_secret_id;
END;
$$;

-- Modify user_api_keys table to store vault secret IDs instead of plain text keys
-- First, add new columns for vault secret IDs
ALTER TABLE public.user_api_keys 
ADD COLUMN IF NOT EXISTS openai_vault_id uuid,
ADD COLUMN IF NOT EXISTS anthropic_vault_id uuid,
ADD COLUMN IF NOT EXISTS gemini_vault_id uuid;

-- Migrate existing plain text keys to vault (if any exist)
DO $$
DECLARE
  r RECORD;
  v_openai_id uuid;
  v_anthropic_id uuid;
  v_gemini_id uuid;
BEGIN
  FOR r IN SELECT * FROM public.user_api_keys WHERE openai_api_key IS NOT NULL OR anthropic_api_key IS NOT NULL OR google_gemini_api_key IS NOT NULL
  LOOP
    -- Migrate OpenAI key
    IF r.openai_api_key IS NOT NULL AND r.openai_api_key != '' THEN
      SELECT public.store_user_secret(r.user_id, r.openai_api_key, 'openai') INTO v_openai_id;
      UPDATE public.user_api_keys SET openai_vault_id = v_openai_id WHERE id = r.id;
    END IF;
    
    -- Migrate Anthropic key
    IF r.anthropic_api_key IS NOT NULL AND r.anthropic_api_key != '' THEN
      SELECT public.store_user_secret(r.user_id, r.anthropic_api_key, 'anthropic') INTO v_anthropic_id;
      UPDATE public.user_api_keys SET anthropic_vault_id = v_anthropic_id WHERE id = r.id;
    END IF;
    
    -- Migrate Gemini key
    IF r.google_gemini_api_key IS NOT NULL AND r.google_gemini_api_key != '' THEN
      SELECT public.store_user_secret(r.user_id, r.google_gemini_api_key, 'gemini') INTO v_gemini_id;
      UPDATE public.user_api_keys SET gemini_vault_id = v_gemini_id WHERE id = r.id;
    END IF;
  END LOOP;
END;
$$;

-- Drop old plain text columns (data is now safely in vault)
ALTER TABLE public.user_api_keys 
DROP COLUMN IF EXISTS openai_api_key,
DROP COLUMN IF EXISTS anthropic_api_key,
DROP COLUMN IF EXISTS google_gemini_api_key;

-- Create composite functions for the application to use

-- Function to save/update an API key for the current user
CREATE OR REPLACE FUNCTION public.save_api_key(
  p_provider text,
  p_api_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_vault_id uuid;
  v_column_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Determine which column to update
  CASE p_provider
    WHEN 'openai' THEN v_column_name := 'openai_vault_id';
    WHEN 'anthropic' THEN v_column_name := 'anthropic_vault_id';
    WHEN 'gemini' THEN v_column_name := 'gemini_vault_id';
    ELSE RAISE EXCEPTION 'Invalid provider: %', p_provider;
  END CASE;
  
  -- Ensure user_api_keys row exists
  INSERT INTO public.user_api_keys (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  IF p_api_key IS NULL OR p_api_key = '' THEN
    -- Delete the secret if key is empty
    EXECUTE format('
      UPDATE public.user_api_keys 
      SET %I = NULL, updated_at = now()
      WHERE user_id = $1
    ', v_column_name)
    USING v_user_id;
  ELSE
    -- Store encrypted key in vault
    v_vault_id := public.store_user_secret(v_user_id, p_api_key, p_provider);
    
    -- Update the reference
    EXECUTE format('
      UPDATE public.user_api_keys 
      SET %I = $1, updated_at = now()
      WHERE user_id = $2
    ', v_column_name)
    USING v_vault_id, v_user_id;
  END IF;
END;
$$;

-- Function to get decrypted API keys for the current user
CREATE OR REPLACE FUNCTION public.get_my_api_keys()
RETURNS TABLE(
  openai_api_key text,
  anthropic_api_key text,
  google_gemini_api_key text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_keys RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  SELECT 
    openai_vault_id,
    anthropic_vault_id,
    gemini_vault_id
  INTO v_keys
  FROM public.user_api_keys
  WHERE user_id = v_user_id;
  
  IF v_keys IS NULL THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT
    public.get_decrypted_secret(v_keys.openai_vault_id),
    public.get_decrypted_secret(v_keys.anthropic_vault_id),
    public.get_decrypted_secret(v_keys.gemini_vault_id);
END;
$$;

-- Function to check if user has API keys configured (without decrypting)
CREATE OR REPLACE FUNCTION public.get_my_api_key_status()
RETURNS TABLE(
  has_openai boolean,
  has_anthropic boolean,
  has_gemini boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  RETURN QUERY
  SELECT 
    openai_vault_id IS NOT NULL,
    anthropic_vault_id IS NOT NULL,
    gemini_vault_id IS NOT NULL
  FROM public.user_api_keys
  WHERE user_id = v_user_id;
  
  -- If no row exists, return all false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, false;
  END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.save_api_key(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_api_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_api_key_status() TO authenticated;