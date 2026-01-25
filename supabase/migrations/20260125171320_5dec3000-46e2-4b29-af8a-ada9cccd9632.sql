-- Step 1: Create user_api_keys table for secure API key storage
CREATE TABLE public.user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  openai_api_key text,
  anthropic_api_key text,
  google_gemini_api_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on user_api_keys
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_api_keys - users can only access their own keys
CREATE POLICY "Users can view their own API keys"
  ON public.user_api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON public.user_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.user_api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.user_api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 2: Migrate existing API keys from profiles to user_api_keys
INSERT INTO public.user_api_keys (user_id, openai_api_key, anthropic_api_key, google_gemini_api_key)
SELECT user_id, openai_api_key, anthropic_api_key, google_gemini_api_key
FROM public.profiles
WHERE openai_api_key IS NOT NULL 
   OR anthropic_api_key IS NOT NULL 
   OR google_gemini_api_key IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  openai_api_key = EXCLUDED.openai_api_key,
  anthropic_api_key = EXCLUDED.anthropic_api_key,
  google_gemini_api_key = EXCLUDED.google_gemini_api_key;

-- Step 3: Remove API key columns from profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS openai_api_key,
  DROP COLUMN IF EXISTS anthropic_api_key,
  DROP COLUMN IF EXISTS google_gemini_api_key;

-- Step 4: Add missing UPDATE policy for messages table
CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = user_id);