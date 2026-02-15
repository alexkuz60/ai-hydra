
-- Interview sessions table for conducting role interviews
CREATE TABLE public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,                    -- technical role being interviewed for
  candidate_model TEXT NOT NULL,         -- model being interviewed
  status TEXT NOT NULL DEFAULT 'briefing', -- briefing, testing, completed, cancelled
  briefing_token_count INTEGER,         -- tokens used for briefing assembly
  briefing_data JSONB DEFAULT '{}',     -- assembled Position Brief content
  test_results JSONB DEFAULT '[]',      -- Phase 2: situational test results
  verdict JSONB,                        -- Phase 3: final verdict
  config JSONB DEFAULT '{}',            -- interview configuration
  source_contest_id UUID,               -- optional link to contest that selected this candidate
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own interviews"
  ON public.interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own interviews"
  ON public.interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews"
  ON public.interview_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interviews"
  ON public.interview_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
