import React from 'react';
import { Loader2, Send, CheckCircle, Clock } from 'lucide-react';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Skeleton } from '@/components/ui/skeleton';
import { getRoleConfig, type AgentRole } from '@/config/roles';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface PendingResponseState {
  modelId: string;
  modelName: string;
  role: AgentRole;
  status: 'sent' | 'confirmed' | 'waiting';
  startTime: number;
  elapsedSeconds: number;
}

interface MessageSkeletonProps {
  pending: PendingResponseState;
}

// Map AgentRole to HydraCard variant
function getCardVariant(role: AgentRole): 'expert' | 'critic' | 'arbiter' | 'advisor' | 'analyst' | 'archivist' | 'moderator' | 'webhunter' | 'default' {
  switch (role) {
    case 'assistant': return 'expert';
    case 'critic': return 'critic';
    case 'arbiter': return 'arbiter';
    case 'advisor': return 'advisor';
    case 'analyst': return 'analyst';
    case 'archivist': return 'archivist';
    case 'moderator': return 'moderator';
    case 'webhunter': return 'webhunter';
    default: return 'default';
  }
}

export function MessageSkeleton({ pending }: MessageSkeletonProps) {
  const { t } = useLanguage();
  const roleConfig = getRoleConfig(pending.role);
  const RoleIcon = roleConfig.icon;
  const cardVariant = getCardVariant(pending.role);

  // Get status text and icon
  const getStatusDisplay = () => {
    switch (pending.status) {
      case 'sent':
        return {
          text: t('skeleton.requestSent'),
          icon: <Send className="h-3.5 w-3.5" />,
        };
      case 'confirmed':
        return {
          text: t('skeleton.requestConfirmed'),
          icon: <CheckCircle className="h-3.5 w-3.5" />,
        };
      case 'waiting':
        return {
          text: t('skeleton.waitingSeconds').replace('{seconds}', String(pending.elapsedSeconds)),
          icon: <Clock className="h-3.5 w-3.5" />,
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <HydraCard 
      variant={cardVariant} 
      className="animate-fade-in opacity-80"
    >
      <HydraCardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RoleIcon className={cn('h-4 w-4', roleConfig.color)} />
          <HydraCardTitle className={roleConfig.color}>
            {t(`role.${pending.role}`)}
          </HydraCardTitle>
          <span className="text-xs text-muted-foreground">
            ({pending.modelName})
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {statusDisplay.icon}
          <span>{statusDisplay.text}</span>
        </div>
      </HydraCardHeader>
      
      <HydraCardContent className="space-y-2">
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[75%]" />
        <Skeleton className="h-4 w-[60%]" />
        <Skeleton className="h-4 w-[85%]" />
      </HydraCardContent>
    </HydraCard>
  );
}
