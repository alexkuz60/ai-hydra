DROP FUNCTION IF EXISTS public.get_my_api_key_status();

CREATE OR REPLACE FUNCTION public.get_my_api_key_status()
 RETURNS TABLE(has_openai boolean, has_gemini boolean, has_anthropic boolean, has_xai boolean, has_openrouter boolean, has_groq boolean, has_tavily boolean, has_perplexity boolean, has_deepseek boolean, has_firecrawl boolean, has_mistral boolean, has_proxyapi boolean)
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
    (k.mistral_vault_id IS NOT NULL) AS has_mistral,
    (k.proxyapi_vault_id IS NOT NULL) AS has_proxyapi
  FROM public.user_api_keys k
  WHERE k.user_id = auth.uid();
END;
$function$;