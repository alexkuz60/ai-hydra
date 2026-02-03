-- Drop and recreate get_prompt_library_safe function with language field
DROP FUNCTION IF EXISTS public.get_prompt_library_safe();

CREATE FUNCTION public.get_prompt_library_safe()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  content TEXT,
  role TEXT,
  is_shared BOOLEAN,
  is_default BOOLEAN,
  usage_count INTEGER,
  tags TEXT[],
  language TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_owner BOOLEAN
)
LANGUAGE sql
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
    pl.language,
    pl.created_at,
    pl.updated_at,
    (pl.user_id = auth.uid()) as is_owner
  FROM public.prompt_library pl
  WHERE pl.is_shared = true OR pl.user_id = auth.uid()
  ORDER BY pl.updated_at DESC;
$$;