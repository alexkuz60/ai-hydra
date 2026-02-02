import React from 'react';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { getRoleConfig, type AgentRole } from '@/config/roles';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Square, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { StreamingResponse } from '@/hooks/useStreamingResponses';

interface StreamingMessageCardProps {
  response: StreamingResponse;
  onStop?: (modelId: string) => void;
  onCopyToMainChat?: (content: string) => void;
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

export function StreamingMessageCard({
  response,
  onStop,
  onCopyToMainChat,
}: StreamingMessageCardProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const roleConfig = getRoleConfig(response.role);
  const RoleIcon = roleConfig.icon;
  const cardVariant = getCardVariant(response.role);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.content);
      setCopied(true);
      toast.success(t('message.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleCopyToChat = () => {
    onCopyToMainChat?.(response.content);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      layout
    >
      <HydraCard 
        variant={cardVariant} 
        className={cn(
          response.isStreaming && 'border-primary/50'
        )}
      >
        <HydraCardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RoleIcon className={cn('h-4 w-4', roleConfig.color)} />
            <HydraCardTitle className={roleConfig.color}>
              {t(`role.${response.role}`)}
            </HydraCardTitle>
            <span className="text-xs text-muted-foreground">
              ({response.modelName})
            </span>
            {response.isStreaming && (
              <span className="text-xs text-primary animate-pulse">
                {t('streaming.generating')}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {response.isStreaming ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onStop?.(response.modelId)}
                title={t('streaming.stop')}
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCopy}
                  title={t('message.copy')}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-hydra-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                {onCopyToMainChat && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleCopyToChat}
                  >
                    {t('dchat.copyToChat')}
                  </Button>
                )}
              </>
            )}
          </div>
        </HydraCardHeader>
        
        <HydraCardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer 
              content={response.content + (response.isStreaming ? '▌' : '')}
              streaming={response.isStreaming}
            />
          </div>
        </HydraCardContent>
      </HydraCard>
    </motion.div>
  );
}
