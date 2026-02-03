-- Create enum for pattern categories
CREATE TYPE public.pattern_category AS ENUM ('planning', 'creative', 'analysis', 'technical');

-- Create enum for communication tone
CREATE TYPE public.communication_tone AS ENUM ('formal', 'friendly', 'neutral', 'provocative');

-- Create enum for verbosity level
CREATE TYPE public.verbosity_level AS ENUM ('concise', 'detailed', 'adaptive');

-- ============================================
-- Table: task_blueprints (Strategic Patterns)
-- ============================================
CREATE TABLE public.task_blueprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category pattern_category NOT NULL DEFAULT 'planning',
  description TEXT NOT NULL,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_blueprints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_blueprints
-- Users can view: system patterns, their own patterns, shared patterns
CREATE POLICY "Users can view accessible blueprints"
ON public.task_blueprints
FOR SELECT
USING (
  is_system = true 
  OR auth.uid() = user_id 
  OR is_shared = true
);

-- Users can create their own patterns (not system)
CREATE POLICY "Users can create own blueprints"
ON public.task_blueprints
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_system = false
);

-- Users can update their own patterns (not system)
CREATE POLICY "Users can update own blueprints"
ON public.task_blueprints
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND is_system = false
);

-- Users can delete their own patterns (not system)
CREATE POLICY "Users can delete own blueprints"
ON public.task_blueprints
FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_system = false
);

-- ============================================
-- Table: role_behaviors (Role Patterns)
-- ============================================
CREATE TABLE public.role_behaviors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  communication JSONB NOT NULL DEFAULT '{}'::jsonb,
  reactions JSONB NOT NULL DEFAULT '[]'::jsonb,
  interactions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_behaviors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for role_behaviors
-- Users can view: system patterns, their own patterns, shared patterns
CREATE POLICY "Users can view accessible behaviors"
ON public.role_behaviors
FOR SELECT
USING (
  is_system = true 
  OR auth.uid() = user_id 
  OR is_shared = true
);

-- Users can create their own patterns (not system)
CREATE POLICY "Users can create own behaviors"
ON public.role_behaviors
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_system = false
);

-- Users can update their own patterns (not system)
CREATE POLICY "Users can update own behaviors"
ON public.role_behaviors
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND is_system = false
);

-- Users can delete their own patterns (not system)
CREATE POLICY "Users can delete own behaviors"
ON public.role_behaviors
FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_system = false
);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_task_blueprints_updated_at
BEFORE UPDATE ON public.task_blueprints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_role_behaviors_updated_at
BEFORE UPDATE ON public.role_behaviors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_task_blueprints_user_id ON public.task_blueprints(user_id);
CREATE INDEX idx_task_blueprints_category ON public.task_blueprints(category);
CREATE INDEX idx_task_blueprints_is_system ON public.task_blueprints(is_system);
CREATE INDEX idx_task_blueprints_is_shared ON public.task_blueprints(is_shared);

CREATE INDEX idx_role_behaviors_user_id ON public.role_behaviors(user_id);
CREATE INDEX idx_role_behaviors_role ON public.role_behaviors(role);
CREATE INDEX idx_role_behaviors_is_system ON public.role_behaviors(is_system);
CREATE INDEX idx_role_behaviors_is_shared ON public.role_behaviors(is_shared);