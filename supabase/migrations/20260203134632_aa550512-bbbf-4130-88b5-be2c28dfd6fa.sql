BEGIN;

-- 1) Remove permissive SELECT that leaks user_id for shared prompts
DROP POLICY IF EXISTS "Users can view own and shared prompts" ON public.prompt_library;

-- 2) Block direct reads from base table for app users
-- (reads must go through the safe view)
CREATE POLICY "No direct select on prompt_library"
ON public.prompt_library
FOR SELECT
TO authenticated
USING (false);

-- 3) Recreate safe view that:
-- - exposes only shared prompts + the current user's prompts
-- - masks user_id for non-owners
-- - provides is_owner flag
DROP VIEW IF EXISTS public.prompt_library_safe;

CREATE VIEW public.prompt_library_safe AS
SELECT
  id,
  name,
  description,
  content,
  role,
  is_shared,
  is_default,
  usage_count,
  tags,
  created_at,
  updated_at,
  CASE WHEN user_id = auth.uid() THEN user_id ELSE NULL END AS user_id,
  (user_id = auth.uid()) AS is_owner
FROM public.prompt_library
WHERE is_shared = true OR user_id = auth.uid();

-- 4) Allow authenticated users to read from the safe view
GRANT SELECT ON public.prompt_library_safe TO authenticated;

COMMIT;