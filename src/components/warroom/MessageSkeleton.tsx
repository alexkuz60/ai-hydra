import React, { useState } from 'react';
import { Loader2, Send, CheckCircle, Clock, Coffee, RefreshCw, X, UserMinus } from 'lucide-react';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getRoleConfig, type AgentRole } from '@/config/roles';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { PendingResponseState } from '@/types/pending';

interface MessageSkeletonProps {
  pending: PendingResponseState;
  timeoutSeconds?: number;
  onRetry?: (modelId: string) => void;
  onDismiss?: (modelId: string) => void;
  onRemoveModel?: (modelId: string) => void;
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

export function MessageSkeleton({ pending, timeoutSeconds = 120, onRetry, onDismiss, onRemoveModel }: MessageSkeletonProps) {
  const { t } = useLanguage();
  const [dismissConfirmed, setDismissConfirmed] = useState(false);
  const roleConfig = getRoleConfig(pending.role);
  const RoleIcon = roleConfig.icon;
  const cardVariant = getCardVariant(pending.role);

  // Calculate progress percentage (0-100)
  const progressPercent = Math.min((pending.elapsedSeconds / timeoutSeconds) * 100, 100);
  const remainingSeconds = Math.max(timeoutSeconds - pending.elapsedSeconds, 0);

  // Timedout state - show action dialog
  if (pending.status === 'timedout') {
    return (
      <HydraCard 
        variant={cardVariant} 
        className="animate-fade-in border-amber-500/50 bg-amber-500/5"
      >
        <HydraCardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-amber-500" />
            <HydraCardTitle className="text-amber-500">
              {t('skeleton.timedout').replace('{model}', pending.modelName)}
            </HydraCardTitle>
          </div>
        </HydraCardHeader>
        
        <HydraCardContent className="pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => onRetry?.(pending.modelId)}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t('skeleton.retryRequest')}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss?.(pending.modelId)}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              {t('skeleton.dismiss')}
            </Button>
            
            <div className="flex items-center gap-1.5 ml-2">
              <Checkbox
                id={`dismiss-confirm-${pending.modelId}`}
                checked={dismissConfirmed}
                onCheckedChange={(checked) => setDismissConfirmed(checked === true)}
                className="h-3.5 w-3.5"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemoveModel?.(pending.modelId)}
                disabled={!dismissConfirmed}
                className="gap-1.5 text-destructive border-destructive/50 hover:bg-destructive/10 disabled:opacity-40"
              >
                <UserMinus className="h-3.5 w-3.5" />
                {t('skeleton.removeModel')}
              </Button>
            </div>
          </div>
        </HydraCardContent>
      </HydraCard>
    );
  }

  // Get status text and icon for normal states
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

  // Determine progress bar color based on time remaining
  const getProgressColor = () => {
    if (progressPercent >= 75) return 'bg-destructive';
    if (progressPercent >= 50) return 'bg-amber-500';
    return 'bg-primary';
  };

  return (
    <HydraCard 
      variant={cardVariant} 
      className="opacity-90"
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
          {statusDisplay?.icon}
          <span>{statusDisplay?.text}</span>
        </div>
      </HydraCardHeader>
      
      <HydraCardContent className="space-y-3">
        {/* Progress bar with remaining time */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('skeleton.timeRemaining')}</span>
            <span className={cn(
              'font-mono',
              progressPercent >= 75 && 'text-destructive',
              progressPercent >= 50 && progressPercent < 75 && 'text-amber-500'
            )}>
              {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
            </span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-linear rounded-full",
                getProgressColor()
              )}
              style={{ width: `${100 - progressPercent}%` }}
            />
          </div>
        </div>
        
        {/* Skeleton lines - 20% brighter with enhanced visibility */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-[90%] bg-muted-foreground/25" />
          <Skeleton className="h-4 w-[75%] bg-muted-foreground/25" />
          <Skeleton className="h-4 w-[60%] bg-muted-foreground/25" />
        </div>
      </HydraCardContent>
    </HydraCard>
  );
}
