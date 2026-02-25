
-- Phase 1: Decision Graph data layer for Navigator

-- 1. Add graph fields to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS parent_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS request_group_id uuid;

-- Index for fast tree traversal
CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON public.messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_request_group_id ON public.messages(request_group_id);

-- 2. Create message_links table (graph edges between messages/chats)
CREATE TABLE public.message_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  target_message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  link_type text NOT NULL DEFAULT 'reply',
  weight numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Prevent duplicate links
  UNIQUE(source_message_id, target_message_id, link_type)
);

-- Indexes for graph traversal
CREATE INDEX idx_message_links_source ON public.message_links(source_message_id);
CREATE INDEX idx_message_links_target ON public.message_links(target_message_id);
CREATE INDEX idx_message_links_type ON public.message_links(link_type);

-- Add comment documenting link_type values
COMMENT ON COLUMN public.message_links.link_type IS 
  'reply | critique | evaluation | forward_to_dchat | return_from_dchat | summary_of';

-- 3. RLS for message_links (same ownership model as messages)
ALTER TABLE public.message_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own message links"
  ON public.message_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_links.source_message_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own message links"
  ON public.message_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_links.source_message_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own message links"
  ON public.message_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_links.source_message_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own message links"
  ON public.message_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_links.source_message_id
        AND m.user_id = auth.uid()
    )
  );
