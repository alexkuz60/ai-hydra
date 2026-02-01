-- Создание таблицы статистики моделей ("трудовая книжка")
CREATE TABLE public.model_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  model_id TEXT NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  response_count INTEGER NOT NULL DEFAULT 0,
  total_brains INTEGER NOT NULL DEFAULT 0,
  dismissal_count INTEGER NOT NULL DEFAULT 0,
  first_used_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, model_id, session_id)
);

-- Индексы для быстрого доступа
CREATE INDEX idx_model_stats_user ON model_statistics(user_id);
CREATE INDEX idx_model_stats_model ON model_statistics(model_id);
CREATE INDEX idx_model_stats_session ON model_statistics(session_id);

-- RLS политики
ALTER TABLE model_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own statistics"
  ON model_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statistics"
  ON model_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics"
  ON model_statistics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own statistics"
  ON model_statistics FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger для updated_at
CREATE TRIGGER update_model_statistics_updated_at
  BEFORE UPDATE ON model_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();