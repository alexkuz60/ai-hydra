
-- Add system/shared flags to sessions table
ALTER TABLE public.sessions 
  ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT false;

-- Allow everyone to view system sessions (tutorial examples)
CREATE POLICY "Anyone can view system sessions"
  ON public.sessions
  FOR SELECT
  USING (is_system = true);

-- Allow everyone to view shared sessions
CREATE POLICY "Anyone can view shared sessions"
  ON public.sessions
  FOR SELECT
  USING (is_shared = true);

-- Protect system sessions from non-admin updates
CREATE POLICY "Only admins can update system sessions"
  ON public.sessions
  FOR UPDATE
  USING (is_system = true AND is_admin_or_supervisor(auth.uid()));

-- Protect system sessions from non-admin deletion
CREATE POLICY "Only admins can delete system sessions"
  ON public.sessions
  FOR DELETE
  USING (is_system = true AND is_admin_or_supervisor(auth.uid()));

-- Allow viewing messages of system sessions
CREATE POLICY "Anyone can view messages of system sessions"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = messages.session_id AND s.is_system = true
    )
  );
