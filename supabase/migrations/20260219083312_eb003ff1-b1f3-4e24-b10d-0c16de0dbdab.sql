-- Create chronicles table for Evolution Department
CREATE TABLE public.chronicles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_code text NOT NULL UNIQUE, -- EVO-001, EVO-002, etc.
  title text NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  role_object text NOT NULL DEFAULT '',
  initiator text NOT NULL DEFAULT 'Admin',
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected, wish
  supervisor_resolution text NOT NULL DEFAULT 'pending',
  supervisor_comment text,
  hypothesis text,
  metrics_before jsonb DEFAULT '{}',
  metrics_after jsonb DEFAULT '{}',
  summary text,
  ai_revision text, -- AI-generated revision after rejection
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chronicles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can READ chronicles
CREATE POLICY "Authenticated users can view chronicles"
ON public.chronicles
FOR SELECT
TO authenticated
USING (is_visible = true);

-- Only supervisors can INSERT
CREATE POLICY "Supervisors can insert chronicles"
ON public.chronicles
FOR INSERT
WITH CHECK (is_admin_or_supervisor(auth.uid()));

-- Only supervisors can UPDATE (including setting resolutions)
CREATE POLICY "Supervisors can update chronicles"
ON public.chronicles
FOR UPDATE
USING (is_admin_or_supervisor(auth.uid()));

-- Only supervisors can DELETE
CREATE POLICY "Supervisors can delete chronicles"
ON public.chronicles
FOR DELETE
USING (is_admin_or_supervisor(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_chronicles_updated_at
BEFORE UPDATE ON public.chronicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();