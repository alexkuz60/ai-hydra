
-- Table for storing AI-generated file digests
CREATE TABLE public.file_digests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_file_id UUID NOT NULL REFERENCES public.task_files(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  digest TEXT NOT NULL,
  digest_type TEXT NOT NULL DEFAULT 'summary',
  source_mime_type TEXT,
  source_file_name TEXT,
  token_estimate INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_file_digests_session ON public.file_digests(session_id);
CREATE INDEX idx_file_digests_task_file ON public.file_digests(task_file_id);

-- Enable RLS
ALTER TABLE public.file_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own file digests"
  ON public.file_digests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own file digests"
  ON public.file_digests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own file digests"
  ON public.file_digests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own file digests"
  ON public.file_digests FOR DELETE
  USING (auth.uid() = user_id);
