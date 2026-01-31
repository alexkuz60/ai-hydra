-- Fix the save_api_key function - correct parameter order for store_user_secret
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
    END IF;
    RETURN;
  END IF;

  -- Store new secret - FIXED: correct parameter order (user_id, secret_value, secret_name)
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
  END IF;
END;
$$;