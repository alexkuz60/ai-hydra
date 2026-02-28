import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useKnowledgeStaleness, StalenessInfo } from '@/hooks/useKnowledgeStaleness';

interface StalenessWarningBannerProps {
  /** Roles to check. If omitted, checks all active assignments. */
  roles?: string[];
  /** Language flag */
  isRu: boolean;
  /** Compact mode — shows only badges, no full alert */
  compact?: boolean;
}

const TEXTS = {
  knowledgeDrift: {
    ru: (role: string, count: number) => `Роль «${role}»: знания обновлены ${count} раз(а) после найма`,
    en: (role: string, count: number) => `Role "${role}": knowledge updated ${count} time(s) since hire`,
  },
  modelChanged: {
    ru: (role: string, from: string, to: string) => `Роль «${role}»: модель изменена (${from} → ${to})`,
    en: (role: string, from: string, to: string) => `Role "${role}": model changed (${from} → ${to})`,
  },
  recertRequired: {
    ru: 'Рекомендуется переаттестация',
    en: 'Recertification recommended',
  },
};

function formatStaleness(info: StalenessInfo, isRu: boolean): string {
  const parts: string[] = [];
  if (info.updatesSinceHire >= 2) {
    parts.push(isRu
      ? TEXTS.knowledgeDrift.ru(info.role, info.updatesSinceHire)
      : TEXTS.knowledgeDrift.en(info.role, info.updatesSinceHire));
  }
  if (info.modelChanged && info.hiredModel && info.currentModel) {
    const from = info.hiredModel.split('/').pop() || info.hiredModel;
    const to = info.currentModel.split('/').pop() || info.currentModel;
    parts.push(isRu
      ? TEXTS.modelChanged.ru(info.role, from, to)
      : TEXTS.modelChanged.en(info.role, from, to));
  }
  return parts.join('; ');
}

/**
 * Reusable staleness warning banner for D-Chat, SPRZ, and Contest/Duel pages.
 * Shows warnings when active role assignments have outdated knowledge or changed default models.
 */
export function StalenessWarningBanner({ roles, isRu, compact }: StalenessWarningBannerProps) {
  const { staleRoles, hasStaleRoles, loading } = useKnowledgeStaleness(roles);

  if (loading || !hasStaleRoles) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {staleRoles.map(info => (
          <Badge
            key={info.role}
            variant="outline"
            className="gap-1 text-[10px] py-0 text-hydra-warning border-hydra-warning/30 animate-pulse"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            {info.role}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <Alert className="border-hydra-warning/30 bg-hydra-warning/5">
      <AlertTriangle className="h-4 w-4 text-hydra-warning" />
      <AlertDescription className="text-xs space-y-0.5">
        {staleRoles.map(info => (
          <div key={info.role}>
            {formatStaleness(info, isRu)}
            <span className="text-hydra-warning ml-1 font-medium">
              — {isRu ? TEXTS.recertRequired.ru : TEXTS.recertRequired.en}
            </span>
          </div>
        ))}
      </AlertDescription>
    </Alert>
  );
}
