-- Create table for custom user-defined tools
CREATE TABLE public.custom_tools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    description text NOT NULL,
    prompt_template text NOT NULL,
    parameters jsonb NOT NULL DEFAULT '[]'::jsonb,
    is_shared boolean NOT NULL DEFAULT false,
    usage_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT custom_tools_name_unique UNIQUE (user_id, name)
);

-- Enable RLS
ALTER TABLE public.custom_tools ENABLE ROW LEVEL SECURITY;

-- Users can view their own and shared tools
CREATE POLICY "Users can view own and shared tools"
ON public.custom_tools
FOR SELECT
USING ((auth.uid() = user_id) OR (is_shared = true));

-- Users can create their own tools
CREATE POLICY "Users can create own tools"
ON public.custom_tools
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tools
CREATE POLICY "Users can update own tools"
ON public.custom_tools
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own tools
CREATE POLICY "Users can delete own tools"
ON public.custom_tools
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_tools_updated_at
BEFORE UPDATE ON public.custom_tools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();