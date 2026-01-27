-- Create storage bucket for message files
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-files', 'message-files', true);

-- RLS policy: Users can upload their own files
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy: Anyone can view files (bucket is public)
CREATE POLICY "Anyone can view message files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'message-files');

-- RLS policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);