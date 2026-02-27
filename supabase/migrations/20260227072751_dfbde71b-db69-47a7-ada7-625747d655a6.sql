
-- Create storage bucket for role knowledge files
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-files', 'knowledge-files', false);

-- RLS policies for knowledge-files bucket
CREATE POLICY "Users can upload own knowledge files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'knowledge-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own knowledge files"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own knowledge files"
ON storage.objects FOR DELETE
USING (bucket_id = 'knowledge-files' AND auth.uid()::text = (storage.foldername(name))[1]);
