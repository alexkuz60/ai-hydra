
-- Add JSONB column for key metadata (added_at, expires_at per provider)
ALTER TABLE public.user_api_keys ADD COLUMN IF NOT EXISTS key_metadata jsonb DEFAULT '{}'::jsonb;

-- Update save_api_key to auto-set added_at timestamp
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
  v_vault_col TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate provider and get column name
  v_vault_col := p_provider || '_vault_id';
  IF p_provider NOT IN ('openai','gemini','anthropic','xai','openrouter','groq','tavily','perplexity','deepseek','firecrawl','mistral') THEN
    RAISE EXCEPTION 'Unknown provider: %', p_provider;
  END IF;

  -- Get old secret ID if exists
  EXECUTE format('SELECT %I FROM public.user_api_keys WHERE user_id = $1', v_vault_col)
    INTO v_old_secret_id USING v_user_id;

  -- Delete old secret if exists
  IF v_old_secret_id IS NOT NULL THEN
    PERFORM public.delete_user_secret(v_old_secret_id::uuid);
  END IF;

  -- Ensure user record exists
  INSERT INTO public.user_api_keys (user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;

  -- Handle deletion (empty key)
  IF p_api_key IS NULL OR p_api_key = '' THEN
    EXECUTE format('UPDATE public.user_api_keys SET %I = NULL, updated_at = now(), key_metadata = key_metadata - $1 WHERE user_id = $2', v_vault_col)
      USING p_provider, v_user_id;
    RETURN;
  END IF;

  -- Store new secret
  v_secret_id := public.store_user_secret(v_user_id, p_api_key, p_provider || '_api_key');

  -- Update vault reference and set added_at in metadata
  EXECUTE format(
    'UPDATE public.user_api_keys SET %I = $1, updated_at = now(), key_metadata = jsonb_set(COALESCE(key_metadata, ''{}''::jsonb), ARRAY[$2], jsonb_build_object(''added_at'', to_char(now(), ''YYYY-MM-DD"T"HH24:MI:SS"Z"''), ''expires_at'', COALESCE(key_metadata->$2->>''expires_at'', null)), true) WHERE user_id = $3',
    v_vault_col
  ) USING v_secret_id::uuid, p_provider, v_user_id;
END;
$function$;

-- RPC to update key expiration date
CREATE OR REPLACE FUNCTION public.set_api_key_expiration(p_provider text, p_expires_at text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.user_api_keys
  SET key_metadata = jsonb_set(
    COALESCE(key_metadata, '{}'::jsonb),
    ARRAY[p_provider, 'expires_at'],
    CASE WHEN p_expires_at IS NULL OR p_expires_at = '' THEN 'null'::jsonb ELSE to_jsonb(p_expires_at) END,
    true
  ),
  updated_at = now()
  WHERE user_id = v_user_id;
END;
$function$;

-- RPC to get key metadata
CREATE OR REPLACE FUNCTION public.get_my_key_metadata()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT COALESCE(key_metadata, '{}'::jsonb) INTO v_result
  FROM public.user_api_keys
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$function$;
