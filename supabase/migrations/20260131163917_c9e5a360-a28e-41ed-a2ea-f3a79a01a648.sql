-- Add Groq vault_id column to user_api_keys
ALTER TABLE public.user_api_keys 
ADD COLUMN IF NOT EXISTS groq_vault_id UUID;

-- Update get_my_api_key_status to include Groq
DROP FUNCTION IF EXISTS public.get_my_api_key_status();

CREATE OR REPLACE FUNCTION public.get_my_api_key_status()
RETURNS TABLE (
  has_openai BOOLEAN,
  has_gemini BOOLEAN,
  has_anthropic BOOLEAN,
  has_xai BOOLEAN,
  has_openrouter BOOLEAN,
  has_groq BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (k.openai_vault_id IS NOT NULL) AS has_openai,
    (k.gemini_vault_id IS NOT NULL) AS has_gemini,
    (k.anthropic_vault_id IS NOT NULL) AS has_anthropic,
    (k.xai_vault_id IS NOT NULL) AS has_xai,
    (k.openrouter_vault_id IS NOT NULL) AS has_openrouter,
    (k.groq_vault_id IS NOT NULL) AS has_groq
  FROM public.user_api_keys k
  WHERE k.user_id = auth.uid();
END;
$$;

-- Update get_my_api_keys to include Groq
DROP FUNCTION IF EXISTS public.get_my_api_keys();

CREATE OR REPLACE FUNCTION public.get_my_api_keys()
RETURNS TABLE (
  openai_api_key TEXT,
  google_gemini_api_key TEXT,
  anthropic_api_key TEXT,
  xai_api_key TEXT,
  openrouter_api_key TEXT,
  groq_api_key TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_openai_id UUID;
  v_gemini_id UUID;
  v_anthropic_id UUID;
  v_xai_id UUID;
  v_openrouter_id UUID;
  v_groq_id UUID;
BEGIN
  SELECT openai_vault_id, gemini_vault_id, anthropic_vault_id, xai_vault_id, openrouter_vault_id, groq_vault_id
  INTO v_openai_id, v_gemini_id, v_anthropic_id, v_xai_id, v_openrouter_id, v_groq_id
  FROM public.user_api_keys
  WHERE user_id = auth.uid();

  RETURN QUERY SELECT
    CASE WHEN v_openai_id IS NOT NULL THEN public.get_decrypted_secret(v_openai_id) ELSE NULL END,
    CASE WHEN v_gemini_id IS NOT NULL THEN public.get_decrypted_secret(v_gemini_id) ELSE NULL END,
    CASE WHEN v_anthropic_id IS NOT NULL THEN public.get_decrypted_secret(v_anthropic_id) ELSE NULL END,
    CASE WHEN v_xai_id IS NOT NULL THEN public.get_decrypted_secret(v_xai_id) ELSE NULL END,
    CASE WHEN v_openrouter_id IS NOT NULL THEN public.get_decrypted_secret(v_openrouter_id) ELSE NULL END,
    CASE WHEN v_groq_id IS NOT NULL THEN public.get_decrypted_secret(v_groq_id) ELSE NULL END;
END;
$$;

-- Update save_api_key to handle Groq
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
  ELSIF p_provider = 'groq' THEN
    SELECT groq_vault_id INTO v_old_secret_id FROM public.user_api_keys WHERE user_id = v_user_id;
  ELSE
    RAISE EXCEPTION 'Unknown provider: %', p_provider;
  END IF;

  -- Delete old secret if exists
  IF v_old_secret_id IS NOT NULL THEN
    PERFORM public.delete_user_secret(v_old_secret_id::uuid);
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
    ELSIF p_provider = 'groq' THEN
      UPDATE public.user_api_keys SET groq_vault_id = NULL, updated_at = now() WHERE user_id = v_user_id;
    END IF;
    RETURN;
  END IF;

  -- Store new secret
  v_secret_id := public.store_user_secret(v_user_id, p_api_key, p_provider || '_api_key');

  -- Ensure user record exists
  INSERT INTO public.user_api_keys (user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;

  -- Update vault reference
  IF p_provider = 'openai' THEN
    UPDATE public.user_api_keys SET openai_vault_id = v_secret_id::uuid, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_provider = 'gemini' THEN
    UPDATE public.user_api_keys SET gemini_vault_id = v_secret_id::uuid, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_provider = 'anthropic' THEN
    UPDATE public.user_api_keys SET anthropic_vault_id = v_secret_id::uuid, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_provider = 'xai' THEN
    UPDATE public.user_api_keys SET xai_vault_id = v_secret_id::uuid, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_provider = 'openrouter' THEN
    UPDATE public.user_api_keys SET openrouter_vault_id = v_secret_id, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_provider = 'groq' THEN
    UPDATE public.user_api_keys SET groq_vault_id = v_secret_id::uuid, updated_at = now() WHERE user_id = v_user_id;
  END IF;
END;
$$;