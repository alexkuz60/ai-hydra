import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  CustomTool, 
  ToolType, 
  ToolCategory,
  HttpConfig, 
  ToolParameter,
  ToolFormData,
  validateToolName,
} from '@/types/customTools';

export function useToolsCRUD() {
  const { user } = useAuth();
  const [tools, setTools] = useState<CustomTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTools = useCallback(async () => {
    if (!user) {
      setTools([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('custom_tools')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const parsed = (data || []).map((tool) => ({
        ...tool,
        parameters: (Array.isArray(tool.parameters) ? tool.parameters : []) as ToolParameter[],
        tool_type: (tool.tool_type || 'prompt') as ToolType,
        category: (tool.category || 'general') as ToolCategory,
        http_config: (tool.http_config as unknown) as HttpConfig | null,
      }));

      setTools(parsed as CustomTool[]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tools';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const createTool = useCallback(async (formData: ToolFormData): Promise<CustomTool | null> => {
    if (!user) return null;

    const validatedName = validateToolName(formData.name);
    if (!validatedName) {
      toast.error('Имя инструмента должно содержать латинские буквы');
      return null;
    }

    setSaving(true);

    try {
      const httpConfig: HttpConfig | null = formData.toolType === 'http_api' ? {
        url: formData.httpUrl.trim(),
        method: formData.httpMethod,
        headers: formData.httpHeaders.length > 0 
          ? Object.fromEntries(formData.httpHeaders.filter(h => h.key.trim()).map(h => [h.key.trim(), h.value]))
          : undefined,
        body_template: formData.httpBodyTemplate.trim() || undefined,
        response_path: formData.httpResponsePath.trim() || undefined,
      } : null;

      const { data, error } = await supabase
        .from('custom_tools')
        .insert([{
          user_id: user.id,
          name: validatedName,
          display_name: formData.displayName.trim(),
          description: formData.description.trim(),
          prompt_template: formData.toolType === 'prompt' ? formData.promptTemplate.trim() : '',
          parameters: JSON.parse(JSON.stringify(formData.parameters)),
          is_shared: formData.isShared,
          tool_type: formData.toolType,
          category: formData.category,
          http_config: httpConfig ? JSON.parse(JSON.stringify(httpConfig)) : null,
        }])
        .select()
        .single();

      if (error) throw error;

      const parsed = {
        ...data,
        parameters: Array.isArray(data.parameters) ? data.parameters : [],
        tool_type: data.tool_type as ToolType,
        category: (data.category || 'general') as ToolCategory,
        http_config: (data.http_config as unknown) as HttpConfig | null,
      } as CustomTool;

      setTools((prev) => [parsed, ...prev]);
      toast.success('Инструмент создан');
      return parsed;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create tool';
      if (message.includes('unique')) {
        toast.error('Инструмент с таким именем уже существует');
      } else {
        toast.error(message);
      }
      return null;
    } finally {
      setSaving(false);
    }
  }, [user]);

  const updateTool = useCallback(async (toolId: string, formData: ToolFormData): Promise<boolean> => {
    const validatedName = validateToolName(formData.name);
    if (!validatedName) {
      toast.error('Имя инструмента должно содержать латинские буквы');
      return false;
    }

    setSaving(true);

    try {
      const httpConfig: HttpConfig | null = formData.toolType === 'http_api' ? {
        url: formData.httpUrl.trim(),
        method: formData.httpMethod,
        headers: formData.httpHeaders.length > 0 
          ? Object.fromEntries(formData.httpHeaders.filter(h => h.key.trim()).map(h => [h.key.trim(), h.value]))
          : undefined,
        body_template: formData.httpBodyTemplate.trim() || undefined,
        response_path: formData.httpResponsePath.trim() || undefined,
      } : null;

      const { error } = await supabase
        .from('custom_tools')
        .update({
          name: validatedName,
          display_name: formData.displayName.trim(),
          description: formData.description.trim(),
          prompt_template: formData.toolType === 'prompt' ? formData.promptTemplate.trim() : '',
          parameters: JSON.parse(JSON.stringify(formData.parameters)),
          is_shared: formData.isShared,
          tool_type: formData.toolType,
          category: formData.category,
          http_config: httpConfig ? JSON.parse(JSON.stringify(httpConfig)) : null,
        })
        .eq('id', toolId);

      if (error) throw error;

      setTools((prev) =>
        prev.map((t) =>
          t.id === toolId
            ? {
                ...t,
                name: validatedName,
                display_name: formData.displayName.trim(),
                description: formData.description.trim(),
                prompt_template: formData.toolType === 'prompt' ? formData.promptTemplate.trim() : '',
                parameters: formData.parameters,
                is_shared: formData.isShared,
                tool_type: formData.toolType,
                category: formData.category,
                http_config: httpConfig,
                updated_at: new Date().toISOString(),
              }
            : t
        )
      );

      toast.success('Инструмент обновлён');
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update tool';
      if (message.includes('unique')) {
        toast.error('Инструмент с таким именем уже существует');
      } else {
        toast.error(message);
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteTool = useCallback(async (toolId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('custom_tools')
        .delete()
        .eq('id', toolId);

      if (error) throw error;

      setTools((prev) => prev.filter((t) => t.id !== toolId));
      toast.success('Инструмент удалён');
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete tool';
      toast.error(message);
      return false;
    }
  }, []);

  return {
    tools,
    loading,
    saving,
    createTool,
    updateTool,
    deleteTool,
    refetch: fetchTools,
  };
}
