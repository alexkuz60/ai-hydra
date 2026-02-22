import React from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { getRatingsText } from './i18n';

interface ContestFollowUpInputProps {
  isRu: boolean;
  activeModel: string;
  onActiveModelChange: (model: string) => void;
  followUpText: string;
  onFollowUpTextChange: (text: string) => void;
  onSend: () => void;
  sending: boolean;
  executing: boolean;
  sessionStatus: string | undefined;
  currentRoundIndex: number;
}

export function ContestFollowUpInput({
  isRu,
  activeModel,
  onActiveModelChange,
  followUpText,
  onFollowUpTextChange,
  onSend,
  sending,
  executing,
  sessionStatus,
  currentRoundIndex,
}: ContestFollowUpInputProps) {
  return (
    <div className="border-t border-border px-3 py-2 flex-shrink-0">
      {activeModel !== 'all' && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <Badge variant="outline" className="text-[10px] gap-1 border-primary/40 bg-primary/5">
            {(() => {
              const entry = getModelRegistryEntry(activeModel);
              const ProviderLogo = entry?.provider ? PROVIDER_LOGOS[entry.provider] : undefined;
              const color = entry?.provider ? PROVIDER_COLORS[entry.provider] : '';
              const name = entry?.displayName || activeModel.split('/').pop() || activeModel;
              return (
                <>
                  {ProviderLogo && <ProviderLogo className={cn("h-2.5 w-2.5", color)} />}
                  {`${getRatingsText('followUpQuestionForLabel', isRu)} ${name}`}
                </>
              );
            })()}
          </Badge>
          <button
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => onActiveModelChange('all')}
          >
            {getRatingsText('followUpAllLabel', isRu)}
          </button>
        </div>
      )}
      {currentRoundIndex > 0 && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <Badge variant="secondary" className="text-[10px] gap-1 py-0.5 px-2">
            <MessageSquare className="h-3 w-3 opacity-70" />
            {isRu
              ? `с контекстом ${currentRoundIndex} ${currentRoundIndex === 1 ? 'тура' : currentRoundIndex < 5 ? 'туров' : 'туров'}`
              : `with ${currentRoundIndex} round${currentRoundIndex !== 1 ? 's' : ''} context`}
          </Badge>
        </div>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          value={followUpText}
          onChange={e => onFollowUpTextChange(e.target.value)}
          placeholder={
            activeModel === 'all'
              ? getRatingsText('followUpQuestionForAll', isRu)
              : `${getRatingsText('questionForModel', isRu).replace('{model}', getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop() || '')}`
          }
          className="min-h-[36px] max-h-[100px] text-sm resize-none"
          rows={1}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (followUpText.trim() && sessionStatus === 'running' && !sending && !executing) {
                onSend();
              }
            }
          }}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                disabled={!followUpText.trim() || sessionStatus !== 'running' || sending || executing}
                onClick={onSend}
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
               {activeModel === 'all'
                 ? getRatingsText('followUpSendAll', isRu)
                 : `${getRatingsText('followUpSendModel', isRu)} ${getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop()}`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
