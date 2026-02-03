-- Create HNSW index for fast vector similarity search
-- Using cosine distance (most common for text embeddings)
CREATE INDEX idx_session_memory_embedding ON public.session_memory 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Create function for semantic search within a session
CREATE OR REPLACE FUNCTION public.search_session_memory(
  p_session_id uuid,
  p_query_embedding vector(1536),
  p_limit int DEFAULT 10,
  p_chunk_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  chunk_type text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id,
    sm.content,
    sm.chunk_type,
    sm.metadata,
    1 - (sm.embedding <=> p_query_embedding) AS similarity
  FROM public.session_memory sm
  JOIN public.sessions s ON sm.session_id = s.id
  WHERE sm.session_id = p_session_id
    AND s.user_id = auth.uid()
    AND sm.embedding IS NOT NULL
    AND (p_chunk_types IS NULL OR sm.chunk_type = ANY(p_chunk_types))
  ORDER BY sm.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.search_session_memory IS 'Performs semantic similarity search on session memory chunks';