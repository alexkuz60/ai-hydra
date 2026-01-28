import React, { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Message, MessageRole } from '@/types/messages';
import { UserDisplayInfo } from './ChatMessage';
import { PerModelSettingsData } from './PerModelSettings';
import { 
  Crown, 
  Brain, 
  Shield, 
  Scale, 
  Lightbulb, 
  Users, 
  Info 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ChatParticipant {
  id: string;
  type: 'supervisor' | 'ai';
  name: string;
  role?: MessageRole;
  icon: LucideIcon;
  color: string;
  messageCount: number;
  systemPrompt?: string;
}

interface ChatTreeNavProps {
  messages: Message[];
  perModelSettings: PerModelSettingsData;
  userDisplayInfo: UserDisplayInfo;
  onParticipantClick: (participantId: string) => void;
  activeParticipant: string | null;
}

const roleConfig: Record<string, { icon: LucideIcon; color: string }> = {
  user: { icon: Crown, color: 'text-amber-500' },
  assistant: { icon: Brain, color: 'text-hydra-expert' },
  critic: { icon: Shield, color: 'text-hydra-critical' },
  arbiter: { icon: Scale, color: 'text-hydra-arbiter' },
  consultant: { icon: Lightbulb, color: 'text-amber-400' },
};

function getModelShortName(modelId: string): string {
  // Extract short name from model ID like "openai/gpt-5" -> "GPT-5"
  const parts = modelId.split('/');
  const name = parts[parts.length - 1];
  return name.toUpperCase().replace(/-/g, ' ').replace(/\./g, ' ');
}

export function ChatTreeNav({
  messages,
  perModelSettings,
  userDisplayInfo,
  onParticipantClick,
  activeParticipant,
}: ChatTreeNavProps) {
  const { t } = useLanguage();

  const participants = useMemo(() => {
    const result: ChatParticipant[] = [];

    // Supervisor (all user messages)
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0 || messages.length === 0) {
      result.push({
        id: 'user',
        type: 'supervisor',
        name: userDisplayInfo.displayName || t('role.supervisor'),
        icon: Crown,
        color: 'text-amber-500',
        messageCount: userMessages.length,
      });
    }

    // AI models (group by model_name)
    const modelGroups = new Map<string, Message[]>();
    messages.filter(m => m.role !== 'user').forEach(m => {
      const key = m.model_name || 'unknown';
      const existing = modelGroups.get(key) || [];
      existing.push(m);
      modelGroups.set(key, existing);
    });

    modelGroups.forEach((msgs, modelName) => {
      const lastRole = msgs[msgs.length - 1]?.role || 'assistant';
      const settings = perModelSettings[modelName];
      const config = roleConfig[lastRole] || roleConfig.assistant;
      
      result.push({
        id: modelName,
        type: 'ai',
        name: getModelShortName(modelName),
        role: settings?.role as MessageRole || lastRole,
        icon: config.icon,
        color: config.color,
        messageCount: msgs.length,
        systemPrompt: settings?.systemPrompt,
      });
    });

    return result;
  }, [messages, perModelSettings, userDisplayInfo, t]);

  if (participants.length === 0) {
    return null;
  }

  return (
    <div className="w-56 border-r border-border bg-sidebar flex flex-col shrink-0">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-medium text-sidebar-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('chat.participants')}
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {participants.map((participant) => {
            const Icon = participant.icon;
            const roleKey = participant.role || 'assistant';
            const displayRole = roleConfig[roleKey] || roleConfig.assistant;
            
            return (
              <div
                key={participant.id}
                className={cn(
                  "relative flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all",
                  participant.type === 'ai' && "ml-4",
                  activeParticipant === participant.id && "bg-sidebar-accent",
                  "hover:bg-sidebar-accent/50"
                )}
                onClick={() => onParticipantClick(participant.id)}
              >
                {/* Tree line for AI nodes */}
                {participant.type === 'ai' && (
                  <div className="absolute -left-2 top-0 bottom-0 w-px bg-border" />
                )}

                {/* Role icon */}
                <Icon className={cn("h-4 w-4 shrink-0", participant.color)} />

                {/* Name */}
                <span className="flex-1 text-sm truncate text-sidebar-foreground">
                  {participant.name}
                </span>

                {/* Message count badge */}
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {participant.messageCount}
                </Badge>

                {/* Info tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className="p-0.5 rounded hover:bg-sidebar-accent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-1.5">
                      {participant.type === 'supervisor' ? (
                        <>
                          <p className="font-medium">{t('role.supervisor')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('chat.messagesCount')}: {participant.messageCount}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">{participant.name}</p>
                          <p className="text-xs">
                            <span className="text-muted-foreground">{t('settings.role')}:</span>{' '}
                            <span className={displayRole.color}>
                              {t(`role.${participant.role || 'assistant'}`)}
                            </span>
                          </p>
                          {participant.systemPrompt && (
                            <div className="text-xs text-muted-foreground">
                              <p className="font-medium mb-0.5">{t('settings.systemPrompt')}:</p>
                              <p className="line-clamp-3 italic">
                                {participant.systemPrompt.slice(0, 100)}
                                {participant.systemPrompt.length > 100 && '...'}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {t('chat.messagesCount')}: {participant.messageCount}
                          </p>
                        </>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
