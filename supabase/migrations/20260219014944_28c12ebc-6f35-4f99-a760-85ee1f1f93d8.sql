
-- Add RAG quality monitoring fields to session_memory
ALTER TABLE public.session_memory
  ADD COLUMN IF NOT EXISTS retrieved_count   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_retrieved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS relevance_score   numeric,        -- avg similarity when retrieved
  ADD COLUMN IF NOT EXISTS feedback          smallint;       -- 1 = helpful, -1 = not helpful, NULL = no feedback

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_session_memory_retrieved_count ON public.session_memory(retrieved_count DESC);
CREATE INDEX IF NOT EXISTS idx_session_memory_feedback ON public.session_memory(feedback);

-- Function: increment retrieval counter and record similarity
CREATE OR REPLACE FUNCTION public.record_chunk_retrieval(
  p_chunk_ids   uuid[],
  p_similarities double precision[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i integer;
BEGIN
  FOR i IN 1..array_length(p_chunk_ids, 1) LOOP
    UPDATE public.session_memory
    SET
      retrieved_count   = retrieved_count + 1,
      last_retrieved_at = now(),
      relevance_score   = CASE
        WHEN relevance_score IS NULL THEN p_similarities[i]
        ELSE (relevance_score * retrieved_count + p_similarities[i]) / (retrieved_count + 1)
      END
    WHERE id = p_chunk_ids[i]
      AND user_id = auth.uid();
  END LOOP;
END;
$$;

-- Function: submit feedback for a chunk
CREATE OR REPLACE FUNCTION public.submit_chunk_feedback(
  p_chunk_id uuid,
  p_feedback  smallint  -- 1 or -1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.session_memory
  SET feedback = p_feedback
  WHERE id = p_chunk_id
    AND user_id = auth.uid();
END;
$$;

-- Function: get RAG analytics for all sessions of current user
CREATE OR REPLACE FUNCTION public.get_rag_analytics()
RETURNS TABLE(
  chunk_id          uuid,
  session_id        uuid,
  content_preview   text,
  chunk_type        text,
  retrieved_count   integer,
  relevance_score   numeric,
  feedback          smallint,
  last_retrieved_at timestamp with time zone,
  created_at        timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
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
    AND sm.retrieved_count > 0
  ORDER BY sm.retrieved_count DESC, sm.last_retrieved_at DESC
  LIMIT 200;
$$;
