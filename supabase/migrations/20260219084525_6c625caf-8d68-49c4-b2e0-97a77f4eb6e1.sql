
-- Fix overly permissive INSERT policy: only authenticated users or service role can insert
-- Since edge function uses SERVICE_ROLE_KEY (bypasses RLS), we can restrict to authenticated inserts only
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.supervisor_notifications;

CREATE POLICY "Authenticated can insert notifications"
  ON public.supervisor_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
