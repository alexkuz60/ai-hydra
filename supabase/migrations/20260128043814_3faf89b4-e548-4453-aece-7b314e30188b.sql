-- Add xAI (Grok) API key support to user_api_keys table
ALTER TABLE public.user_api_keys 
ADD COLUMN IF NOT EXISTS xai_vault_id uuid;

-- Drop existing functions first to change return type
DROP FUNCTION IF EXISTS public.get_my_api_key_status();
DROP FUNCTION IF EXISTS public.get_my_api_keys();

-- Recreate get_my_api_key_status function with xAI support
CREATE FUNCTION public.get_my_api_key_status()
RETURNS TABLE(has_openai boolean, has_anthropic boolean, has_gemini boolean, has_xai boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    gemini_vault_id IS NOT NULL,
    xai_vault_id IS NOT NULL
  FROM public.user_api_keys
  WHERE user_id = v_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, false, false;
  END IF;
END;
$$;

-- Recreate get_my_api_keys function with xAI support
CREATE FUNCTION public.get_my_api_keys()
RETURNS TABLE(openai_api_key text, anthropic_api_key text, google_gemini_api_key text, xai_api_key text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    gemini_vault_id,
    xai_vault_id
  INTO v_keys
  FROM public.user_api_keys
  WHERE user_id = v_user_id;
  
  IF v_keys IS NULL THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT
    public.get_decrypted_secret(v_keys.openai_vault_id),
    public.get_decrypted_secret(v_keys.anthropic_vault_id),
    public.get_decrypted_secret(v_keys.gemini_vault_id),
    public.get_decrypted_secret(v_keys.xai_vault_id);
END;
$$;

-- Update save_api_key function to support xAI
CREATE OR REPLACE FUNCTION public.save_api_key(p_provider text, p_api_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_vault_id uuid;
  v_column_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  CASE p_provider
    WHEN 'openai' THEN v_column_name := 'openai_vault_id';
    WHEN 'anthropic' THEN v_column_name := 'anthropic_vault_id';
    WHEN 'gemini' THEN v_column_name := 'gemini_vault_id';
    WHEN 'xai' THEN v_column_name := 'xai_vault_id';
    ELSE RAISE EXCEPTION 'Invalid provider: %', p_provider;
  END CASE;
  
  INSERT INTO public.user_api_keys (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  IF p_api_key IS NULL OR p_api_key = '' THEN
    EXECUTE format('
      UPDATE public.user_api_keys 
      SET %I = NULL, updated_at = now()
      WHERE user_id = $1
    ', v_column_name)
    USING v_user_id;
  ELSE
    v_vault_id := public.store_user_secret(v_user_id, p_api_key, p_provider);
    
    EXECUTE format('
      UPDATE public.user_api_keys 
      SET %I = $1, updated_at = now()
      WHERE user_id = $2
    ', v_column_name)
    USING v_vault_id, v_user_id;
  END IF;
END;
$$;