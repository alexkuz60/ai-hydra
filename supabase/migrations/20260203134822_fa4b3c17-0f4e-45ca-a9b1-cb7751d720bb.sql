BEGIN;

-- Remove security-definer view (linter: 0010_security_definer_view)
DROP VIEW IF EXISTS public.prompt_library_safe;

-- Provide safe read access via a controlled RPC instead
CREATE OR REPLACE FUNCTION public.get_prompt_library_safe()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  content text,
  role text,
  is_shared boolean,
  is_default boolean,
  usage_count integer,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  is_owner boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pl.id,
    pl.name,
    pl.description,
    pl.content,
    pl.role,
    pl.is_shared,
    pl.is_default,
    pl.usage_count,
    pl.tags,
    pl.created_at,
    pl.updated_at,
    (pl.user_id = auth.uid()) as is_owner
  FROM public.prompt_library pl
  WHERE pl.is_shared = true OR pl.user_id = auth.uid()
  ORDER BY pl.updated_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_prompt_library_safe() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_prompt_library_safe() TO authenticated;

-- Fix linter warn: extension installed in public
ALTER EXTENSION vector SET SCHEMA extensions;

COMMIT;