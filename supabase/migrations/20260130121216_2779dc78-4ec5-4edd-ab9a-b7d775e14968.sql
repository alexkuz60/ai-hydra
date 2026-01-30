-- Table for storing flow diagrams
CREATE TABLE public.flow_diagrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flow_diagrams ENABLE ROW LEVEL SECURITY;

-- Users can view their own diagrams
CREATE POLICY "Users can view own diagrams"
ON public.flow_diagrams FOR SELECT
USING (auth.uid() = user_id);

-- Users can view shared diagrams
CREATE POLICY "Users can view shared diagrams"
ON public.flow_diagrams FOR SELECT
USING (is_shared = true);

-- Users can create their own diagrams
CREATE POLICY "Users can create own diagrams"
ON public.flow_diagrams FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own diagrams
CREATE POLICY "Users can update own diagrams"
ON public.flow_diagrams FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own diagrams
CREATE POLICY "Users can delete own diagrams"
ON public.flow_diagrams FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updating updated_at
CREATE OR REPLACE TRIGGER update_flow_diagrams_updated_at
BEFORE UPDATE ON public.flow_diagrams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();