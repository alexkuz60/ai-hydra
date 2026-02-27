
-- Add comment column for user annotations on why file was added
ALTER TABLE public.task_files ADD COLUMN comment text;

-- Enable UPDATE for users on their own task files (currently missing)
CREATE POLICY "Users can update own task files metadata"
ON public.task_files
FOR UPDATE
USING (auth.uid() = user_id);
