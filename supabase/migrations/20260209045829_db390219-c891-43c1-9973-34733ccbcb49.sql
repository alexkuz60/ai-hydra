
-- 1. Add missing column
ALTER TABLE public.user_api_keys ADD COLUMN IF NOT EXISTS proxyapi_vault_id text;

-- 2. Add proxyapi_priority to profiles if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS proxyapi_priority boolean NOT NULL DEFAULT false;

-- 3. Fix save_api_key: use store_user_secret to avoid vault permission issues
CREATE OR REPLACE FUNCTION public.save_api_key(p_provider text, p_api_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vault_col text;
  v_old_vault_id text;
  v_new_vault_id text;
  v_user_id uuid := auth.uid();
BEGIN
  v_vault_col := CASE p_provider
    WHEN 'openai' THEN 'openai_vault_id'
    WHEN 'gemini' THEN 'gemini_vault_id'
    WHEN 'anthropic' THEN 'anthropic_vault_id'
    WHEN 'xai' THEN 'xai_vault_id'
    WHEN 'openrouter' THEN 'openrouter_vault_id'
    WHEN 'groq' THEN 'groq_vault_id'
    WHEN 'tavily' THEN 'tavily_vault_id'
    WHEN 'perplexity' THEN 'perplexity_vault_id'
    WHEN 'deepseek' THEN 'deepseek_vault_id'
    WHEN 'firecrawl' THEN 'firecrawl_vault_id'
    WHEN 'mistral' THEN 'mistral_vault_id'
    WHEN 'proxyapi' THEN 'proxyapi_vault_id'
    ELSE NULL
  END;

  IF v_vault_col IS NULL THEN
    RAISE EXCEPTION 'Unknown provider: %', p_provider;
  END IF;

  -- Ensure row exists
  INSERT INTO public.user_api_keys (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get old vault id
  EXECUTE format('SELECT %I FROM public.user_api_keys WHERE user_id = $1', v_vault_col)
  INTO v_old_vault_id
  USING v_user_id;

  -- Delete old secret if exists
  IF v_old_vault_id IS NOT NULL THEN
    PERFORM public.delete_user_secret(v_old_vault_id);
  END IF;

  IF p_api_key IS NOT NULL AND p_api_key <> '' THEN
    -- Store new secret using existing secure helper
    v_new_vault_id := public.store_user_secret(v_user_id, p_provider || '_key_' || v_user_id, p_api_key);

    EXECUTE format('UPDATE public.user_api_keys SET %I = $1, updated_at = now() WHERE user_id = $2', v_vault_col)
    USING v_new_vault_id, v_user_id;

    -- Update metadata
    UPDATE public.user_api_keys
    SET key_metadata = jsonb_set(
      jsonb_set(
        COALESCE(key_metadata::jsonb, '{}'::jsonb),
        ARRAY[p_provider],
        COALESCE((key_metadata::jsonb -> p_provider), '{}'::jsonb) || jsonb_build_object('added_at', now()::text),
        true
      ),
      ARRAY[p_provider, 'added_at'],
      to_jsonb(COALESCE(
        (key_metadata::jsonb -> p_provider ->> 'added_at'),
        now()::text
      )),
      true
    )
    WHERE user_id = v_user_id;
  ELSE
    EXECUTE format('UPDATE public.user_api_keys SET %I = NULL, updated_at = now() WHERE user_id = $1', v_vault_col)
    USING v_user_id;

    UPDATE public.user_api_keys
    SET key_metadata = (COALESCE(key_metadata::jsonb, '{}'::jsonb) - p_provider)::json
    WHERE user_id = v_user_id;
  END IF;
END;
$$;

-- 4. Update get_my_api_keys to include proxyapi
DROP FUNCTION IF EXISTS public.get_my_api_keys();

CREATE FUNCTION public.get_my_api_keys()
RETURNS TABLE (
  openai_api_key text,
  google_gemini_api_key text,
  anthropic_api_key text,
  xai_api_key text,
  openrouter_api_key text,
  groq_api_key text,
  tavily_api_key text,
  perplexity_api_key text,
  deepseek_api_key text,
  firecrawl_api_key text,
  mistral_api_key text,
  proxyapi_api_key text
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
  v_openrouter_id text;
  v_groq_id UUID;
  v_tavily_id UUID;
  v_perplexity_id UUID;
  v_deepseek_id UUID;
  v_firecrawl_id UUID;
  v_mistral_id UUID;
  v_proxyapi_id text;
BEGIN
  SELECT openai_vault_id, gemini_vault_id, anthropic_vault_id, xai_vault_id, 
         openrouter_vault_id, groq_vault_id, tavily_vault_id, perplexity_vault_id,
         deepseek_vault_id, firecrawl_vault_id, mistral_vault_id, proxyapi_vault_id
  INTO v_openai_id, v_gemini_id, v_anthropic_id, v_xai_id, 
       v_openrouter_id, v_groq_id, v_tavily_id, v_perplexity_id,
       v_deepseek_id, v_firecrawl_id, v_mistral_id, v_proxyapi_id
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
    CASE WHEN v_deepseek_id IS NOT NULL THEN public.get_decrypted_secret(v_deepseek_id) ELSE NULL END,
    CASE WHEN v_firecrawl_id IS NOT NULL THEN public.get_decrypted_secret(v_firecrawl_id) ELSE NULL END,
    CASE WHEN v_mistral_id IS NOT NULL THEN public.get_decrypted_secret(v_mistral_id) ELSE NULL END,
    CASE WHEN v_proxyapi_id IS NOT NULL THEN public.get_decrypted_secret(v_proxyapi_id) ELSE NULL END;
END;
$$;
