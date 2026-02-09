-- Fix get_my_api_keys: cast all vault IDs to UUID explicitly
CREATE OR REPLACE FUNCTION public.get_my_api_keys()
 RETURNS TABLE(openai_api_key text, google_gemini_api_key text, anthropic_api_key text, xai_api_key text, openrouter_api_key text, groq_api_key text, tavily_api_key text, perplexity_api_key text, deepseek_api_key text, firecrawl_api_key text, mistral_api_key text, proxyapi_api_key text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_openai_id text;
  v_gemini_id text;
  v_anthropic_id text;
  v_xai_id text;
  v_openrouter_id text;
  v_groq_id text;
  v_tavily_id text;
  v_perplexity_id text;
  v_deepseek_id text;
  v_firecrawl_id text;
  v_mistral_id text;
  v_proxyapi_id text;
BEGIN
  SELECT openai_vault_id::text, gemini_vault_id::text, anthropic_vault_id::text, xai_vault_id::text, 
         openrouter_vault_id::text, groq_vault_id::text, tavily_vault_id::text, perplexity_vault_id::text,
         deepseek_vault_id::text, firecrawl_vault_id::text, mistral_vault_id::text, proxyapi_vault_id::text
  INTO v_openai_id, v_gemini_id, v_anthropic_id, v_xai_id, 
       v_openrouter_id, v_groq_id, v_tavily_id, v_perplexity_id,
       v_deepseek_id, v_firecrawl_id, v_mistral_id, v_proxyapi_id
  FROM public.user_api_keys
  WHERE user_id = auth.uid();

  RETURN QUERY SELECT
    CASE WHEN v_openai_id IS NOT NULL THEN public.get_decrypted_secret(v_openai_id::uuid) ELSE NULL END,
    CASE WHEN v_gemini_id IS NOT NULL THEN public.get_decrypted_secret(v_gemini_id::uuid) ELSE NULL END,
    CASE WHEN v_anthropic_id IS NOT NULL THEN public.get_decrypted_secret(v_anthropic_id::uuid) ELSE NULL END,
    CASE WHEN v_xai_id IS NOT NULL THEN public.get_decrypted_secret(v_xai_id::uuid) ELSE NULL END,
    CASE WHEN v_openrouter_id IS NOT NULL THEN public.get_decrypted_secret(v_openrouter_id::uuid) ELSE NULL END,
    CASE WHEN v_groq_id IS NOT NULL THEN public.get_decrypted_secret(v_groq_id::uuid) ELSE NULL END,
    CASE WHEN v_tavily_id IS NOT NULL THEN public.get_decrypted_secret(v_tavily_id::uuid) ELSE NULL END,
    CASE WHEN v_perplexity_id IS NOT NULL THEN public.get_decrypted_secret(v_perplexity_id::uuid) ELSE NULL END,
    CASE WHEN v_deepseek_id IS NOT NULL THEN public.get_decrypted_secret(v_deepseek_id::uuid) ELSE NULL END,
    CASE WHEN v_firecrawl_id IS NOT NULL THEN public.get_decrypted_secret(v_firecrawl_id::uuid) ELSE NULL END,
    CASE WHEN v_mistral_id IS NOT NULL THEN public.get_decrypted_secret(v_mistral_id::uuid) ELSE NULL END,
    CASE WHEN v_proxyapi_id IS NOT NULL THEN public.get_decrypted_secret(v_proxyapi_id::uuid) ELSE NULL END;
END;
$function$;