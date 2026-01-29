import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
}

export type ToolType = 'prompt' | 'http_api';

export interface HttpConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body_template?: string;
  response_path?: string;
}

export interface CustomTool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  prompt_template: string;
  parameters: ToolParameter[];
  is_shared: boolean;
  user_id: string;
  tool_type: ToolType;
  http_config: HttpConfig | null;
}

export function useCustomTools() {
  const { user } = useAuth();
  const [tools, setTools] = useState<CustomTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTools([]);
      setLoading(false);
      return;
    }

    const fetchTools = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_tools')
          .select('id, name, display_name, description, prompt_template, parameters, is_shared, user_id, tool_type, http_config')
          .order('display_name');

        if (error) throw error;

        const parsed = (data || []).map(tool => ({
          ...tool,
          parameters: (Array.isArray(tool.parameters) 
            ? tool.parameters 
            : []) as unknown as ToolParameter[],
          tool_type: (tool.tool_type || 'prompt') as ToolType,
          http_config: (tool.http_config as unknown) as HttpConfig | null,
        }));

        setTools(parsed as CustomTool[]);
      } catch (error) {
        console.error('Failed to fetch custom tools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [user]);

  return { tools, loading };
}
