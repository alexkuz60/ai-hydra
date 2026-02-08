
-- Storage bucket for task files
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-files', 'task-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for task-files bucket
CREATE POLICY "Users can view own task files"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own task files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own task files"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Table to track file metadata per task/session
CREATE TABLE public.task_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task files metadata"
ON public.task_files FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task files metadata"
ON public.task_files FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own task files metadata"
ON public.task_files FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_task_files_session ON public.task_files(session_id);
