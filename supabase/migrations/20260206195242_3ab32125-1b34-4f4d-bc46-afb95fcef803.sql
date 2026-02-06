
-- =============================================
-- FIX #1: Vault helper functions — REVOKE direct access
-- Only SECURITY DEFINER wrappers (save_api_key, get_my_api_keys, get_my_api_key_status) should call these
-- =============================================

REVOKE ALL ON FUNCTION public.get_decrypted_secret(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_decrypted_secret(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.get_decrypted_secret(uuid) FROM anon;

REVOKE ALL ON FUNCTION public.store_user_secret(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.store_user_secret(uuid, text, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.store_user_secret(uuid, text, text) FROM anon;

REVOKE ALL ON FUNCTION public.delete_user_secret(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_user_secret(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.delete_user_secret(uuid) FROM anon;

-- Ensure public-facing functions remain callable by authenticated users
GRANT EXECUTE ON FUNCTION public.save_api_key(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_api_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_api_key_status() TO authenticated;

-- =============================================
-- FIX #3: Make message-files bucket private
-- =============================================

UPDATE storage.buckets SET public = false WHERE id = 'message-files';

-- Drop the permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view message files" ON storage.objects;

-- Create authenticated-only SELECT policy scoped to user's folder
CREATE POLICY "Users can view own message files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'message-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================
-- FIX #4: Safe RPC function for custom_tools (like prompt_library pattern)
-- =============================================

-- Block direct SELECT
DROP POLICY IF EXISTS "Users can view own and shared tools" ON public.custom_tools;

CREATE POLICY "Block direct SELECT on custom_tools"
ON public.custom_tools FOR SELECT
TO authenticated
USING (false);

-- Create safe function that hides user_id for non-owners
CREATE OR REPLACE FUNCTION public.get_custom_tools_safe()
RETURNS TABLE(
  id uuid,
  name text,
  display_name text,
  description text,
  prompt_template text,
  parameters jsonb,
  is_shared boolean,
  usage_count integer,
  tool_type text,
  http_config jsonb,
  category text,
  created_at timestamptz,
  updated_at timestamptz,
  is_owner boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ct.id,
    ct.name,
    ct.display_name,
    ct.description,
    ct.prompt_template,
    ct.parameters,
    ct.is_shared,
    ct.usage_count,
    ct.tool_type,
    ct.http_config,
    ct.category,
    ct.created_at,
    ct.updated_at,
    (ct.user_id = auth.uid()) as is_owner
  FROM public.custom_tools ct
  WHERE ct.user_id = auth.uid() OR ct.is_shared = true
  ORDER BY ct.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_custom_tools_safe() TO authenticated;
