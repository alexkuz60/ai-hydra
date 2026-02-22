import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  getCachedTranslation, 
  cacheTranslation,
  getCachedTranslations,
  cacheTranslations 
} from '@/lib/translationCache';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PromptSection } from '@/lib/promptSectionParser';

interface OriginalContent {
  title: string;
  sections: PromptSection[];
}

interface UsePromptTranslationOptions {
  onTitleChange: (title: string) => void;
  onSectionsChange: (sections: PromptSection[]) => void;
  onLanguageSwitch?: (fromLang: 'ru' | 'en', toLang: 'ru' | 'en') => void;
  onRestoreOriginal?: (fromLang: 'ru' | 'en', toLang: 'ru' | 'en') => void;
}

/**
 * Hook for handling prompt translation with caching
 */
export function usePromptTranslation(
  title: string,
  sections: PromptSection[],
  options: UsePromptTranslationOptions
) {
  const { t } = useLanguage();
  const { onTitleChange, onSectionsChange, onLanguageSwitch, onRestoreOriginal } = options;
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [originalContent, setOriginalContent] = useState<OriginalContent | null>(null);

  // Detect if content is primarily Russian
  const isRussianContent = useCallback(() => {
    const allContent = title + ' ' + sections.map(s => s.content).join(' ');
    return /[а-яА-ЯёЁ]/.test(allContent);
  }, [title, sections]);

  // Restore original content
  const handleRestoreOriginal = useCallback(() => {
    if (!originalContent) return;
    
    const currentIsRussian = isRussianContent();
    
    onTitleChange(originalContent.title);
    onSectionsChange(originalContent.sections);
    setOriginalContent(null);
    
    // Notify parent to reverse language name change
    const currentLang: 'ru' | 'en' = currentIsRussian ? 'ru' : 'en';
    const originalLang: 'ru' | 'en' = currentIsRussian ? 'en' : 'ru';
    onRestoreOriginal?.(currentLang, originalLang);
    
    toast.success(t('staffRoles.originalRestored'));
  }, [originalContent, isRussianContent, onTitleChange, onSectionsChange, onRestoreOriginal, t]);

  // Translate entire prompt (title + all sections) with caching + batch API
  const handleTranslateAll = useCallback(async () => {
    const isRussian = isRussianContent();
    const targetLang = isRussian ? 'English' : 'Russian';
    
    // Save original before translating
    setOriginalContent({
      title,
      sections: sections.map(s => ({ ...s })),
    });
    
    // Check cache for all texts
    const textsToCheck = [title, ...sections.filter(s => s.content.trim()).map(s => s.content)];
    const cachedResults = getCachedTranslations(textsToCheck, targetLang);
    
    // If all are cached, use them instantly
    const allCached = textsToCheck.every(text => cachedResults.has(text));
    
    if (allCached) {
      applyTranslations(cachedResults, isRussian);
      return;
    }
    
    setIsTranslating(true);
    try {
      // Collect non-cached items for batch translation
      const itemsToTranslate: Array<{ id: string; text: string; isTitle?: boolean; sectionIdx?: number }> = [];
      
      if (!cachedResults.has(title)) {
        itemsToTranslate.push({ id: 'title', text: title, isTitle: true });
      }
      
      sections.forEach((section, idx) => {
        if (section.content.trim() && !cachedResults.has(section.content)) {
          itemsToTranslate.push({ id: `section_${idx}`, text: section.content, sectionIdx: idx });
        }
      });

      if (itemsToTranslate.length > 0) {
        // Use batch endpoint
        const { data, error } = await supabase.functions.invoke('translate-batch', {
          body: {
            items: itemsToTranslate.map(it => ({ id: it.id, text: it.text })),
            targetLang,
            verifySemantic: true,
          },
        });

        if (error) throw error;

        const results: Array<{ id: string; translation: string; cosineSimilarity?: number }> = data?.results || [];
        
        // Cache and apply
        const newTranslations: Array<{ original: string; translation: string }> = [];
        for (const item of itemsToTranslate) {
          const result = results.find(r => r.id === item.id);
          if (result?.translation) {
            cachedResults.set(item.text, result.translation);
            newTranslations.push({ original: item.text, translation: result.translation });
          }
        }
        if (newTranslations.length > 0) {
          cacheTranslations(newTranslations, targetLang);
        }

        // Log semantic quality
        if (data?.avgCosineSimilarity != null) {
          console.log(`[Translator] Avg cosine similarity: ${data.avgCosineSimilarity.toFixed(4)}`);
          const lowQuality = results.filter((r: { cosineSimilarity?: number }) => r.cosineSimilarity != null && r.cosineSimilarity < 0.85);
          if (lowQuality.length > 0) {
            console.warn(`[Translator] ${lowQuality.length} item(s) below 0.85 cosine threshold`);
          }
        }
      }
      
      applyTranslations(cachedResults, isRussian);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(t('staffRoles.translationError'));
      setOriginalContent(null);
    } finally {
      setIsTranslating(false);
    }
  }, [title, sections, isRussianContent, onTitleChange, onSectionsChange, onLanguageSwitch, t]);

  // Helper to apply translations from cache map
  const applyTranslations = useCallback((translations: Map<string, string>, isRussian: boolean) => {
    const translatedTitle = translations.get(title);
    if (translatedTitle) {
      onTitleChange(translatedTitle);
    }
    
    const updatedSections = sections.map(section => {
      if (section.content.trim()) {
        const cached = translations.get(section.content);
        if (cached) {
          return { ...section, content: cached };
        }
      }
      return section;
    });
    
    onSectionsChange(updatedSections);
    
    // Notify parent about language switch
    const fromLang: 'ru' | 'en' = isRussian ? 'ru' : 'en';
    const toLang: 'ru' | 'en' = isRussian ? 'en' : 'ru';
    onLanguageSwitch?.(fromLang, toLang);
    
    toast.success(t('staffRoles.translatedSuccess'));
  }, [title, sections, onTitleChange, onSectionsChange, onLanguageSwitch, t]);

  return {
    isTranslating,
    isRussianContent,
    originalContent,
    handleTranslateAll,
    handleRestoreOriginal,
  };
}

