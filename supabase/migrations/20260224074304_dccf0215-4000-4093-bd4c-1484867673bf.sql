
-- Add visibility_level column to role_knowledge
-- Values: 'global' (Level A - mission/philosophy), 'organizational' (Level B - staff map), 'role_specific' (Level C - deep expertise)
ALTER TABLE public.role_knowledge
ADD COLUMN IF NOT EXISTS visibility_level text NOT NULL DEFAULT 'role_specific';

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_role_knowledge_visibility ON public.role_knowledge (visibility_level);

-- Update hybrid search function to support visibility_level filtering
CREATE OR REPLACE FUNCTION public.hybrid_search_role_knowledge(
  p_role text,
  p_query_text text,
  p_query_embedding extensions.vector,
  p_limit integer DEFAULT 5,
  p_categories text[] DEFAULT NULL,
  p_visibility_levels text[] DEFAULT NULL
)
RETURNS TABLE(
  id uuid, content text, source_title text, source_url text,
  category text, version text, tags text[], metadata jsonb,
  similarity double precision, text_rank double precision, hybrid_score double precision
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      rk.id,
      1 - (rk.embedding <=> p_query_embedding) AS similarity,
      ROW_NUMBER() OVER (ORDER BY rk.embedding <=> p_query_embedding) AS rank_v
    FROM public.role_knowledge rk
    WHERE rk.user_id = auth.uid()
      AND rk.role = p_role
      AND rk.embedding IS NOT NULL
      AND (p_categories IS NULL OR rk.category = ANY(p_categories))
      AND (p_visibility_levels IS NULL OR rk.visibility_level = ANY(p_visibility_levels))
    LIMIT p_limit * 3
  ),
  text_results AS (
    SELECT
      rk.id,
      GREATEST(
        ts_rank(to_tsvector('russian', rk.content), plainto_tsquery('russian', p_query_text)),
        ts_rank(to_tsvector('english', rk.content), plainto_tsquery('english', p_query_text))
      ) AS text_score,
      ROW_NUMBER() OVER (
        ORDER BY GREATEST(
          ts_rank(to_tsvector('russian', rk.content), plainto_tsquery('russian', p_query_text)),
          ts_rank(to_tsvector('english', rk.content), plainto_tsquery('english', p_query_text))
        ) DESC
      ) AS rank_t
    FROM public.role_knowledge rk
    WHERE rk.user_id = auth.uid()
      AND rk.role = p_role
      AND (p_categories IS NULL OR rk.category = ANY(p_categories))
      AND (p_visibility_levels IS NULL OR rk.visibility_level = ANY(p_visibility_levels))
      AND (
        to_tsvector('russian', rk.content) @@ plainto_tsquery('russian', p_query_text)
        OR to_tsvector('english', rk.content) @@ plainto_tsquery('english', p_query_text)
        OR rk.content ILIKE '%' || p_query_text || '%'
      )
    LIMIT p_limit * 3
  ),
  rrf AS (
    SELECT
      COALESCE(v.id, t.id) AS id,
      COALESCE(v.similarity, 0::double precision) AS similarity,
      COALESCE(t.text_score, 0::double precision) AS text_rank,
      COALESCE(1.0 / (60.0 + v.rank_v), 0.0)
        + COALESCE(1.0 / (60.0 + t.rank_t), 0.0) AS hybrid_score
    FROM vector_results v
    FULL OUTER JOIN text_results t ON v.id = t.id
  )
  SELECT
    rk.id, rk.content, rk.source_title, rk.source_url,
    rk.category, rk.version, rk.tags, rk.metadata,
    r.similarity, r.text_rank, r.hybrid_score
  FROM rrf r
  JOIN public.role_knowledge rk ON rk.id = r.id
  ORDER BY r.hybrid_score DESC
  LIMIT p_limit;
END;
$$;

-- Update vector-only search to also support visibility_level filtering
CREATE OR REPLACE FUNCTION public.search_role_knowledge(
  p_role text,
  p_query_embedding extensions.vector,
  p_limit integer DEFAULT 5,
  p_categories text[] DEFAULT NULL,
  p_visibility_levels text[] DEFAULT NULL
)
RETURNS TABLE(
  id uuid, content text, source_title text, source_url text,
  category text, version text, tags text[], metadata jsonb,
  similarity double precision
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rk.id, rk.content, rk.source_title, rk.source_url,
    rk.category, rk.version, rk.tags, rk.metadata,
    1 - (rk.embedding <=> p_query_embedding) AS similarity
  FROM public.role_knowledge rk
  WHERE rk.user_id = auth.uid()
    AND rk.role = p_role
    AND rk.embedding IS NOT NULL
    AND (p_categories IS NULL OR rk.category = ANY(p_categories))
    AND (p_visibility_levels IS NULL OR rk.visibility_level = ANY(p_visibility_levels))
  ORDER BY rk.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;
