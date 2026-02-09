
-- ProxyAPI request logs for analytics and debugging
CREATE TABLE public.proxy_api_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  model_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'proxyapi',
  request_type TEXT NOT NULL DEFAULT 'chat', -- chat, ping, test
  status TEXT NOT NULL DEFAULT 'success', -- success, error, timeout, fallback
  latency_ms INTEGER,
  fallback_provider TEXT, -- if fallback was used
  error_message TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proxy_api_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own proxy logs"
  ON public.proxy_api_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proxy logs"
  ON public.proxy_api_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own proxy logs"
  ON public.proxy_api_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast user queries
CREATE INDEX idx_proxy_api_logs_user_created ON public.proxy_api_logs (user_id, created_at DESC);
CREATE INDEX idx_proxy_api_logs_model ON public.proxy_api_logs (user_id, model_id);
