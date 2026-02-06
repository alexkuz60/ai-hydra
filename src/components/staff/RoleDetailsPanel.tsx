import React, { forwardRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wrench, Pencil, X, Save, Loader2, Library, ChevronDown, Network, FileText, Maximize2 } from 'lucide-react';
import { ClipboardCheck } from 'lucide-react';
import PromptPreviewDialog from './PromptPreviewDialog';
import { 
  ROLE_CONFIG, 
  DEFAULT_SYSTEM_PROMPTS, 
  type AgentRole 
} from '@/config/roles';
import { cn } from '@/lib/utils';
import RoleHierarchyEditor from './RoleHierarchyEditor';
import { ConflictResolutionDialog } from './ConflictResolutionDialog';
import PromptSectionsViewer from './PromptSectionsViewer';
import PromptSectionsEditor from './PromptSectionsEditor';
import { useRoleBehavior } from '@/hooks/useRoleBehavior';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { detectConflicts, generateSyncOperations, applyOperationToInteractions, groupOperationsByRole, type HierarchyConflict } from '@/lib/hierarchyConflictDetector';
import { parsePromptSections, sectionsToPrompt, type PromptSection } from '@/lib/promptSectionParser';
import type { RoleInteractions } from '@/types/patterns';
import type { Json } from '@/integrations/supabase/types';

interface PromptLibraryItem {
  id: string;
  name: string;
  content: string;
  role: string;
  is_shared: boolean;
  user_id: string;
  language: string | null;
}

// Detect if content is primarily Russian
const detectContentLanguage = (text: string): 'ru' | 'en' => {
  return /[а-яА-ЯёЁ]/.test(text) ? 'ru' : 'en';
};

interface RoleDetailsPanelProps {
  selectedRole: AgentRole | null;
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
}

