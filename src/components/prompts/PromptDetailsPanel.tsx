import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Pencil, Trash2, Users, Copy, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRoleBadgeColor } from '@/config/roles';
import { format } from 'date-fns';
import type { RolePrompt } from '@/hooks/usePromptsCRUD';
import { parsePromptNickname } from '@/hooks/usePromptsCRUD';
 
 interface PromptDetailsPanelProps {
   prompt: RolePrompt | null;
   onEdit: () => void;
   onDelete: () => void;
   onDuplicate?: () => void;
 }
 
 export function PromptDetailsPanel({
   prompt,
   onEdit,
   onDelete,
   onDuplicate,
 }: PromptDetailsPanelProps) {
   const { t } = useLanguage();
 
   if (!prompt) {
     return (
       <div className="h-full flex items-center justify-center text-muted-foreground p-8">
         <div className="text-center">
           <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
           <p>{t('roleLibrary.selectPrompt')}</p>
         </div>
       </div>
     );
   }
 
   const getLanguageLabel = (lang?: string) => {
     switch (lang) {
       case 'ru': return t('roleLibrary.languageRu');
       case 'en': return t('roleLibrary.languageEn');
       default: return t('roleLibrary.languageAuto');
     }
   };
 
   const canEdit = prompt.is_owner && !prompt.is_default;
 
    return (
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                prompt.is_default ? "bg-amber-500/10" : "bg-primary/10"
              )}>
                <FileText className={cn(
                  "h-6 w-6",
                  prompt.is_default ? "text-amber-500" : "text-primary"
                )} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{parsePromptNickname(prompt.name)}</h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{prompt.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={getRoleBadgeColor(prompt.role)}>
                    {t(`role.${prompt.role}`)}
                  </Badge>
                  <Badge variant="outline">{getLanguageLabel(prompt.language)}</Badge>
                  {prompt.is_default && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 gap-1">
                      <Lock className="h-3 w-3" />
                      {t('roleLibrary.systemPrompt')}
                    </Badge>
                  )}
                  {prompt.is_shared && !prompt.is_default && (
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {t('roleLibrary.filterShared')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1">
              {onDuplicate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onDuplicate}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('common.duplicate')}</TooltipContent>
                </Tooltip>
              )}
              {canEdit && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={onEdit}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('common.edit')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={onDelete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('common.delete')}</TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
 
         {/* Description */}
         {prompt.description && (
           <section>
             <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('roleLibrary.description')}</h3>
             <p className="text-sm">{prompt.description}</p>
           </section>
         )}
 
         {/* Content */}
         <section>
           <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('roleLibrary.content')}</h3>
           <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[400px] whitespace-pre-wrap font-mono">
             {prompt.content}
           </pre>
         </section>
 
         {/* Metadata */}
         <section className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
           <span>{t('roleLibrary.usedCount').replace('{count}', String(prompt.usage_count))}</span>
           <span>•</span>
           <span>{t('common.updated')}: {format(new Date(prompt.updated_at), 'dd.MM.yyyy HH:mm')}</span>
         </section>
 
         {/* System prompt note */}
         {prompt.is_default && (
           <section className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
             <p className="text-sm text-muted-foreground">
               {t('roleLibrary.systemPromptNote')}
             </p>
           </section>
         )}
       </div>
     </ScrollArea>
   );
 }