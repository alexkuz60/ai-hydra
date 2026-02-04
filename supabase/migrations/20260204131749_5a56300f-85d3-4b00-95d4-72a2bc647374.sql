-- Add DeepSeek vault column to user_api_keys
ALTER TABLE public.user_api_keys 
ADD COLUMN IF NOT EXISTS deepseek_vault_id uuid;

-- Drop existing functions to change return type
DROP FUNCTION IF EXISTS public.get_my_api_key_status();
DROP FUNCTION IF EXISTS public.get_my_api_keys();

-- Recreate get_my_api_key_status with DeepSeek
CREATE FUNCTION public.get_my_api_key_status()
 RETURNS TABLE(has_openai boolean, has_gemini boolean, has_anthropic boolean, has_xai boolean, has_openrouter boolean, has_groq boolean, has_tavily boolean, has_perplexity boolean, has_deepseek boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (k.openai_vault_id IS NOT NULL) AS has_openai,
    (k.gemini_vault_id IS NOT NULL) AS has_gemini,
    (k.anthropic_vault_id IS NOT NULL) AS has_anthropic,
    (k.xai_vault_id IS NOT NULL) AS has_xai,
    (k.openrouter_vault_id IS NOT NULL) AS has_openrouter,
    (k.groq_vault_id IS NOT NULL) AS has_groq,
    (k.tavily_vault_id IS NOT NULL) AS has_tavily,
    (k.perplexity_vault_id IS NOT NULL) AS has_perplexity,
    (k.deepseek_vault_id IS NOT NULL) AS has_deepseek
  FROM public.user_api_keys k
  WHERE k.user_id = auth.uid();
END;
$function$;

-- Recreate get_my_api_keys with DeepSeek
CREATE FUNCTION public.get_my_api_keys()
 RETURNS TABLE(openai_api_key text, google_gemini_api_key text, anthropic_api_key text, xai_api_key text, openrouter_api_key text, groq_api_key text, tavily_api_key text, perplexity_api_key text, deepseek_api_key text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_openai_id UUID;
  v_gemini_id UUID;
  v_anthropic_id UUID;
  v_xai_id UUID;
  v_openrouter_id UUID;
  v_groq_id UUID;
  v_tavily_id UUID;
  v_perplexity_id UUID;
  v_deepseek_id UUID;
BEGIN
  SELECT openai_vault_id, gemini_vault_id, anthropic_vault_id, xai_vault_id, openrouter_vault_id, groq_vault_id, tavily_vault_id, perplexity_vault_id, deepseek_vault_id
  INTO v_openai_id, v_gemini_id, v_anthropic_id, v_xai_id, v_openrouter_id, v_groq_id, v_tavily_id, v_perplexity_id, v_deepseek_id
  FROM public.user_api_keys
  WHERE user_id = auth.uid();

  RETURN QUERY SELECT
    CASE WHEN v_openai_id IS NOT NULL THEN public.get_decrypted_secret(v_openai_id) ELSE NULL END,
    CASE WHEN v_gemini_id IS NOT NULL THEN public.get_decrypted_secret(v_gemini_id) ELSE NULL END,
    CASE WHEN v_anthropic_id IS NOT NULL THEN public.get_decrypted_secret(v_anthropic_id) ELSE NULL END,
    CASE WHEN v_xai_id IS NOT NULL THEN public.get_decrypted_secret(v_xai_id) ELSE NULL END,
    CASE WHEN v_openrouter_id IS NOT NULL THEN public.get_decrypted_secret(v_openrouter_id) ELSE NULL END,
    CASE WHEN v_groq_id IS NOT NULL THEN public.get_decrypted_secret(v_groq_id) ELSE NULL END,
    CASE WHEN v_tavily_id IS NOT NULL THEN public.get_decrypted_secret(v_tavily_id) ELSE NULL END,
    CASE WHEN v_perplexity_id IS NOT NULL THEN public.get_decrypted_secret(v_perplexity_id) ELSE NULL END,
    CASE WHEN v_deepseek_id IS NOT NULL THEN public.get_decrypted_secret(v_deepseek_id) ELSE NULL END;
END;
$function$;

-- Update save_api_key to handle DeepSeek
CREATE OR REPLACE FUNCTION public.save_api_key(p_api_key text, p_provider text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  ELSIF p_provider = 'tavily' THEN
    SELECT tavily_vault_id INTO v_old_secret_id FROM public.user_api_keys WHERE user_id = v_user_id;
  ELSIF p_provider = 'perplexity' THEN
    SELECT perplexity_vault_id INTO v_old_secret_id FROM public.user_api_keys WHERE user_id = v_user_id;
  ELSIF p_provider = 'deepseek' THEN
    SELECT deepseek_vault_id INTO v_old_secret_id FROM public.user_api_keys WHERE user_id = v_user_id;
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
    ELSIF p_provider = 'tavily' THEN
      UPDATE public.user_api_keys SET tavily_vault_id = NULL, updated_at = now() WHERE user_id = v_user_id;
    ELSIF p_provider = 'perplexity' THEN
      UPDATE public.user_api_keys SET perplexity_vault_id = NULL, updated_at = now() WHERE user_id = v_user_id;
    ELSIF p_provider = 'deepseek' THEN
      UPDATE public.user_api_keys SET deepseek_vault_id = NULL, updated_at = now() WHERE user_id = v_user_id;
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
  ELSIF p_provider = 'tavily' THEN
    UPDATE public.user_api_keys SET tavily_vault_id = v_secret_id::uuid, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_provider = 'perplexity' THEN
    UPDATE public.user_api_keys SET perplexity_vault_id = v_secret_id::uuid, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_provider = 'deepseek' THEN
    UPDATE public.user_api_keys SET deepseek_vault_id = v_secret_id::uuid, updated_at = now() WHERE user_id = v_user_id;
  END IF;
END;
$function$;