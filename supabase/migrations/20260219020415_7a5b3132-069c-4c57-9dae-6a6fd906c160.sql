
-- Fix get_rag_analytics to include chunks with feedback even if retrieved_count = 0
CREATE OR REPLACE FUNCTION public.get_rag_analytics()
RETURNS TABLE(
  chunk_id uuid,
  session_id uuid,
  content_preview text,
  chunk_type text,
  retrieved_count integer,
  relevance_score numeric,
  feedback smallint,
  last_retrieved_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    sm.id,
    sm.session_id,
    left(sm.content, 120) AS content_preview,
    sm.chunk_type,
    sm.retrieved_count,
    sm.relevance_score,
    sm.feedback,
    sm.last_retrieved_at,
    sm.created_at
  FROM public.session_memory sm
  WHERE sm.user_id = auth.uid()
    AND (sm.retrieved_count > 0 OR sm.feedback IS NOT NULL)
  ORDER BY sm.retrieved_count DESC, sm.last_retrieved_at DESC NULLS LAST
  LIMIT 200;
$function$;
