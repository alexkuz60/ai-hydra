 import React from 'react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { TableRow, TableCell } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
 import { Pencil, Trash2, Users, Lock, Copy, FileText } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { format } from 'date-fns';
 import { getRoleBadgeColor } from '@/config/roles';
 import type { RolePrompt } from '@/hooks/usePromptsCRUD';
 
 interface PromptRowProps {
   prompt: RolePrompt;
   isSelected: boolean;
   onSelect: (prompt: RolePrompt) => void;
   onEdit?: (prompt: RolePrompt, e: React.MouseEvent) => void;
   onDelete?: (prompt: RolePrompt, e: React.MouseEvent) => void;
   onDuplicate?: (prompt: RolePrompt, e: React.MouseEvent) => void;
 }
 
 export function PromptRow({
   prompt,
   isSelected,
   onSelect,
   onEdit,
   onDelete,
   onDuplicate,
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
         <div className="flex items-center justify-between gap-2">
           <div className="flex flex-col gap-1 flex-1 min-w-0">
             <div className="flex items-center gap-2 flex-wrap">
               <span className="font-medium truncate">{prompt.name}</span>
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
           {/* Action buttons */}
           <div className="flex items-center gap-1 shrink-0">
             {onDuplicate && (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="opacity-0 group-hover:opacity-100 transition-opacity"
                     onClick={(e) => onDuplicate(prompt, e)}
                   >
                     <Copy className="h-4 w-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>{t('common.duplicate')}</TooltipContent>
               </Tooltip>
             )}
             {prompt.is_owner && !prompt.is_default && onEdit && (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="opacity-0 group-hover:opacity-100 transition-opacity"
                     onClick={(e) => onEdit(prompt, e)}
                   >
                     <Pencil className="h-4 w-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>{t('common.edit')}</TooltipContent>
               </Tooltip>
             )}
             {prompt.is_owner && !prompt.is_default && onDelete && (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                     onClick={(e) => onDelete(prompt, e)}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>{t('common.delete')}</TooltipContent>
               </Tooltip>
             )}
           </div>
         </div>
       </TableCell>
     </TableRow>
   );
 }