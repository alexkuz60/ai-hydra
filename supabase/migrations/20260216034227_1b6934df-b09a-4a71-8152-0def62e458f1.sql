
-- Create role_assignment_history table for tracking model assignments per role
CREATE TABLE public.role_assignment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  model_id TEXT NOT NULL,
  interview_session_id UUID REFERENCES public.interview_sessions(id) ON DELETE SET NULL,
  interview_avg_score NUMERIC DEFAULT 0,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  removed_at TIMESTAMP WITH TIME ZONE,
  removal_reason TEXT, -- 'replaced' | 'manual' | 'retest_failed'
  is_synthetic BOOLEAN NOT NULL DEFAULT false, -- for cold-start phantom records
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_assignment_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own assignment history"
  ON public.role_assignment_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignment history"
  ON public.role_assignment_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignment history"
  ON public.role_assignment_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assignment history"
  ON public.role_assignment_history FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups by role
CREATE INDEX idx_role_assignment_history_role ON public.role_assignment_history (user_id, role, assigned_at DESC);
