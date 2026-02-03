-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create session_memory table for vector memory
CREATE TABLE public.session_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimensions
  chunk_type text NOT NULL DEFAULT 'message',
  source_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraint: chunk_type must be valid
  CONSTRAINT valid_chunk_type CHECK (chunk_type IN ('message', 'summary', 'decision', 'context', 'instruction'))
);

-- Add index for session lookups
CREATE INDEX idx_session_memory_session_id ON public.session_memory(session_id);

-- Add index for user lookups
CREATE INDEX idx_session_memory_user_id ON public.session_memory(user_id);

-- Add index for chunk type filtering
CREATE INDEX idx_session_memory_chunk_type ON public.session_memory(chunk_type);

-- Add GIN index for metadata JSONB queries
CREATE INDEX idx_session_memory_metadata ON public.session_memory USING GIN(metadata);

-- Enable RLS
ALTER TABLE public.session_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access memory from their own sessions
CREATE POLICY "Users can view their session memory"
  ON public.session_memory
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their session memory"
  ON public.session_memory
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their session memory"
  ON public.session_memory
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their session memory"
  ON public.session_memory
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_session_memory_updated_at
  BEFORE UPDATE ON public.session_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.session_memory IS 'Stores chunked memory with vector embeddings for session context retrieval';
COMMENT ON COLUMN public.session_memory.embedding IS 'Vector embedding (1536 dimensions for OpenAI ada-002)';
COMMENT ON COLUMN public.session_memory.chunk_type IS 'Type of memory chunk: message, summary, decision, context, instruction';