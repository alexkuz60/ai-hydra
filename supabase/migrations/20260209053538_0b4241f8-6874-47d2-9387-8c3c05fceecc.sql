
CREATE OR REPLACE FUNCTION public.save_api_key(p_provider text, p_api_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_vault_col text;
  v_old_vault_id text;
  v_new_vault_id uuid;
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

  INSERT INTO public.user_api_keys (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  EXECUTE format('SELECT %I::text FROM public.user_api_keys WHERE user_id = $1', v_vault_col)
  INTO v_old_vault_id
  USING v_user_id;

  IF v_old_vault_id IS NOT NULL THEN
    PERFORM public.delete_user_secret(v_old_vault_id::uuid);
  END IF;

  IF p_api_key IS NOT NULL AND p_api_key <> '' THEN
    -- FIX: arguments were swapped! Correct order: user_id, secret_value (the key), secret_name (the label)
    v_new_vault_id := public.store_user_secret(v_user_id, p_api_key, p_provider || '_key_' || v_user_id);

    EXECUTE format('UPDATE public.user_api_keys SET %I = $1, updated_at = now() WHERE user_id = $2', v_vault_col)
    USING v_new_vault_id, v_user_id;

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
$function$;
