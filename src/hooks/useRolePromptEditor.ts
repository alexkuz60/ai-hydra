import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROLE_CONFIG, DEFAULT_SYSTEM_PROMPTS, type AgentRole } from '@/config/roles';
import { parsePromptSections, sectionsToPrompt, type PromptSection } from '@/lib/promptSectionParser';
import { useLanguage } from '@/contexts/LanguageContext';

export interface PromptLibraryItem {
  id: string;
  name: string;
  content: string;
  role: string;
  is_shared: boolean;
  user_id: string;
  language: string | null;
}

const detectContentLanguage = (text: string): 'ru' | 'en' => {
  return /[а-яА-ЯёЁ]/.test(text) ? 'ru' : 'en';
};

export function useRolePromptEditor(selectedRole: AgentRole | null, userId: string | undefined) {
  const { t } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [promptName, setPromptName] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  const [editedTitle, setEditedTitle] = useState('');
  const [editedSections, setEditedSections] = useState<PromptSection[]>([]);

  const [libraryPrompts, setLibraryPrompts] = useState<PromptLibraryItem[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [selectedLibraryPrompt, setSelectedLibraryPrompt] = useState<string>('');

  const [promptOpen, setPromptOpen] = useState(true);
  const [promptPreviewOpen, setPromptPreviewOpen] = useState(false);

  // Reset when role changes
  useEffect(() => {
    setIsEditing(false);
    setEditedPrompt('');
    setPromptName('');
    setIsShared(false);
    setSelectedLibraryPrompt('');
  }, [selectedRole]);

  // Load library prompts
  useEffect(() => {
    if (!selectedRole || !userId) return;
    const load = async () => {
      setIsLoadingLibrary(true);
      try {
        const { data, error } = await supabase
          .from('prompt_library')
          .select('id, name, content, role, is_shared, user_id, language')
          .or(`user_id.eq.${userId},is_shared.eq.true`)
          .eq('role', selectedRole)
          .order('name');
        if (error) throw error;
        setLibraryPrompts(data || []);
      } catch (error) {
        console.error('Failed to load library prompts:', error);
      } finally {
        setIsLoadingLibrary(false);
      }
    };
    load();
  }, [selectedRole, userId]);

  const parsedSystemPrompt = useMemo(() => {
    if (!selectedRole) return { title: '', sections: [] };
    return parsePromptSections(DEFAULT_SYSTEM_PROMPTS[selectedRole]);
  }, [selectedRole]);

  const isPromptModified = useMemo(() => {
    const defaultPrompt = selectedRole ? DEFAULT_SYSTEM_PROMPTS[selectedRole] : '';
    return editedPrompt.trim() !== defaultPrompt.trim();
  }, [editedPrompt, selectedRole]);

  const handleStartEdit = useCallback(() => {
    if (!selectedRole) return;
    const defaultPrompt = DEFAULT_SYSTEM_PROMPTS[selectedRole];
    const parsed = parsePromptSections(defaultPrompt);
    setEditedPrompt(defaultPrompt);
    setEditedTitle(parsed.title);
    setEditedSections(parsed.sections);
    setPromptName(`${t(ROLE_CONFIG[selectedRole].label)} - Custom`);
    setIsEditing(true);
  }, [selectedRole, t]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedPrompt('');
    setEditedTitle('');
    setEditedSections([]);
    setPromptName('');
    setIsShared(false);
  }, []);

  const handleLoadFromLibrary = useCallback((promptId: string) => {
    const prompt = libraryPrompts.find(p => p.id === promptId);
    if (prompt) {
      const parsed = parsePromptSections(prompt.content);
      setEditedPrompt(prompt.content);
      setEditedTitle(parsed.title);
      setEditedSections(parsed.sections);
      setPromptName(prompt.name);
      setIsShared(prompt.is_shared);
      setSelectedLibraryPrompt(promptId);
      setIsEditing(true);
      toast.success(t('staffRoles.promptLoaded'));
    }
  }, [libraryPrompts, t]);

  const handleSectionsChange = useCallback((sections: PromptSection[]) => {
    setEditedSections(sections);
    setEditedPrompt(sectionsToPrompt(editedTitle, sections));
  }, [editedTitle]);

  const handleTitleChange = useCallback((title: string) => {
    setEditedTitle(title);
    setEditedPrompt(sectionsToPrompt(title, editedSections));
  }, [editedSections]);

  const handleLanguageSwitch = useCallback((fromLang: 'ru' | 'en', toLang: 'ru' | 'en') => {
    setPromptName(prev => {
      const fromP = `_${fromLang}_`, toP = `_${toLang}_`;
      if (prev.includes(fromP)) return prev.replace(fromP, toP);
      const fromS = ` (${fromLang.toUpperCase()})`, toS = ` (${toLang.toUpperCase()})`;
      if (prev.includes(fromS)) return prev.replace(fromS, toS);
      return `${prev} (${toLang.toUpperCase()})`;
    });
  }, []);

  const handleRestoreOriginal = useCallback((fromLang: 'ru' | 'en', toLang: 'ru' | 'en') => {
    setPromptName(prev => {
      const fromP = `_${fromLang}_`, toP = `_${toLang}_`;
      if (prev.includes(fromP)) return prev.replace(fromP, toP);
      const fromS = ` (${fromLang.toUpperCase()})`, toS = ` (${toLang.toUpperCase()})`;
      if (prev.includes(fromS)) return prev.replace(fromS, toS);
      return prev;
    });
  }, []);

  const handleSaveToLibrary = useCallback(async () => {
    if (!userId || !selectedRole || !promptName.trim() || !editedPrompt.trim()) {
      toast.error(t('common.error'));
      return;
    }
    setIsSavingPrompt(true);
    try {
      const detectedLanguage = detectContentLanguage(editedPrompt);
      const { data: inserted, error } = await supabase.from('prompt_library').insert([{
        user_id: userId,
        name: promptName.trim(),
        description: t(ROLE_CONFIG[selectedRole].description),
        content: editedPrompt.trim(),
        role: selectedRole,
        is_shared: isShared,
        language: detectedLanguage,
      }]).select('id').single();
      if (error) throw error;
      toast.success(t('staffRoles.promptSaved'));

      // Background translation to EN if content is Russian
      if (detectedLanguage === 'ru' && inserted?.id) {
        supabase.functions.invoke('translate-text', {
          body: { text: editedPrompt.trim(), targetLang: 'en' },
        }).then(({ data }) => {
          if (data?.translation) {
            supabase.from('prompt_library')
              .update({ content_en: data.translation })
              .eq('id', inserted.id)
              .then(({ error: updateErr }) => {
                if (updateErr) console.error('[PromptEditor] Failed to save EN translation:', updateErr);
              });
          }
        }).catch(e => console.warn('[PromptEditor] Translation failed:', e));
      }

      const { data } = await supabase
        .from('prompt_library')
        .select('id, name, content, role, is_shared, user_id, language')
        .or(`user_id.eq.${userId},is_shared.eq.true`)
        .eq('role', selectedRole)
        .order('name');
      setLibraryPrompts(data || []);
      setIsEditing(false);
      setEditedPrompt('');
      setPromptName('');
      setIsShared(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSavingPrompt(false);
    }
  }, [userId, selectedRole, promptName, editedPrompt, isShared, t]);

  return {
    isEditing, editedPrompt, setEditedPrompt, promptName, setPromptName,
    isShared, setIsShared, isSavingPrompt,
    editedTitle, editedSections,
    libraryPrompts, isLoadingLibrary, selectedLibraryPrompt,
    promptOpen, setPromptOpen, promptPreviewOpen, setPromptPreviewOpen,
    parsedSystemPrompt, isPromptModified,
    handleStartEdit, handleCancelEdit, handleLoadFromLibrary,
    handleSectionsChange, handleTitleChange,
    handleLanguageSwitch, handleRestoreOriginal, handleSaveToLibrary,
  };
}