const RoleDetailsPanel = forwardRef<HTMLDivElement, RoleDetailsPanelProps>(
  ({ selectedRole, onHasUnsavedChanges }, ref) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    
    // Unsaved changes tracking for hierarchy
    const unsavedChanges = useUnsavedChanges();
    
    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [promptName, setPromptName] = useState('');
    const [isShared, setIsShared] = useState(false);
    const [isSavingPrompt, setIsSavingPrompt] = useState(false);
    
    // Parsed sections state for structured editing
    const [editedTitle, setEditedTitle] = useState('');
    const [editedSections, setEditedSections] = useState<PromptSection[]>([]);
    
    // Library state
    const [libraryPrompts, setLibraryPrompts] = useState<PromptLibraryItem[]>([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
    const [selectedLibraryPrompt, setSelectedLibraryPrompt] = useState<string>('');
    
    // Prompt viewer state
    const [promptOpen, setPromptOpen] = useState(true);
    const [promptPreviewOpen, setPromptPreviewOpen] = useState(false);
    
    // Hierarchy state
    const [hierarchyOpen, setHierarchyOpen] = useState(true);
    const [isEditingHierarchy, setIsEditingHierarchy] = useState(false);
    const [interactions, setInteractions] = useState<RoleInteractions>({
      defers_to: [],
      challenges: [],
      collaborates: [],
    });
    const [originalInteractions, setOriginalInteractions] = useState<RoleInteractions | null>(null);
    
    // Conflict resolution state
    const [conflicts, setConflicts] = useState<HierarchyConflict[]>([]);
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingInteractions, setPendingInteractions] = useState<RoleInteractions | null>(null);
    
    // Load behavior from database
    const { behavior, isLoading: isLoadingBehavior, isSaving, saveInteractions, saveRequiresApproval, fetchAllBehaviors } = useRoleBehavior(selectedRole);

    // Track changes to interactions when editing
    const handleInteractionsChange = useCallback((newInteractions: RoleInteractions) => {
      setInteractions(newInteractions);
      if (isEditingHierarchy && originalInteractions) {
        // Check if there are actual changes
        const hasChanges = JSON.stringify(newInteractions) !== JSON.stringify(originalInteractions);
        unsavedChanges.setHasUnsavedChanges(hasChanges);
      }
    }, [isEditingHierarchy, originalInteractions, unsavedChanges]);

    // Notify parent about unsaved changes state
    useEffect(() => {
      onHasUnsavedChanges?.(unsavedChanges.hasUnsavedChanges);
    }, [unsavedChanges.hasUnsavedChanges, onHasUnsavedChanges]);

    // Reset edit state when role changes (with confirmation if unsaved)
    useEffect(() => {
      if (unsavedChanges.hasUnsavedChanges) {
        return; // Don't reset if there are unsaved changes - handled by confirmation
      }
      setIsEditing(false);
      setEditedPrompt('');
      setPromptName('');
      setIsShared(false);
      setSelectedLibraryPrompt('');
      setIsEditingHierarchy(false);
    }, [selectedRole, unsavedChanges.hasUnsavedChanges]);

    // Sync interactions from loaded behavior
    useEffect(() => {
      if (behavior?.interactions) {
        setInteractions(behavior.interactions);
      } else {
        setInteractions({
          defers_to: [],
          challenges: [],
          collaborates: [],
        });
      }
    }, [behavior]);

    // Load prompts from library for selected role
    useEffect(() => {
      if (!selectedRole || !user) return;
      
      const loadLibraryPrompts = async () => {
        setIsLoadingLibrary(true);
        try {
          const { data, error } = await supabase
            .from('prompt_library')
            .select('id, name, content, role, is_shared, user_id, language')
            .or(`user_id.eq.${user.id},is_shared.eq.true`)
            .eq('role', selectedRole)
            .order('name');

          if (error) throw error;
          setLibraryPrompts(data || []);
        } catch (error: any) {
          console.error('Failed to load library prompts:', error);
        } finally {
          setIsLoadingLibrary(false);
        }
      };

      loadLibraryPrompts();
    }, [selectedRole, user]);

    const handleStartEdit = () => {
      if (!selectedRole) return;
      const defaultPrompt = DEFAULT_SYSTEM_PROMPTS[selectedRole];
      const parsed = parsePromptSections(defaultPrompt);
      setEditedPrompt(defaultPrompt);
      setEditedTitle(parsed.title);
      setEditedSections(parsed.sections);
      setPromptName(`${t(ROLE_CONFIG[selectedRole].label)} - Custom`);
      setIsEditing(true);
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
      setEditedPrompt('');
      setEditedTitle('');
      setEditedSections([]);
      setPromptName('');
      setIsShared(false);
    };

    const handleLoadFromLibrary = (promptId: string) => {
      const prompt = libraryPrompts.find(p => p.id === promptId);
      if (prompt) {
        const parsed = parsePromptSections(prompt.content);
        setEditedPrompt(prompt.content);
        setEditedTitle(parsed.title);
        setEditedSections(parsed.sections);
        setPromptName(prompt.name);
        setIsShared(prompt.is_shared);
        setSelectedLibraryPrompt(promptId);
        setIsEditing(true);
        toast.success(t('staffRoles.promptLoaded'));
      }
    };

    // Sync sections back to editedPrompt when sections change
    const handleSectionsChange = useCallback((sections: PromptSection[]) => {
      setEditedSections(sections);
      setEditedPrompt(sectionsToPrompt(editedTitle, sections));
      // Mark as unsaved when editing prompt
      unsavedChanges.setHasUnsavedChanges(true);
    }, [editedTitle, unsavedChanges]);

    const handleTitleChange = useCallback((title: string) => {
      setEditedTitle(title);
      setEditedPrompt(sectionsToPrompt(title, editedSections));
      // Mark as unsaved when editing prompt
      unsavedChanges.setHasUnsavedChanges(true);
    }, [editedSections, unsavedChanges]);

    // Parse system prompt for viewing
    const parsedSystemPrompt = useMemo(() => {
      if (!selectedRole) return { title: '', sections: [] };
      return parsePromptSections(DEFAULT_SYSTEM_PROMPTS[selectedRole]);
    }, [selectedRole]);

    // Check if prompt has been modified from default
    const isPromptModified = useMemo(() => {
      const defaultPrompt = selectedRole ? DEFAULT_SYSTEM_PROMPTS[selectedRole] : '';
      return editedPrompt.trim() !== defaultPrompt.trim();
    }, [editedPrompt, selectedRole]);

    const handleSaveToLibrary = async () => {
      if (!user || !selectedRole || !promptName.trim() || !editedPrompt.trim()) {
        toast.error(t('common.error'));
        return;
      }

      setIsSavingPrompt(true);
      try {
        // Auto-detect language from content
        const detectedLanguage = detectContentLanguage(editedPrompt);
        
        const { error } = await supabase
          .from('prompt_library')
          .insert([{
            user_id: user.id,
            name: promptName.trim(),
            description: t(ROLE_CONFIG[selectedRole].description),
            content: editedPrompt.trim(),
            role: selectedRole,
            is_shared: isShared,
            language: detectedLanguage,
          }]);

        if (error) throw error;

        toast.success(t('staffRoles.promptSaved'));
        
        // Refresh library prompts
        const { data } = await supabase
          .from('prompt_library')
          .select('id, name, content, role, is_shared, user_id, language')
          .or(`user_id.eq.${user.id},is_shared.eq.true`)
          .eq('role', selectedRole)
          .order('name');
        
        setLibraryPrompts(data || []);
        
        setIsEditing(false);
        setEditedPrompt('');
        setPromptName('');
        setIsShared(false);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsSavingPrompt(false);
      }
    };

    if (!selectedRole) {
      return (
        <div ref={ref} className="h-full flex items-center justify-center p-6">
          <p className="text-muted-foreground text-center">
            {t('staffRoles.selectRole')}
          </p>
        </div>
      );
    }

    const config = ROLE_CONFIG[selectedRole];
    const IconComponent = config.icon;
    const systemPrompt = DEFAULT_SYSTEM_PROMPTS[selectedRole];

    return (
      <div ref={ref} className="h-full flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Header with icon and name */}
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center",
                `bg-${config.color.replace('text-', '')}/10`
              )}>
                <IconComponent className={cn("h-7 w-7", config.color)} />
              </div>
              <div className="flex-1">
                <h2 className={cn("text-xl font-semibold", config.color)}>
                  {t(config.label)}
                </h2>
                <code className="text-xs text-muted-foreground font-mono">
                  {selectedRole}
                </code>
              </div>
              {config.isTechnicalStaff && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="gap-1.5">
                        <Wrench className="h-3 w-3" />
                        {t('staffRoles.technicalStaff')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{t('staffRoles.technicalStaffHint')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Description - 2 lines height */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('staffRoles.roleDescription')}
              </h3>
              <p className="text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">
                {t(config.description)}
              </p>
            </div>

            {/* Prompt Library Access */}
            {user && libraryPrompts.length > 0 && !isEditing && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Library className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t('staffRoles.libraryPrompts')}
                  </h3>
                </div>
                <Select onValueChange={handleLoadFromLibrary} value="">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('staffRoles.selectFromLibrary')} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingLibrary ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      libraryPrompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id}>
                          <div className="flex items-center gap-2">
                            <span>{prompt.name}</span>
                            {prompt.language && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 uppercase">
                                {prompt.language}
                              </Badge>
                            )}
                            {prompt.is_shared && prompt.user_id !== user?.id && (
                              <Badge variant="outline" className="text-xs py-0">
                                {t('roleLibrary.shared')}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* System Prompt */}
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {t('staffRoles.systemPrompt')}
                    </h3>
                    {isPromptModified && (
                      <span className="inline-flex items-center justify-center w-2 h-2 bg-primary rounded-full" title={t('common.unsavedChanges.title')} />
                    )}
                  </div>
                </div>

                {/* Prompt Name for Library */}
                <div className="space-y-2">
                  <Label className="text-xs">{t('staffRoles.promptName')}</Label>
                  <Input
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    placeholder={t('roleLibrary.namePlaceholder')}
                  />
                </div>

                {/* Structured Sections Editor */}
                <div className="rounded-lg border border-border bg-muted/10 p-4">
                  <PromptSectionsEditor
                    title={editedTitle}
                    sections={editedSections}
                    onTitleChange={handleTitleChange}
                    onSectionsChange={handleSectionsChange}
                  />
                </div>

                {/* Shared toggle */}
                <div className="flex items-center gap-2">
                  <Switch
                    id="prompt-shared"
                    checked={isShared}
                    onCheckedChange={setIsShared}
                  />
                  <Label htmlFor="prompt-shared" className="text-sm cursor-pointer">
                    {t('roleLibrary.isShared')}
                  </Label>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={handleSaveToLibrary}
                    disabled={isSaving || !promptName.trim() || !editedPrompt.trim()}
                    className={cn(
                      "gap-1.5 transition-all",
                      isPromptModified && "ring-2 ring-primary/50"
                    )}
                  >
                    {isSavingPrompt ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {t('staffRoles.saveToLibrary')}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="gap-1.5"
                  >
                    <X className="h-4 w-4" />
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      !promptOpen && "-rotate-90"
                    )} />
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {t('staffRoles.systemPrompt')}
                    </h3>
                    {/* Section badges */}
                    <div className="flex items-center gap-1 ml-2">
                      {parsedSystemPrompt.sections
                        .filter(s => s.content.trim())
                        .slice(0, 4)
                        .map((section) => {
                          const Icon = section.icon;
                          return (
                            <TooltipProvider key={section.key} delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant="outline" 
                                    className="h-5 px-1.5 gap-1 text-[10px] font-normal"
                                  >
                                    <Icon className="h-3 w-3" />
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {section.title}
                                </TooltipContent>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPromptPreviewOpen(true)}
                            className="h-7 w-7"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t('staffRoles.fullPreview') || 'Полный просмотр'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {user && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleStartEdit}
                        className="gap-1.5 h-7 text-xs"
                      >
                        <Pencil className="h-3 w-3" />
                        {t('staffRoles.editAndSave')}
                      </Button>
                    )}
                  </div>
                </div>
                <CollapsibleContent className="pt-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <PromptSectionsViewer
                      title={parsedSystemPrompt.title}
                      sections={parsedSystemPrompt.sections}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Full Prompt Preview Dialog */}
            <PromptPreviewDialog
              open={promptPreviewOpen}
              onOpenChange={setPromptPreviewOpen}
              title={parsedSystemPrompt.title}
              content={systemPrompt}
            />

            <Separator />

            {/* Role Hierarchy */}
            <Collapsible open={hierarchyOpen} onOpenChange={setHierarchyOpen}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    !hierarchyOpen && "-rotate-90"
                  )} />
                  <Network className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t('staffRoles.hierarchy.title')}
                  </h3>
                </CollapsibleTrigger>
                {user && (
                  <div className="flex items-center gap-1">
                    {isEditingHierarchy && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const handleCancel = () => {
                            // Restore original interactions
                            if (originalInteractions) {
                              setInteractions(originalInteractions);
                            }
                            setIsEditingHierarchy(false);
                            setOriginalInteractions(null);
                            unsavedChanges.markSaved();
                          };
                          
                          if (unsavedChanges.hasUnsavedChanges) {
                            unsavedChanges.withConfirmation(handleCancel);
                          } else {
                            handleCancel();
                          }
                        }}
                        disabled={isSaving}
                        className="gap-1.5 h-7 text-xs"
                      >
                        <X className="h-3 w-3" />
                        {t('staffRoles.hierarchy.cancel')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (isEditingHierarchy && selectedRole) {
                          // Check for conflicts before saving
                          const allBehaviors = await fetchAllBehaviors();
                          const detectedConflicts = detectConflicts(selectedRole, interactions, allBehaviors);
                          
                          if (detectedConflicts.length > 0) {
                            // Show conflict resolution dialog
                            setConflicts(detectedConflicts);
                            setPendingInteractions(interactions);
                            setShowConflictDialog(true);
                          } else {
                            // No conflicts, save directly
                            const success = await saveInteractions(interactions);
                            if (success) {
                              toast.success(t('staffRoles.hierarchy.saved'));
                              setIsEditingHierarchy(false);
                              setOriginalInteractions(null);
                              unsavedChanges.markSaved();
                            }
                          }
                        } else {
                          // Store original values before editing
                          setOriginalInteractions({ ...interactions });
                          setIsEditingHierarchy(true);
                        }
                      }}
                      disabled={isSaving || isSyncing}
                      className="gap-1.5 h-7 text-xs"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {t('staffRoles.hierarchy.saving')}
                        </>
                      ) : isEditingHierarchy ? (
                        <>
                          <Save className="h-3 w-3" />
                          {t('staffRoles.hierarchy.save')}
                        </>
                      ) : (
                        <>
                          <Pencil className="h-3 w-3" />
                          {t('staffRoles.hierarchy.edit')}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <CollapsibleContent className="pt-3">
                {isLoadingBehavior ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      {t('staffRoles.hierarchy.loading')}
                    </span>
                  </div>
                ) : (
                  <RoleHierarchyEditor
                    selectedRole={selectedRole}
                    interactions={interactions}
                    onInteractionsChange={handleInteractionsChange}
                    isEditing={isEditingHierarchy}
                  />
                )}
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Technical Staff Checkbox */}
            <div className="flex items-center gap-3 pt-2">
              <Checkbox 
                id="technicalStaff" 
                checked={config.isTechnicalStaff}
                disabled
              />
              <label 
                htmlFor="technicalStaff" 
                className="text-sm text-muted-foreground cursor-default"
              >
                {t('staffRoles.technicalStaff')}
              </label>
            </div>

            {/* Supervisor Approval Toggle */}
            {user && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <label 
                      htmlFor="requiresApproval" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {t('staffRoles.requiresApproval')}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {t('staffRoles.requiresApprovalHint')}
                    </p>
                  </div>
                </div>
                <Switch
                  id="requiresApproval"
                  checked={behavior?.requires_approval ?? false}
                  onCheckedChange={async (checked) => {
                    const success = await saveRequiresApproval(checked);
                    if (success) {
                      toast.success(t('common.saved'));
                    }
                  }}
                  disabled={isSaving || isLoadingBehavior}
                />
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Unsaved Changes Dialog */}
        <UnsavedChangesDialog
          open={unsavedChanges.showConfirmDialog}
          onConfirm={unsavedChanges.confirmAndProceed}
          onCancel={unsavedChanges.cancelNavigation}
        />
        
        {/* Conflict Resolution Dialog */}
        <ConflictResolutionDialog
          open={showConflictDialog}
          onOpenChange={setShowConflictDialog}
          conflicts={conflicts}
          isSyncing={isSyncing}
          onSync={async () => {
            if (!selectedRole || !pendingInteractions) return;
            
            setIsSyncing(true);
            try {
              // Generate sync operations
              const operations = generateSyncOperations(conflicts);
              const grouped = groupOperationsByRole(operations);
              
              // First save the current role's interactions
              const success = await saveInteractions(pendingInteractions);
              if (!success) throw new Error('Failed to save current role');
              
              // Then update all affected roles
              const allBehaviors = await fetchAllBehaviors();
              
              for (const [role, ops] of grouped) {
                let roleInteractions = allBehaviors.get(role) || {
                  defers_to: [],
                  challenges: [],
                  collaborates: [],
                };
                
                // Apply all operations for this role
                for (const op of ops) {
                  roleInteractions = applyOperationToInteractions(roleInteractions, op);
                }
                
                // Update in database
                const { error } = await supabase
                  .from('role_behaviors')
                  .update({
                    interactions: roleInteractions as unknown as Json,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('role', role);
                
                if (error) {
                  console.error(`Failed to update role ${role}:`, error);
                }
              }
              
              toast.success(t('staffRoles.hierarchy.syncSuccess'));
              setShowConflictDialog(false);
              setConflicts([]);
              setPendingInteractions(null);
              setIsEditingHierarchy(false);
              setOriginalInteractions(null);
              unsavedChanges.markSaved();
            } catch (error) {
              console.error('Sync failed:', error);
              toast.error(t('common.error'));
            } finally {
              setIsSyncing(false);
            }
          }}
        />
      </div>
    );
  }
);

RoleDetailsPanel.displayName = 'RoleDetailsPanel';

export default RoleDetailsPanel;