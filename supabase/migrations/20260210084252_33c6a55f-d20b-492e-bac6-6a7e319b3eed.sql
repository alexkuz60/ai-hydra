
-- Drop the overly restrictive SELECT policy
DROP POLICY IF EXISTS "No direct select on prompt_library" ON public.prompt_library;

-- Allow authenticated users to view their own prompts
CREATE POLICY "Users can view own prompts"
ON public.prompt_library FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow authenticated users to view shared prompts
CREATE POLICY "Users can view shared prompts"
ON public.prompt_library FOR SELECT
TO authenticated
USING (is_shared = true);
