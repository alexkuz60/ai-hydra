import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AgentRole } from '@/config/roles';

interface UseStaffSeedActionsOptions {
  technicalRoles: AgentRole[];
  language: string;
}

export function useStaffSeedActions({ technicalRoles, language }: UseStaffSeedActionsOptions) {
  const [isBulkSeeding, setIsBulkSeeding] = useState(false);
  const [isForceSyncing, setIsForceSyncing] = useState(false);
  const isRu = language === 'ru';

  const handleBulkSeed = useCallback(async () => {
    setIsBulkSeeding(true);
    let totalSeeded = 0;
    let rolesProcessed = 0;
    let skipped = 0;

    try {
      // Check which roles need force re-seed (missing source_title_en)
      const { data: missingEn } = await supabase
        .from('role_knowledge')
        .select('role')
        .is('source_title_en', null)
        .in('category', ['documentation', 'standard', 'procedure', 'system_prompt']);
      const rolesNeedingForce = new Set(missingEn?.map(r => r.role) || []);

      for (const role of technicalRoles) {
        const needsForce = rolesNeedingForce.has(role);
        const { data, error } = await supabase.functions.invoke('seed-role-knowledge', {
          body: { role, include_system_prompt: true, force: needsForce },
        });
        if (error) { console.error(`[BulkSeed] Error for ${role}:`, error); continue; }
        if (data?.skipped) { skipped++; }
        else if (data?.seeded > 0) { totalSeeded += data.seeded; rolesProcessed++; }
      }

      if (totalSeeded > 0) {
        toast.success(
          isRu
            ? `Загружено ${totalSeeded} фрагментов для ${rolesProcessed} ролей${skipped > 0 ? ` (${skipped} пропущено)` : ''}`
            : `Loaded ${totalSeeded} chunks for ${rolesProcessed} roles${skipped > 0 ? ` (${skipped} skipped)` : ''}`
        );
      } else if (skipped === technicalRoles.length) {
        toast.info(
          isRu
            ? 'Все техроли уже имеют знания. Используйте пересидинг на вкладке роли.'
            : 'All tech roles already have knowledge. Use re-seed in role tab.'
        );
      } else {
        toast.info(isRu ? 'Нет новых знаний для загрузки' : 'No new knowledge to load');
      }
    } catch (error) {
      console.error('[BulkSeed] Error:', error);
      toast.error(isRu ? 'Ошибка массовой загрузки' : 'Bulk seed failed');
    } finally {
      setIsBulkSeeding(false);
    }
  }, [technicalRoles, isRu]);

  const handleForceSeed = useCallback(async () => {
    setIsForceSyncing(true);
    try {
      let totalSeeded = 0;
      for (const role of technicalRoles) {
        const { data, error } = await supabase.functions.invoke('seed-role-knowledge', {
          body: { role, include_system_prompt: true, force: true },
        });
        if (error) { console.error(`[ForceSeed] Error for ${role}:`, error); continue; }
        if (data?.seeded > 0) totalSeeded += data.seeded;
      }
      toast.success(
        isRu
          ? `Принудительно обновлено ${totalSeeded} фрагментов знаний`
          : `Force-refreshed ${totalSeeded} knowledge chunks`
      );
    } catch (error) {
      console.error('[ForceSeed] Error:', error);
      toast.error(isRu ? 'Ошибка обновления' : 'Force refresh failed');
    } finally {
      setIsForceSyncing(false);
    }
  }, [technicalRoles, isRu]);

  return { isBulkSeeding, isForceSyncing, handleBulkSeed, handleForceSeed };
}
