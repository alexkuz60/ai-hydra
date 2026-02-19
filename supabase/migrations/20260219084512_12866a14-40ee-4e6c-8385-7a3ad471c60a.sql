
-- Create supervisor_notifications table
CREATE TABLE public.supervisor_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  chronicle_id uuid NULL,
  entry_code text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supervisor_notifications ENABLE ROW LEVEL SECURITY;

-- Only the owning supervisor can see/update their notifications
CREATE POLICY "Users can view own notifications"
  ON public.supervisor_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.supervisor_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert (edge function uses service key)
CREATE POLICY "Service role can insert notifications"
  ON public.supervisor_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON public.supervisor_notifications FOR DELETE
  USING (auth.uid() = user_id);
