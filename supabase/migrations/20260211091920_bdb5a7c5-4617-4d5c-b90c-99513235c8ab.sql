
-- Contest sessions (wizard config + status)
CREATE TABLE public.contest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Конкурс',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contest_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contest sessions" ON public.contest_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own contest sessions" ON public.contest_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contest sessions" ON public.contest_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contest sessions" ON public.contest_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_contest_sessions_updated_at BEFORE UPDATE ON public.contest_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contest rounds (per-round prompts and status)
CREATE TABLE public.contest_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.contest_sessions(id) ON DELETE CASCADE,
  round_index INTEGER NOT NULL DEFAULT 0,
  prompt TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contest_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contest rounds" ON public.contest_rounds FOR SELECT USING (EXISTS (SELECT 1 FROM public.contest_sessions cs WHERE cs.id = session_id AND cs.user_id = auth.uid()));
CREATE POLICY "Users can create own contest rounds" ON public.contest_rounds FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.contest_sessions cs WHERE cs.id = session_id AND cs.user_id = auth.uid()));
CREATE POLICY "Users can update own contest rounds" ON public.contest_rounds FOR UPDATE USING (EXISTS (SELECT 1 FROM public.contest_sessions cs WHERE cs.id = session_id AND cs.user_id = auth.uid()));
CREATE POLICY "Users can delete own contest rounds" ON public.contest_rounds FOR DELETE USING (EXISTS (SELECT 1 FROM public.contest_sessions cs WHERE cs.id = session_id AND cs.user_id = auth.uid()));

-- Contest results (model responses + scores)
CREATE TABLE public.contest_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.contest_rounds(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.contest_sessions(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  response_text TEXT,
  response_time_ms INTEGER,
  token_count INTEGER,
  user_score NUMERIC,
  arbiter_score NUMERIC,
  arbiter_model TEXT,
  arbiter_comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contest_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contest results" ON public.contest_results FOR SELECT USING (EXISTS (SELECT 1 FROM public.contest_sessions cs WHERE cs.id = session_id AND cs.user_id = auth.uid()));
CREATE POLICY "Users can create own contest results" ON public.contest_results FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.contest_sessions cs WHERE cs.id = session_id AND cs.user_id = auth.uid()));
CREATE POLICY "Users can update own contest results" ON public.contest_results FOR UPDATE USING (EXISTS (SELECT 1 FROM public.contest_sessions cs WHERE cs.id = session_id AND cs.user_id = auth.uid()));
CREATE POLICY "Users can delete own contest results" ON public.contest_results FOR DELETE USING (EXISTS (SELECT 1 FROM public.contest_sessions cs WHERE cs.id = session_id AND cs.user_id = auth.uid()));

CREATE TRIGGER update_contest_results_updated_at BEFORE UPDATE ON public.contest_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
