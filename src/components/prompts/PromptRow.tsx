import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Lock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getRoleBadgeColor } from '@/config/roles';
import type { RolePrompt } from '@/hooks/usePromptsCRUD';
import { parsePromptNickname } from '@/hooks/usePromptsCRUD';

function getPromptDisplayName(prompt: RolePrompt, t: (key: string) => string): string {
  if (prompt.is_default) {
    // For system prompts, show localized role name + "System"
    const roleLabel = t(`role.${prompt.role}`);
    return `${roleLabel} — System`;
  }
  return parsePromptNickname(prompt.name);
}

interface PromptRowProps {
  prompt: RolePrompt;
  isSelected: boolean;
  hasUnsavedChanges?: boolean;
  onSelect: (prompt: RolePrompt) => void;
}
 
 export function PromptRow({
   prompt,
   isSelected,
   hasUnsavedChanges,
   onSelect,
 }: PromptRowProps) {
   const { t } = useLanguage();
 
   const getLanguageLabel = (lang?: string) => {
     switch (lang) {
       case 'ru': return 'RU';
       case 'en': return 'EN';
       default: return 'Auto';
     }
   };
 
   return (
     <TableRow
       className={cn(
         'cursor-pointer transition-colors group',
         isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'
       )}
       onClick={() => onSelect(prompt)}
     >
       <TableCell className="pl-6">
         <div className={cn(
           "w-10 h-10 rounded-lg flex items-center justify-center",
           prompt.is_default ? "bg-amber-500/10" : "bg-primary/10"
         )}>
           <FileText className={cn(
             "h-5 w-5",
             prompt.is_default ? "text-amber-500" : "text-primary"
           )} />
         </div>
       </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{getPromptDisplayName(prompt, t)}</span>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-hydra-warning animate-pulse-glow shrink-0" title="Unsaved changes" />
              )}
              <Badge className={getRoleBadgeColor(prompt.role)}>
                {t(`role.${prompt.role}`)}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {getLanguageLabel(prompt.language)}
              </Badge>
              {prompt.is_default && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>{t('roleLibrary.systemPrompt')}</TooltipContent>
                </Tooltip>
              )}
              {prompt.is_shared && !prompt.is_default && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>{t('roleLibrary.filterShared')}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{t('roleLibrary.usedCount').replace('{count}', String(prompt.usage_count))}</span>
              <span>{format(new Date(prompt.updated_at), 'dd.MM.yyyy')}</span>
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  }