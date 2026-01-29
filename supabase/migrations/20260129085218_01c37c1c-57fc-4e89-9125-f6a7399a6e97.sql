-- Add tool_type column with default 'prompt' for existing tools
ALTER TABLE public.custom_tools 
ADD COLUMN tool_type text NOT NULL DEFAULT 'prompt';

-- Add http_config column for HTTP API configuration
ALTER TABLE public.custom_tools 
ADD COLUMN http_config jsonb DEFAULT NULL;

-- Add constraint to ensure valid tool types
ALTER TABLE public.custom_tools 
ADD CONSTRAINT custom_tools_tool_type_check 
CHECK (tool_type IN ('prompt', 'http_api'));

-- Add constraint to ensure http_config is present for http_api tools
ALTER TABLE public.custom_tools 
ADD CONSTRAINT custom_tools_http_config_check 
CHECK (
  (tool_type = 'prompt') OR 
  (tool_type = 'http_api' AND http_config IS NOT NULL)
);

-- Add comment for documentation
COMMENT ON COLUMN public.custom_tools.tool_type IS 'Type of tool: prompt (template-based) or http_api (external API call)';
COMMENT ON COLUMN public.custom_tools.http_config IS 'HTTP configuration for http_api tools: {url, method, headers, body_template, response_path}';