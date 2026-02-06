
-- Create role_knowledge table for long-form documentation / RAG
CREATE TABLE public.role_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  source_title TEXT,
  source_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  version TEXT,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_total INTEGER NOT NULL DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_knowledge ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own role knowledge"
  ON public.role_knowledge FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role knowledge"
  ON public.role_knowledge FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own role knowledge"
  ON public.role_knowledge FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own role knowledge"
  ON public.role_knowledge FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_role_knowledge_updated_at
  BEFORE UPDATE ON public.role_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_role_knowledge_user_role ON public.role_knowledge(user_id, role);
CREATE INDEX idx_role_knowledge_category ON public.role_knowledge(category);
CREATE INDEX idx_role_knowledge_tags ON public.role_knowledge USING GIN(tags);

-- HNSW index for fast similarity search (read-heavy workload)
CREATE INDEX idx_role_knowledge_embedding ON public.role_knowledge
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Semantic search RPC
CREATE OR REPLACE FUNCTION public.search_role_knowledge(
  p_role TEXT,
  p_query_embedding vector(1536),
  p_limit INTEGER DEFAULT 5,
  p_categories TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_title TEXT,
  source_url TEXT,
  category TEXT,
  version TEXT,
  tags TEXT[],
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rk.id,
    rk.content,
    rk.source_title,
    rk.source_url,
    rk.category,
    rk.version,
    rk.tags,
    rk.metadata,
    1 - (rk.embedding <=> p_query_embedding) AS similarity
  FROM public.role_knowledge rk
  WHERE rk.user_id = auth.uid()
    AND rk.role = p_role
    AND rk.embedding IS NOT NULL
    AND (p_categories IS NULL OR rk.category = ANY(p_categories))
  ORDER BY rk.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;
