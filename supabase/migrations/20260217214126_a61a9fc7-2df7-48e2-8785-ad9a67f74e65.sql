
-- ============================================================
-- Iteration 2: Hybrid Search (BM25 + vector via RRF)
-- Reciprocal Rank Fusion: score = 1/(k+rank_v) + 1/(k+rank_t)
-- k=60 per Cormack et al. standard
-- ============================================================

-- 1. Hybrid search for session_memory
CREATE OR REPLACE FUNCTION public.hybrid_search_session_memory(
  p_session_id     uuid,
  p_query_text     text,
  p_query_embedding extensions.vector,
  p_limit          integer  DEFAULT 10,
  p_chunk_types    text[]   DEFAULT NULL
)
RETURNS TABLE(
  id            uuid,
  content       text,
  chunk_type    text,
  metadata      jsonb,
  similarity    double precision,
  text_rank     double precision,
  hybrid_score  double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      sm.id,
      1 - (sm.embedding <=> p_query_embedding)                          AS similarity,
      ROW_NUMBER() OVER (ORDER BY sm.embedding <=> p_query_embedding)   AS rank_v
    FROM public.session_memory sm
    JOIN public.sessions s ON sm.session_id = s.id
    WHERE sm.session_id = p_session_id
      AND s.user_id    = auth.uid()
      AND sm.embedding IS NOT NULL
      AND (p_chunk_types IS NULL OR sm.chunk_type = ANY(p_chunk_types))
    LIMIT p_limit * 3
  ),
  text_results AS (
    SELECT
      sm.id,
      GREATEST(
        ts_rank(to_tsvector('russian', sm.content), plainto_tsquery('russian', p_query_text)),
        ts_rank(to_tsvector('english', sm.content), plainto_tsquery('english', p_query_text))
      )                                                                  AS text_score,
      ROW_NUMBER() OVER (
        ORDER BY GREATEST(
          ts_rank(to_tsvector('russian', sm.content), plainto_tsquery('russian', p_query_text)),
          ts_rank(to_tsvector('english', sm.content), plainto_tsquery('english', p_query_text))
        ) DESC
      )                                                                  AS rank_t
    FROM public.session_memory sm
    JOIN public.sessions s ON sm.session_id = s.id
    WHERE sm.session_id = p_session_id
      AND s.user_id    = auth.uid()
      AND (p_chunk_types IS NULL OR sm.chunk_type = ANY(p_chunk_types))
      AND (
        to_tsvector('russian', sm.content) @@ plainto_tsquery('russian', p_query_text)
        OR to_tsvector('english', sm.content) @@ plainto_tsquery('english', p_query_text)
        OR sm.content ILIKE '%' || p_query_text || '%'
      )
    LIMIT p_limit * 3
  ),
  rrf AS (
    SELECT
      COALESCE(v.id, t.id)                                              AS id,
      COALESCE(v.similarity, 0::double precision)                       AS similarity,
      COALESCE(t.text_score, 0::double precision)                       AS text_rank,
      COALESCE(1.0 / (60.0 + v.rank_v), 0.0)
        + COALESCE(1.0 / (60.0 + t.rank_t), 0.0)                       AS hybrid_score
    FROM vector_results v
    FULL OUTER JOIN text_results t ON v.id = t.id
  )
  SELECT
    sm.id,
    sm.content,
    sm.chunk_type,
    sm.metadata,
    r.similarity,
    r.text_rank,
    r.hybrid_score
  FROM rrf r
  JOIN public.session_memory sm ON sm.id = r.id
  ORDER BY r.hybrid_score DESC
  LIMIT p_limit;
END;
$$;

-- 2. Hybrid search for role_knowledge
CREATE OR REPLACE FUNCTION public.hybrid_search_role_knowledge(
  p_role            text,
  p_query_text      text,
  p_query_embedding extensions.vector,
  p_limit           integer DEFAULT 5,
  p_categories      text[]  DEFAULT NULL
)
RETURNS TABLE(
  id            uuid,
  content       text,
  source_title  text,
  source_url    text,
  category      text,
  version       text,
  tags          text[],
  metadata      jsonb,
  similarity    double precision,
  text_rank     double precision,
  hybrid_score  double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      rk.id,
      1 - (rk.embedding <=> p_query_embedding)                          AS similarity,
      ROW_NUMBER() OVER (ORDER BY rk.embedding <=> p_query_embedding)   AS rank_v
    FROM public.role_knowledge rk
    WHERE rk.user_id   = auth.uid()
      AND rk.role      = p_role
      AND rk.embedding IS NOT NULL
      AND (p_categories IS NULL OR rk.category = ANY(p_categories))
    LIMIT p_limit * 3
  ),
  text_results AS (
    SELECT
      rk.id,
      GREATEST(
        ts_rank(to_tsvector('russian', rk.content), plainto_tsquery('russian', p_query_text)),
        ts_rank(to_tsvector('english', rk.content), plainto_tsquery('english', p_query_text))
      )                                                                  AS text_score,
      ROW_NUMBER() OVER (
        ORDER BY GREATEST(
          ts_rank(to_tsvector('russian', rk.content), plainto_tsquery('russian', p_query_text)),
          ts_rank(to_tsvector('english', rk.content), plainto_tsquery('english', p_query_text))
        ) DESC
      )                                                                  AS rank_t
    FROM public.role_knowledge rk
    WHERE rk.user_id = auth.uid()
      AND rk.role    = p_role
      AND (p_categories IS NULL OR rk.category = ANY(p_categories))
      AND (
        to_tsvector('russian', rk.content) @@ plainto_tsquery('russian', p_query_text)
        OR to_tsvector('english', rk.content) @@ plainto_tsquery('english', p_query_text)
        OR rk.content ILIKE '%' || p_query_text || '%'
      )
    LIMIT p_limit * 3
  ),
  rrf AS (
    SELECT
      COALESCE(v.id, t.id)                                              AS id,
      COALESCE(v.similarity, 0::double precision)                       AS similarity,
      COALESCE(t.text_score, 0::double precision)                       AS text_rank,
      COALESCE(1.0 / (60.0 + v.rank_v), 0.0)
        + COALESCE(1.0 / (60.0 + t.rank_t), 0.0)                       AS hybrid_score
    FROM vector_results v
    FULL OUTER JOIN text_results t ON v.id = t.id
  )
  SELECT
    rk.id,
    rk.content,
    rk.source_title,
    rk.source_url,
    rk.category,
    rk.version,
    rk.tags,
    rk.metadata,
    r.similarity,
    r.text_rank,
    r.hybrid_score
  FROM rrf r
  JOIN public.role_knowledge rk ON rk.id = r.id
  ORDER BY r.hybrid_score DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.hybrid_search_session_memory TO authenticated;
GRANT EXECUTE ON FUNCTION public.hybrid_search_role_knowledge TO authenticated;
