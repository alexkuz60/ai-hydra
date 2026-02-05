-- Add requires_approval field to role_behaviors table
ALTER TABLE public.role_behaviors 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.role_behaviors.requires_approval IS 'When true, responses from this role will include interactive proposals for supervisor approval';