/**
 * Hook for single content translation (used in preview dialogs)
 */
export function useContentTranslation(content: string) {
  const { language } = useLanguage();
  const lang = (language === 'ru' || language === 'en') ? language : 'ru';
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isShowingTranslation, setIsShowingTranslation] = useState(false);

  const isRussianContent = /[а-яА-ЯёЁ]/.test(content);
  const targetLang = isRussianContent ? 'English' : 'Russian';

  const handleTranslate = useCallback(async () => {
    // If already have translation in state, toggle view
    if (translatedContent) {
      setIsShowingTranslation(!isShowingTranslation);
      return;
    }

    // Check cache first
    const cached = getCachedTranslation(content, targetLang);
    if (cached) {
      setTranslatedContent(cached);
      setIsShowingTranslation(true);
      return;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text: content, targetLang },
      });

      if (error) throw error;
      if (data?.translation) {
        cacheTranslation(content, data.translation, targetLang);
        setTranslatedContent(data.translation);
        setIsShowingTranslation(true);
        toast.success(
          lang === 'ru' 
            ? `Переведено на ${isRussianContent ? 'английский' : 'русский'}` 
            : `Translated to ${isRussianContent ? 'English' : 'Russian'}`
        );
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(lang === 'ru' ? 'Ошибка перевода' : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  }, [content, translatedContent, isShowingTranslation, targetLang, isRussianContent, lang]);

  const reset = useCallback(() => {
    setTranslatedContent(null);
    setIsShowingTranslation(false);
  }, []);

  return {
    isTranslating,
    isRussianContent,
    isShowingTranslation,
    translatedContent,
    displayContent: isShowingTranslation && translatedContent ? translatedContent : content,
    handleTranslate,
    reset,
  };
}
