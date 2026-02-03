-- Create a security-invoker view that masks user_id for non-owners
-- This prevents user identity enumeration through shared prompts

CREATE OR REPLACE VIEW public.prompt_library_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  description,
  content,
  role,
  is_shared,
  is_default,
  usage_count,
  created_at,
  updated_at,
  tags,
  -- Only expose user_id if the current user owns the prompt
  CASE 
    WHEN auth.uid() = user_id THEN user_id
    ELSE NULL
  END AS user_id,
  -- Helper column to check ownership without exposing actual user_id
  (auth.uid() = user_id) AS is_owner
FROM public.prompt_library;

-- Grant access to the view
GRANT SELECT ON public.prompt_library_safe TO authenticated;

COMMENT ON VIEW public.prompt_library_safe IS 'Security view that masks user_id for shared prompts to prevent user identity enumeration';