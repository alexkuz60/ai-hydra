
-- Drop functions that change return type
DROP FUNCTION IF EXISTS public.get_my_api_keys();
DROP FUNCTION IF EXISTS public.get_my_api_key_status();

-- Recreate get_my_api_keys with mistral
CREATE OR REPLACE FUNCTION public.get_my_api_keys()
 RETURNS TABLE(openai_api_key text, google_gemini_api_key text, anthropic_api_key text, xai_api_key text, openrouter_api_key text, groq_api_key text, tavily_api_key text, perplexity_api_key text, deepseek_api_key text, firecrawl_api_key text, mistral_api_key text)
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
  v_firecrawl_id UUID;
  v_mistral_id UUID;
BEGIN
  SELECT openai_vault_id, gemini_vault_id, anthropic_vault_id, xai_vault_id, openrouter_vault_id, groq_vault_id, tavily_vault_id, perplexity_vault_id, deepseek_vault_id, firecrawl_vault_id, mistral_vault_id
  INTO v_openai_id, v_gemini_id, v_anthropic_id, v_xai_id, v_openrouter_id, v_groq_id, v_tavily_id, v_perplexity_id, v_deepseek_id, v_firecrawl_id, v_mistral_id
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
    CASE WHEN v_mistral_id IS NOT NULL THEN public.get_decrypted_secret(v_mistral_id) ELSE NULL END;
END;
$function$;

-- Recreate get_my_api_key_status with mistral
CREATE OR REPLACE FUNCTION public.get_my_api_key_status()
 RETURNS TABLE(has_openai boolean, has_gemini boolean, has_anthropic boolean, has_xai boolean, has_openrouter boolean, has_groq boolean, has_tavily boolean, has_perplexity boolean, has_deepseek boolean, has_firecrawl boolean, has_mistral boolean)
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
    (k.deepseek_vault_id IS NOT NULL) AS has_deepseek,
    (k.firecrawl_vault_id IS NOT NULL) AS has_firecrawl,
    (k.mistral_vault_id IS NOT NULL) AS has_mistral
  FROM public.user_api_keys k
  WHERE k.user_id = auth.uid();
END;
$function$;
