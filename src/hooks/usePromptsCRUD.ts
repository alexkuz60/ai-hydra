 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import type { AgentRole } from '@/config/roles';
 
 export type PromptLanguage = 'ru' | 'en' | 'auto';
 
 export interface RolePrompt {
   id: string;
   name: string;
   description: string | null;
   content: string;
   role: string;
   is_shared: boolean;
   is_default: boolean;
   usage_count: number;
   is_owner: boolean;
   language?: PromptLanguage;
   created_at: string;
   updated_at: string;
 }
 
export interface PromptFormData {
  nickname: string;       // Display name for users
  name: string;           // Technical name: [nickname]_[role]_[lang]_[custom]
  description: string;
  content: string;
  role: AgentRole;
  is_shared: boolean;
  language: PromptLanguage;
}

// Generate technical name from parts
export function generatePromptName(
  nickname: string, 
  role: AgentRole, 
  language: PromptLanguage, 
  isDefault: boolean = false
): string {
  const lang = language === 'auto' ? 'ru' : language;
  const suffix = isDefault ? 'default' : 'custom';
  const cleanNickname = nickname.trim().toLowerCase().replace(/\s+/g, '-');
  return `${cleanNickname}_${role}_${lang}_${suffix}`;
}

// Parse technical name to extract nickname for display
export function parsePromptNickname(name: string): string {
  // Pattern: [nickname]_[role]_[lang]_[default|custom]
  const parts = name.split('_');
  if (parts.length >= 4) {
    // Everything before role is nickname
    const suffix = parts[parts.length - 1];
    const lang = parts[parts.length - 2];
    const role = parts[parts.length - 3];
    
    // Validate it's a proper pattern
    if (['default', 'custom'].includes(suffix) && ['ru', 'en'].includes(lang)) {
      const nicknameIdx = parts.length - 3;
      return parts.slice(0, nicknameIdx).join('_').replace(/-/g, ' ');
    }
  }
  // Fallback: return original name
  return name;
}
 
export function getEmptyPromptFormData(): PromptFormData {
  return {
    nickname: '',
    name: '',
    description: '',
    content: '',
    role: 'assistant',
    is_shared: false,
    language: 'auto',
  };
}
 
export function promptToFormData(prompt: RolePrompt): PromptFormData {
  return {
    nickname: parsePromptNickname(prompt.name),
    name: prompt.name,
    description: prompt.description || '',
    content: prompt.content,
    role: prompt.role as AgentRole,
    is_shared: prompt.is_shared,
    language: (prompt.language as PromptLanguage) || 'auto',
  };
}
 
 export function usePromptsCRUD() {
   const { user } = useAuth();
   const [prompts, setPrompts] = useState<RolePrompt[]>([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchPrompts = useCallback(async () => {
     if (!user) {
       setPrompts([]);
       setLoading(false);
       return;
     }
 
     try {
       const { data, error } = await supabase.rpc('get_prompt_library_safe');
 
       if (error) throw error;
       setPrompts((data || []) as unknown as RolePrompt[]);
     } catch (error: unknown) {
       const message = error instanceof Error ? error.message : 'Failed to fetch prompts';
       toast.error(message);
     } finally {
       setLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchPrompts();
   }, [fetchPrompts]);
 
    const createPrompt = useCallback(async (formData: PromptFormData): Promise<RolePrompt | null> => {
      if (!user) return null;

      if (!formData.nickname.trim() || !formData.content.trim()) {
        toast.error('Псевдоним и содержимое обязательны');
        return null;
      }
 
     setSaving(true);
 
     try {
       const { error } = await supabase
         .from('prompt_library')
         .insert([{
           user_id: user.id,
           name: formData.name.trim(),
           description: formData.description.trim() || null,
           content: formData.content.trim(),
           role: formData.role,
           is_shared: formData.is_shared,
           language: formData.language,
         }]);
 
       if (error) throw error;
 
       // Refresh from backend
       await fetchPrompts();
       toast.success('Промпт создан');
       
       // Return the newly created prompt (find by name - not ideal but works)
       const newPrompts = await supabase.rpc('get_prompt_library_safe');
       const created = (newPrompts.data as unknown as RolePrompt[])?.find(
         p => p.name === formData.name.trim() && p.is_owner
       );
       return created || null;
     } catch (error: unknown) {
       const message = error instanceof Error ? error.message : 'Failed to create prompt';
       toast.error(message);
       return null;
     } finally {
       setSaving(false);
     }
   }, [user, fetchPrompts]);
 
    const updatePrompt = useCallback(async (promptId: string, formData: PromptFormData): Promise<boolean> => {
      if (!formData.nickname.trim() || !formData.content.trim()) {
        toast.error('Псевдоним и содержимое обязательны');
        return false;
      }
 
     setSaving(true);
 
     try {
       const { error } = await supabase
         .from('prompt_library')
         .update({
           name: formData.name.trim(),
           description: formData.description.trim() || null,
           content: formData.content.trim(),
           role: formData.role,
           is_shared: formData.is_shared,
           language: formData.language,
         })
         .eq('id', promptId);
 
       if (error) throw error;
 
       // Refresh from backend
       await fetchPrompts();
       toast.success('Промпт обновлён');
       return true;
     } catch (error: unknown) {
       const message = error instanceof Error ? error.message : 'Failed to update prompt';
       toast.error(message);
       return false;
     } finally {
       setSaving(false);
     }
   }, [fetchPrompts]);
 
   const deletePrompt = useCallback(async (promptId: string): Promise<boolean> => {
     try {
       const { error } = await supabase
         .from('prompt_library')
         .delete()
         .eq('id', promptId);
 
       if (error) throw error;
 
       setPrompts((prev) => prev.filter((p) => p.id !== promptId));
       toast.success('Промпт удалён');
       return true;
     } catch (error: unknown) {
       const message = error instanceof Error ? error.message : 'Failed to delete prompt';
       toast.error(message);
       return false;
     }
   }, []);
 
   return {
     prompts,
     loading,
     saving,
     createPrompt,
     updatePrompt,
     deletePrompt,
     refetch: fetchPrompts,
   };
 }