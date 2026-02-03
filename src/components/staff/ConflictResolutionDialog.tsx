import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { ROLE_CONFIG, type AgentRole } from '@/config/roles';
import { cn } from '@/lib/utils';
import type { HierarchyConflict } from '@/lib/hierarchyConflictDetector';

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: HierarchyConflict[];
  onSync: () => Promise<void>;
  isSyncing: boolean;
}

const RELATION_LABELS: Record<string, { ru: string; en: string }> = {
  defers_to: { ru: 'подчиняется', en: 'defers to' },
  challenges: { ru: 'руководит', en: 'manages' },
  collaborates: { ru: 'коллега', en: 'collaborates' },
  none: { ru: 'нет связи', en: 'no relation' },
};

function RoleBadge({ role }: { role: AgentRole }) {
  const config = ROLE_CONFIG[role];
  const Icon = config?.icon;
  
  return (
    <Badge variant="secondary" className="gap-1.5 font-normal">
      {Icon && <Icon className={cn("h-3 w-3", config?.color)} />}
      {role}
    </Badge>
  );
}

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflicts,
  onSync,
  isSyncing,
}: ConflictResolutionDialogProps) {
  const { t, language } = useLanguage();

  const getRelationLabel = (relation: string) => {
    return RELATION_LABELS[relation]?.[language] || relation;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            {t('staffRoles.hierarchy.conflicts')}
          </DialogTitle>
          <DialogDescription>
            {t('staffRoles.hierarchy.conflictsDescription')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-3 pr-4">
            {conflicts.map((conflict, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-muted/50 p-3 space-y-2"
              >
                {/* Source role's setting */}
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <RoleBadge role={conflict.sourceRole} />
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {getRelationLabel(conflict.sourceRelation)}:
                  </span>
                  <RoleBadge role={conflict.targetRole} />
                </div>

                {/* Current vs Expected */}
                <div className="pl-4 border-l-2 border-muted-foreground/30 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {t('staffRoles.hierarchy.conflictHas')}:
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {conflict.targetRole} → {getRelationLabel(conflict.targetRelation)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {t('staffRoles.hierarchy.conflictExpects')}:
                    </span>
                    <Badge variant="default" className="text-xs">
                      {conflict.targetRole} → {getRelationLabel(conflict.expectedTargetRelation)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSyncing}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onSync}
            disabled={isSyncing}
            className="gap-2"
          >
            {isSyncing && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSyncing
              ? t('staffRoles.hierarchy.syncing')
              : t('staffRoles.hierarchy.syncAll')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
