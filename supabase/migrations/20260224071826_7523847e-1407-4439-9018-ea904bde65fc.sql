
-- =============================================
-- СПРЗ: Стратегические Планы Решения Задач
-- =============================================

-- 1. Таблица стратегических планов
CREATE TABLE public.strategic_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  title_en TEXT,
  goal TEXT,
  goal_en TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  progress NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS для strategic_plans
ALTER TABLE public.strategic_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans"
  ON public.strategic_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own plans"
  ON public.strategic_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON public.strategic_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON public.strategic_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Триггер updated_at
CREATE TRIGGER update_strategic_plans_updated_at
  BEFORE UPDATE ON public.strategic_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Добавить plan_id, parent_id, sort_order в sessions
ALTER TABLE public.sessions
  ADD COLUMN plan_id UUID REFERENCES public.strategic_plans(id) ON DELETE SET NULL,
  ADD COLUMN parent_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Индексы для быстрого поиска по иерархии
CREATE INDEX idx_sessions_plan_id ON public.sessions(plan_id) WHERE plan_id IS NOT NULL;
CREATE INDEX idx_sessions_parent_id ON public.sessions(parent_id) WHERE parent_id IS NOT NULL;

-- 3. Таблица итогов (plan_conclusions)
CREATE TABLE public.plan_conclusions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  content_en TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS для plan_conclusions
ALTER TABLE public.plan_conclusions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conclusions"
  ON public.plan_conclusions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conclusions"
  ON public.plan_conclusions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conclusions"
  ON public.plan_conclusions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conclusions"
  ON public.plan_conclusions FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_plan_conclusions_updated_at
  BEFORE UPDATE ON public.plan_conclusions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Индексы
CREATE INDEX idx_plan_conclusions_session ON public.plan_conclusions(session_id);
CREATE INDEX idx_plan_conclusions_pinned ON public.plan_conclusions(is_pinned) WHERE is_pinned = true;
