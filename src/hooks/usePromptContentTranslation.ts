import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const CACHE_PREFIX = 'hydra_prompt_en_';
const CACHE_VERSION = 'v1';

interface CacheEntry {
  version: string;
  hash: number;
  content_en: string;
  timestamp: number;
}

/** Simple string hash for change detection */
function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Hook to translate prompt content on-demand and cache in localStorage.
 * Used by PromptSectionsViewer to display EN versions of Russian prompts.
 */
export function usePromptContentTranslation(promptContent: string, roleKey: string, contentEn?: string | null) {
  const { language } = useLanguage();
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isRu = language === 'ru';
  const hasDbTranslation = !isRu && !!contentEn;
  const needsTranslation = !isRu && !!promptContent && !hasDbTranslation;
  const contentHash = promptContent ? simpleHash(promptContent) : 0;
  const cacheKey = `${CACHE_PREFIX}${roleKey}`;

  // Use DB translation if available
  useEffect(() => {
    if (hasDbTranslation) {
      setTranslatedContent(contentEn!);
      return;
    }
    if (!needsTranslation) {
      setTranslatedContent(null);
      return;
    }

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);
        if (entry.version === CACHE_VERSION && entry.hash === contentHash) {
          setTranslatedContent(entry.content_en);
          return;
        }
      }
    } catch { /* ignore parse errors */ }

    setTranslatedContent(null);
  }, [hasDbTranslation, contentEn, needsTranslation, cacheKey, contentHash]);

  const translate = useCallback(async () => {
    if (!promptContent || isRu) return;
    
    // Check cache first
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);
        if (entry.version === CACHE_VERSION && entry.hash === contentHash) {
          setTranslatedContent(entry.content_en);
          return;
        }
      }
    } catch { /* ignore */ }

    setIsTranslating(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text: promptContent, targetLang: 'en' },
      });

      if (controller.signal.aborted) return;
      if (error) throw error;

      const translation = data?.translation;
      if (translation) {
        setTranslatedContent(translation);
        // Cache
        const entry: CacheEntry = {
          version: CACHE_VERSION,
          hash: contentHash,
          content_en: translation,
          timestamp: Date.now(),
        };
        try {
          localStorage.setItem(cacheKey, JSON.stringify(entry));
        } catch { /* storage full */ }
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        console.error('[usePromptContentTranslation] Error:', e);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsTranslating(false);
      }
    }
  }, [promptContent, isRu, cacheKey, contentHash]);

  // Auto-translate when EN locale and no cached translation
  useEffect(() => {
    if (needsTranslation && !translatedContent && !isTranslating) {
      translate();
    }
  }, [needsTranslation, translatedContent, isTranslating, translate]);

  // Cleanup
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  return {
    /** Translated content or null if not available */
    translatedContent,
    /** Whether translation is in progress */
    isTranslating,
    /** Manually trigger translation */
    translate,
    /** Whether we should show EN content */
    showTranslated: (needsTranslation || hasDbTranslation) && !!translatedContent,
  };
}
