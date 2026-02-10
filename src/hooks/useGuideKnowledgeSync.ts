import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { allHydrapediaSections } from '@/content/hydrapedia/_data';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Syncs all Hydrapedia content into role_knowledge for the Guide role.
 * Designed to be called once on app init or when Hydrapedia content changes.
 */
export function useGuideKnowledgeSync() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const syncingRef = useRef(false);
  const lastSyncRef = useRef<string | null>(null);

  const sync = useCallback(async () => {
    if (!user?.id || syncingRef.current) return;

    // Build a content hash to avoid redundant syncs
    const contentHash = allHydrapediaSections
      .map(s => s.id)
      .join(',');
    
    // Check localStorage for last sync hash
    const storageKey = `guide-knowledge-sync-${user.id}`;
    try {
      const last = localStorage.getItem(storageKey);
      if (last === contentHash) return; // Already synced this version
    } catch { /* ignore */ }

    syncingRef.current = true;
    try {
      const sections = allHydrapediaSections.map(s => ({
        id: s.id,
        title: s.content.ru.split('\n')[0]?.replace(/^#+\s*/, '') || s.id,
        content: s.content.ru + '\n\n---\n\n' + s.content.en,
      }));

      const { error } = await supabase.functions.invoke('sync-guide-knowledge', {
        body: { sections, user_id: user.id },
      });

      if (error) {
        console.error('[useGuideKnowledgeSync] Sync error:', error);
        return;
      }

      // Mark as synced
      try {
        localStorage.setItem(storageKey, contentHash);
      } catch { /* ignore */ }

      console.log('[useGuideKnowledgeSync] Knowledge synced successfully');
    } catch (err) {
      console.error('[useGuideKnowledgeSync] Error:', err);
    } finally {
      syncingRef.current = false;
    }
  }, [user?.id]);

  return { sync };
}
