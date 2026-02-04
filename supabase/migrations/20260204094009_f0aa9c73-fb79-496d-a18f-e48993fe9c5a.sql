-- Таблица для хранения накопленного опыта ролей
CREATE TABLE public.role_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,  -- 'archivist', 'analyst', etc.
  
  -- Контент и классификация
  content text NOT NULL,
  memory_type text NOT NULL DEFAULT 'experience'
    CHECK (memory_type IN ('experience', 'preference', 'skill', 'mistake', 'success')),
  
  -- Контекст происхождения
  source_session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  source_message_id uuid,
  
  -- Метрики качества
  confidence_score numeric(3,2) DEFAULT 0.7
    CHECK (confidence_score >= 0 AND confidence_score <= 1),
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  
  -- Векторный поиск
  embedding vector(1536),
  
  -- Метаданные
  metadata jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Индексы для производительности
CREATE INDEX idx_role_memory_user_role ON role_memory(user_id, role);
CREATE INDEX idx_role_memory_type ON role_memory(user_id, memory_type);
CREATE INDEX idx_role_memory_embedding ON role_memory USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_role_memory_tags ON role_memory USING gin (tags);

-- RLS политики
ALTER TABLE role_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role memory"
ON role_memory FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own role memory"
ON role_memory FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own role memory"
ON role_memory FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own role memory"
ON role_memory FOR DELETE
USING (auth.uid() = user_id);

-- Триггер для обновления updated_at
CREATE TRIGGER update_role_memory_updated_at
BEFORE UPDATE ON role_memory
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RPC функция для семантического поиска в ролевой памяти
CREATE OR REPLACE FUNCTION public.search_role_memory(
  p_role text,
  p_query_embedding vector(1536),
  p_limit int DEFAULT 5,
  p_memory_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  memory_type text,
  confidence_score numeric,
  tags text[],
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rm.id,
    rm.content,
    rm.memory_type,
    rm.confidence_score,
    rm.tags,
    rm.metadata,
    1 - (rm.embedding <=> p_query_embedding) AS similarity
  FROM public.role_memory rm
  WHERE rm.user_id = auth.uid()
    AND rm.role = p_role
    AND rm.embedding IS NOT NULL
    AND (p_memory_types IS NULL OR rm.memory_type = ANY(p_memory_types))
  ORDER BY rm.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;

-- RPC функция для инкремента usage_count
CREATE OR REPLACE FUNCTION public.increment_role_memory_usage(p_memory_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.role_memory
  SET 
    usage_count = usage_count + 1,
    last_used_at = now()
  WHERE id = p_memory_id
    AND user_id = auth.uid();
END;
$$;