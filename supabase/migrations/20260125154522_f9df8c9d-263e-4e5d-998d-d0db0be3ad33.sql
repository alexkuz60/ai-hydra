-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create prompt_library table
CREATE TABLE public.prompt_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  role TEXT NOT NULL DEFAULT 'assistant',
  content TEXT NOT NULL,
  embedding vector(1536), -- For semantic search later
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prompt_library ENABLE ROW LEVEL SECURITY;

-- Users can view their own prompts or shared prompts
CREATE POLICY "Users can view own and shared prompts"
ON public.prompt_library
FOR SELECT
USING (auth.uid() = user_id OR is_shared = true);

-- Users can create their own prompts
CREATE POLICY "Users can create own prompts"
ON public.prompt_library
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own prompts
CREATE POLICY "Users can update own prompts"
ON public.prompt_library
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own prompts
CREATE POLICY "Users can delete own prompts"
ON public.prompt_library
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster role-based queries
CREATE INDEX idx_prompt_library_role ON public.prompt_library(role);
CREATE INDEX idx_prompt_library_user ON public.prompt_library(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_prompt_library_updated_at
BEFORE UPDATE ON public.prompt_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();