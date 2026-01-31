-- Add OpenRouter vault column to user_api_keys
ALTER TABLE public.user_api_keys 
ADD COLUMN IF NOT EXISTS openrouter_vault_id TEXT;

-- Drop and recreate the get_my_api_key_status function with OpenRouter support
DROP FUNCTION IF EXISTS public.get_my_api_key_status();

CREATE OR REPLACE FUNCTION public.get_my_api_key_status()
RETURNS TABLE (
  has_openai BOOLEAN,
  has_gemini BOOLEAN,
  has_anthropic BOOLEAN,
  has_xai BOOLEAN,
  has_openrouter BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (uak.openai_vault_id IS NOT NULL) AS has_openai,
    (uak.gemini_vault_id IS NOT NULL) AS has_gemini,
    (uak.anthropic_vault_id IS NOT NULL) AS has_anthropic,
    (uak.xai_vault_id IS NOT NULL) AS has_xai,
    (uak.openrouter_vault_id IS NOT NULL) AS has_openrouter
  FROM public.user_api_keys uak
  WHERE uak.user_id = auth.uid();
END;
$$;

-- Update get_my_api_keys function to include OpenRouter
DROP FUNCTION IF EXISTS public.get_my_api_keys();

CREATE OR REPLACE FUNCTION public.get_my_api_keys()
RETURNS TABLE (
  openai_api_key TEXT,
  google_gemini_api_key TEXT,
  anthropic_api_key TEXT,
  xai_api_key TEXT,
  openrouter_api_key TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_openai_vault_id TEXT;
  v_gemini_vault_id TEXT;
  v_anthropic_vault_id TEXT;
  v_xai_vault_id TEXT;
  v_openrouter_vault_id TEXT;
BEGIN
  SELECT 
    uak.openai_vault_id,
    uak.gemini_vault_id,
    uak.anthropic_vault_id,
    uak.xai_vault_id,
    uak.openrouter_vault_id
  INTO 
    v_openai_vault_id,
    v_gemini_vault_id,
    v_anthropic_vault_id,
    v_xai_vault_id,
    v_openrouter_vault_id
  FROM public.user_api_keys uak
  WHERE uak.user_id = auth.uid();

  RETURN QUERY
  SELECT
    CASE WHEN v_openai_vault_id IS NOT NULL 
      THEN public.get_decrypted_secret(v_openai_vault_id) 
      ELSE NULL 
    END AS openai_api_key,
    CASE WHEN v_gemini_vault_id IS NOT NULL 
      THEN public.get_decrypted_secret(v_gemini_vault_id) 
      ELSE NULL 
    END AS google_gemini_api_key,
    CASE WHEN v_anthropic_vault_id IS NOT NULL 
      THEN public.get_decrypted_secret(v_anthropic_vault_id) 
      ELSE NULL 
    END AS anthropic_api_key,
    CASE WHEN v_xai_vault_id IS NOT NULL 
      THEN public.get_decrypted_secret(v_xai_vault_id) 
      ELSE NULL 
    END AS xai_api_key,
    CASE WHEN v_openrouter_vault_id IS NOT NULL 
      THEN public.get_decrypted_secret(v_openrouter_vault_id) 
      ELSE NULL 
    END AS openrouter_api_key;
END;
$$;

-- Update save_api_key function to handle OpenRouter
DROP FUNCTION IF EXISTS public.save_api_key(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.save_api_key(p_api_key TEXT, p_provider TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_secret_id TEXT;
  v_old_secret_id TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get old secret ID if exists
  IF p_provider = 'openai' THEN
    SELECT openai_vault_id INTO v_old_secret_id FROM public.user_api_keys WHERE user_id = v_user_id;
  ELSIF p_provider = 'gemini' THEN
    SELECT gemini_vault_id INTO v_old_secret_id FROM public.user_api_keys WHERE user_id = v_user_id;
  ELSIF p_provider = 'anthropic' THEN
    SELECT anthropic_vault_id INTO v_old_secret_id FROM public.user_api_keys WHERE user_id = v_user_id;
  ELSIF p_provider = 'xai' THEN
    SELECT xai_vault_id INTO v_old_secret_id FROM public.user_api_keys WHERE user_id = v_user_id;
  ELSIF p_provider = 'openrouter' THEN
    SELECT openrouter_vault_id INTO v_old_secret_id FROM public.user_api_keys WHERE user_id = v_user_id;
  ELSE
    RAISE EXCEPTION 'Unknown provider: %', p_provider;
  END IF;

  -- Delete old secret if exists
  IF v_old_secret_id IS NOT NULL THEN
    PERFORM public.delete_user_secret(v_old_secret_id);
  END IF;

  -- Handle deletion (empty key)
  IF p_api_key IS NULL OR p_api_key = '' THEN
    IF p_provider = 'openai' THEN
      UPDATE public.user_api_keys SET openai_vault_id = NULL, updated_at = now() WHERE user_id = v_user_id;
    ELSIF p_provider = 'gemini' THEN
      UPDATE public.user_api_keys SET gemini_vault_id = NULL, updated_at = now() WHERE user_id = v_user_id;
    ELSIF p_provider = 'anthropic' THEN
      UPDATE public.user_api_keys SET anthropic_vault_id = NULL, updated_at = now() WHERE user_id = v_user_id;
    ELSIF p_provider = 'xai' THEN
      UPDATE public.user_api_keys SET xai_vault_id = NULL, updated_at = now() WHERE user_id = v_user_id;
    ELSIF p_provider = 'openrouter' THEN
      UPDATE public.user_api_keys SET openrouter_vault_id = NULL, updated_at = now() WHERE user_id = v_user_id;
    END IF;
    RETURN;
  END IF;

  -- Store new secret
  v_secret_id := public.store_user_secret(p_provider || '_api_key', p_api_key, v_user_id);

  -- Ensure user record exists
  INSERT INTO public.user_api_keys (user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;

  -- Update vault reference
  IF p_provider = 'openai' THEN
    UPDATE public.user_api_keys SET openai_vault_id = v_secret_id, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_provider = 'gemini' THEN
    UPDATE public.user_api_keys SET gemini_vault_id = v_secret_id, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_provider = 'anthropic' THEN
    UPDATE public.user_api_keys SET anthropic_vault_id = v_secret_id, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_provider = 'xai' THEN
    UPDATE public.user_api_keys SET xai_vault_id = v_secret_id, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_provider = 'openrouter' THEN
    UPDATE public.user_api_keys SET openrouter_vault_id = v_secret_id, updated_at = now() WHERE user_id = v_user_id;
  END IF;
END;
$$;