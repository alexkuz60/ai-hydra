import React from 'react';
import { ROLE_CONFIG, type AgentRole } from '@/config/roles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Pencil, X, Save, Loader2, Library, ChevronDown, FileText, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import PromptPreviewDialog from './PromptPreviewDialog';
import PromptSectionsViewer from './PromptSectionsViewer';
import PromptSectionsEditor from './PromptSectionsEditor';
import type { PromptLibraryItem } from '@/hooks/useRolePromptEditor';
import type { PromptSection } from '@/lib/promptSectionParser';

interface RolePromptSectionProps {
  selectedRole: string;
  systemPrompt: string;
  userId?: string;
  // Prompt editor hook state
  isEditing: boolean;
  editedPrompt: string;
  setEditedPrompt: (v: string) => void;
  promptName: string;
  setPromptName: (v: string) => void;
  isShared: boolean;
  setIsShared: (v: boolean) => void;
  isSavingPrompt: boolean;
  editedTitle: string;
  editedSections: PromptSection[];
  libraryPrompts: PromptLibraryItem[];
  isLoadingLibrary: boolean;
  promptOpen: boolean;
  setPromptOpen: (v: boolean) => void;
  promptPreviewOpen: boolean;
  setPromptPreviewOpen: (v: boolean) => void;
  parsedSystemPrompt: { title: string; sections: PromptSection[] };
  isPromptModified: boolean;
  // Handlers
  handleStartEdit: () => void;
  handleCancelEdit: () => void;
  handleLoadFromLibrary: (id: string) => void;
  handleSectionsChange: (sections: PromptSection[]) => void;
  handleTitleChange: (title: string) => void;
  handleLanguageSwitch: (from: 'ru' | 'en', to: 'ru' | 'en') => void;
  handleRestoreOriginal: (from: 'ru' | 'en', to: 'ru' | 'en') => void;
  handleSaveToLibrary: () => void;
  onUnsavedChange?: () => void;
}

export function RolePromptSection(props: RolePromptSectionProps) {
  const { t } = useLanguage();
  const isSystemOnly = ROLE_CONFIG[props.selectedRole as AgentRole]?.isSystemOnly;
  const {
    selectedRole, systemPrompt, userId,
    isEditing, editedPrompt, setEditedPrompt, promptName, setPromptName,
    isShared, setIsShared, isSavingPrompt,
    editedTitle, editedSections,
    libraryPrompts, isLoadingLibrary,
    promptOpen, setPromptOpen, promptPreviewOpen, setPromptPreviewOpen,
    parsedSystemPrompt, isPromptModified,
    handleStartEdit, handleCancelEdit, handleLoadFromLibrary,
    handleSectionsChange, handleTitleChange,
    handleLanguageSwitch, handleRestoreOriginal, handleSaveToLibrary,
    onUnsavedChange,
  } = props;

  // Library select (shown when not editing)
  const librarySection = userId && !isSystemOnly && libraryPrompts.length > 0 && !isEditing && (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Library className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-base font-medium text-muted-foreground">{t('staffRoles.libraryPrompts')}</h3>
      </div>
      <Select onValueChange={handleLoadFromLibrary} value="">
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('staffRoles.selectFromLibrary')} />
        </SelectTrigger>
        <SelectContent>
          {isLoadingLibrary ? (
            <div className="flex items-center justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : (
            libraryPrompts.map(prompt => (
              <SelectItem key={prompt.id} value={prompt.id}>
                <div className="flex items-center gap-2">
                  <span>{prompt.name}</span>
                  {prompt.language && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 uppercase">{prompt.language}</Badge>
                  )}
                  {prompt.is_shared && prompt.user_id !== userId && (
                    <Badge variant="outline" className="text-xs py-0">{t('roleLibrary.shared')}</Badge>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );

  if (isEditing) {
    return (
      <>
        {librarySection}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
             <h3 className="text-base font-medium text-muted-foreground">{t('staffRoles.systemPrompt')}</h3>
              {isPromptModified && <span className="inline-flex items-center justify-center w-2 h-2 bg-primary rounded-full" />}
            </div>
          </div>
          <PromptSectionsEditor
            title={editedTitle}
            sections={editedSections}
            onTitleChange={(title) => { handleTitleChange(title); onUnsavedChange?.(); }}
            onSectionsChange={(sections) => { handleSectionsChange(sections); onUnsavedChange?.(); }}
            onLanguageSwitch={handleLanguageSwitch}
            onRestoreOriginal={handleRestoreOriginal}
          />
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="promptName" className="text-base font-medium">{t('staffRoles.promptName')}</Label>
              <Input id="promptName" value={promptName} onChange={e => setPromptName(e.target.value)} placeholder={t('staffRoles.promptNamePlaceholder')} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch id="isShared" checked={isShared} onCheckedChange={setIsShared} />
                <Label htmlFor="isShared" className="text-base cursor-pointer">{t('staffRoles.shareWithTeam')}</Label>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveToLibrary} disabled={!promptName.trim() || !editedPrompt.trim() || isSavingPrompt} className="gap-1.5">
              {isSavingPrompt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('staffRoles.saveToLibrary')}
            </Button>
            <Button variant="ghost" onClick={handleCancelEdit} className="gap-1.5">
              <X className="h-4 w-4" />{t('common.cancel')}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {librarySection}
      <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 hover:text-foreground transition-colors">
             <ChevronDown className={cn("h-5 w-5 transition-transform", !promptOpen && "-rotate-90")} />
158:             <FileText className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-medium text-muted-foreground">{t('staffRoles.systemPrompt')}</h3>
            <div className="flex items-center gap-1 ml-2">
              {parsedSystemPrompt.sections.filter(s => s.content.trim()).slice(0, 4).map(section => {
                const Icon = section.icon;
                return (
                  <TooltipProvider key={section.key} delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="h-5 px-1.5 gap-1 text-[10px] font-normal"><Icon className="h-3 w-3" /></Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">{section.title}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
              {parsedSystemPrompt.sections.filter(s => s.content.trim()).length > 4 && (
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                  +{parsedSystemPrompt.sections.filter(s => s.content.trim()).length - 4}
                </Badge>
              )}
            </div>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setPromptPreviewOpen(true)} className="h-7 w-7">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{t('staffRoles.fullPreview')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {userId && !isSystemOnly && (
              <Button variant="ghost" size="sm" onClick={handleStartEdit} className="gap-1.5 h-7 text-xs">
                <Pencil className="h-3 w-3" />{t('staffRoles.editAndSave')}
              </Button>
            )}
          </div>
        </div>
        <CollapsibleContent className="pt-3">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <PromptSectionsViewer
              title={parsedSystemPrompt.title}
              sections={parsedSystemPrompt.sections}
              roleKey={selectedRole}
              fullPromptText={systemPrompt}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
      <PromptPreviewDialog open={promptPreviewOpen} onOpenChange={setPromptPreviewOpen} title={parsedSystemPrompt.title} content={systemPrompt} />
    </>
  );
}
