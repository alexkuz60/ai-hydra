import React, { useState, useMemo, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Sparkles, ChevronDown, ChevronRight, Plus, Loader2, Wrench, Settings2 } from 'lucide-react';
import { ROLE_CONFIG } from '@/config/roles';
import PatternDetailsPanel from '@/components/patterns/PatternDetailsPanel';
import { BlueprintRow } from '@/components/patterns/BlueprintRow';
import { BehaviorRow } from '@/components/patterns/BehaviorRow';
import { isTaskBlueprint } from '@/types/patterns';
import { usePatterns, type TaskBlueprintWithMeta, type RoleBehaviorWithMeta } from '@/hooks/usePatterns';
import type { TaskBlueprint, RoleBehavior } from '@/types/patterns';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useNavigatorResize } from '@/hooks/useNavigatorResize';
import { NavigatorHeader } from '@/components/layout/NavigatorHeader';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type SelectedPattern = TaskBlueprint | RoleBehavior | null;

const BehavioralPatterns = () => {
  const { t } = useLanguage();
  const { isAdmin } = useUserRoles();
  const { blueprints: allBlueprints, behaviors: allBehaviors, isLoading, isSaving, saveBlueprint, saveBehavior, deleteBlueprint, deleteBehavior } = usePatterns();
  
  // Filter out system patterns for non-admins
  const blueprints = useMemo(() => 
    isAdmin ? allBlueprints : allBlueprints.filter(b => !b.meta.isSystem),
    [allBlueprints, isAdmin]
  );
  
  const behaviors = useMemo(() => 
    isAdmin ? allBehaviors : allBehaviors.filter(b => !b.meta.isSystem),
    [allBehaviors, isAdmin]
  );
  
  // Split behaviors into experts and technical staff
  const expertBehaviors = useMemo(() => 
    behaviors.filter(b => !ROLE_CONFIG[b.role]?.isTechnicalStaff),
    [behaviors]
  );
  
  // Further split expert behaviors into default (system) and custom
  const defaultExpertBehaviors = useMemo(() => 
    expertBehaviors.filter(b => b.meta.isSystem),
    [expertBehaviors]
  );
  
  const customExpertBehaviors = useMemo(() => 
    expertBehaviors.filter(b => !b.meta.isSystem),
    [expertBehaviors]
  );
  
  const techBehaviors = useMemo(() => 
    behaviors.filter(b => ROLE_CONFIG[b.role]?.isTechnicalStaff),
    [behaviors]
  );
  
  const [selectedPattern, setSelectedPattern] = useState<SelectedPattern>(null);
  const [strategicExpanded, setStrategicExpanded] = useState(true);
  const [expertExpanded, setExpertExpanded] = useState(true);
  const [defaultExpertExpanded, setDefaultExpertExpanded] = useState(true);
  const [techExpanded, setTechExpanded] = useState(true);
  
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editingType, setEditingType] = useState<'blueprint' | 'behavior' | null>(null);
  
  // Unsaved changes protection
  const {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    showConfirmDialog,
    withConfirmation,
    confirmAndProceed,
    cancelNavigation,
    markSaved,
  } = useUnsavedChanges();
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patternToDelete, setPatternToDelete] = useState<{ id: string; name: string; type: 'blueprint' | 'behavior' } | null>(null);

  // Navigator resize
  const nav = useNavigatorResize({ storageKey: 'behavioral-patterns', defaultMaxSize: 35 });

  const selectedId = useMemo(() => {
    if (!selectedPattern) return null;
    return selectedPattern.id;
  }, [selectedPattern]);

  // Find meta for selected pattern
  const selectedMeta = useMemo(() => {
    if (!selectedPattern) return null;
    const bp = blueprints.find(b => b.id === selectedPattern.id);
    if (bp) return bp.meta;
    const bh = behaviors.find(b => b.id === selectedPattern.id);
    return bh?.meta || null;
  }, [selectedPattern, blueprints, behaviors]);

  // Blueprint handlers
  const handleCreateBlueprint = useCallback(() => {
    const doCreate = () => {
      const newBlueprint: TaskBlueprint = {
        id: '' as unknown as string,
        name: '',
        category: 'planning',
        description: '',
        stages: [{ name: '', roles: [], objective: '', deliverables: [] }],
        checkpoints: [],
      };
      setSelectedPattern(newBlueprint);
      setIsEditing(true);
      setEditingType('blueprint');
      markSaved();
    };
    
    if (isEditing && hasUnsavedChanges) {
      withConfirmation(doCreate);
    } else {
      doCreate();
    }
  }, [isEditing, hasUnsavedChanges, withConfirmation, markSaved]);

  const handleEditBlueprint = useCallback((pattern: TaskBlueprintWithMeta, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    const doEdit = () => {
      setSelectedPattern(pattern);
      setIsEditing(true);
      setEditingType('blueprint');
      markSaved();
    };
    
    if (isEditing && hasUnsavedChanges) {
      withConfirmation(doEdit);
    } else {
      doEdit();
    }
  }, [isEditing, hasUnsavedChanges, withConfirmation, markSaved]);

  const handleDuplicateBlueprint = useCallback((pattern: TaskBlueprintWithMeta, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    const doDuplicate = () => {
      setSelectedPattern({ ...pattern, id: undefined as unknown as string, name: `${pattern.name} (копия)` });
      setIsEditing(true);
      setEditingType('blueprint');
      markSaved();
    };
    
    if (isEditing && hasUnsavedChanges) {
      withConfirmation(doDuplicate);
    } else {
      doDuplicate();
    }
  }, [isEditing, hasUnsavedChanges, withConfirmation, markSaved]);

  const handleDeleteBlueprint = useCallback((pattern: TaskBlueprintWithMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    setPatternToDelete({ id: pattern.id, name: pattern.name, type: 'blueprint' });
    setDeleteDialogOpen(true);
  }, []);

  // Behavior handlers
  const handleCreateBehavior = useCallback(() => {
    const doCreate = () => {
      const newBehavior: RoleBehavior = {
        id: '' as unknown as string,
        role: 'assistant',
        communication: { tone: 'friendly', verbosity: 'adaptive', format_preference: [] },
        reactions: [{ trigger: '', behavior: '' }],
        interactions: { defers_to: [], challenges: [], collaborates: [] },
      };
      setSelectedPattern(newBehavior);
      setIsEditing(true);
      setEditingType('behavior');
      markSaved();
    };
    
    if (isEditing && hasUnsavedChanges) {
      withConfirmation(doCreate);
    } else {
      doCreate();
    }
  }, [isEditing, hasUnsavedChanges, withConfirmation, markSaved]);

  const handleEditBehavior = useCallback((pattern: RoleBehaviorWithMeta, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    const doEdit = () => {
      setSelectedPattern(pattern);
      setIsEditing(true);
      setEditingType('behavior');
      markSaved();
    };
    
    if (isEditing && hasUnsavedChanges) {
      withConfirmation(doEdit);
    } else {
      doEdit();
    }
  }, [isEditing, hasUnsavedChanges, withConfirmation, markSaved]);

  const handleDuplicateBehavior = useCallback((pattern: RoleBehaviorWithMeta, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    const doDuplicate = () => {
      setSelectedPattern({ ...pattern, id: undefined as unknown as string });
      setIsEditing(true);
      setEditingType('behavior');
      markSaved();
    };
    
    if (isEditing && hasUnsavedChanges) {
      withConfirmation(doDuplicate);
    } else {
      doDuplicate();
    }
  }, [isEditing, hasUnsavedChanges, withConfirmation, markSaved]);

  const handleDeleteBehavior = useCallback((pattern: RoleBehaviorWithMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    const config = ROLE_CONFIG[pattern.role];
    setPatternToDelete({ id: pattern.id, name: t(config?.label || pattern.role), type: 'behavior' });
    setDeleteDialogOpen(true);
  }, [t]);

  // Common handlers
  const handleCancelEdit = useCallback(() => {
    const doCancel = () => {
      setIsEditing(false);
      setEditingType(null);
      markSaved();
      if (selectedPattern && !selectedPattern.id) {
        setSelectedPattern(null);
      }
    };
    
    if (hasUnsavedChanges) {
      withConfirmation(doCancel);
    } else {
      doCancel();
    }
  }, [hasUnsavedChanges, withConfirmation, markSaved, selectedPattern]);
  
  const handleSelectPattern = useCallback((pattern: SelectedPattern) => {
    const doSelect = () => {
      setSelectedPattern(pattern);
      setIsEditing(false);
      setEditingType(null);
      markSaved();
    };
    
    if (isEditing && hasUnsavedChanges) {
      withConfirmation(doSelect);
    } else {
      doSelect();
    }
  }, [isEditing, hasUnsavedChanges, withConfirmation, markSaved]);

  const handleSaveBehaviorInline = useCallback(async (data: Omit<RoleBehavior, 'id'> & { id?: string }, isShared: boolean) => {
    await saveBehavior(data, isShared);
    setIsEditing(false);
    setEditingType(null);
    markSaved();
    const savedBehavior = behaviors.find(b => b.role === data.role);
    if (savedBehavior) {
      setSelectedPattern(savedBehavior);
    }
  }, [saveBehavior, behaviors, markSaved]);

  const handleSaveBlueprintInline = useCallback(async (data: Omit<TaskBlueprint, 'id'> & { id?: string }, isShared: boolean) => {
    await saveBlueprint(data, isShared);
    setIsEditing(false);
    setEditingType(null);
    markSaved();
    const savedBlueprint = blueprints.find(b => b.name === data.name);
    if (savedBlueprint) {
      setSelectedPattern(savedBlueprint);
    }
  }, [saveBlueprint, blueprints, markSaved]);

  const confirmDelete = async () => {
    if (!patternToDelete) return;
    
    if (patternToDelete.type === 'blueprint') {
      await deleteBlueprint(patternToDelete.id);
    } else {
      await deleteBehavior(patternToDelete.id);
    }
    
    if (selectedPattern?.id === patternToDelete.id) {
      setSelectedPattern(null);
    }
    
    setDeleteDialogOpen(false);
    setPatternToDelete(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="px-4 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('nav.behavioralPatterns')}</h1>
            <p className="text-sm text-muted-foreground">{t('patterns.description')}</p>
          </div>
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel 
            ref={nav.panelRef}
            defaultSize={nav.panelSize} 
            minSize={4} 
            maxSize={50}
            onResize={nav.onPanelResize}
          >
            <div className="h-full flex flex-col hydra-nav-surface">
              <NavigatorHeader
                title={t('nav.behavioralPatterns')}
                isMinimized={nav.isMinimized}
                onToggle={nav.toggle}
              />
              <div className="flex-1 overflow-auto">
              {nav.isMinimized ? (
                <TooltipProvider delayDuration={200}>
                  <div className="p-1 space-y-1">
                    {blueprints.map((pattern) => (
                      <Tooltip key={pattern.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "relative flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                              selectedId === pattern.id ? "bg-primary/10" : "hover:bg-muted/30"
                            )}
                            onClick={() => handleSelectPattern(pattern)}
                          >
                            <Target className="h-5 w-5 text-primary" />
                            {selectedId === pattern.id && hasUnsavedChanges && (
                              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-hydra-warning animate-pulse-glow" />
                            )}
                           </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[220px]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">{pattern.name}</span>
                            </div>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              <li>• {t(`patterns.category.${pattern.category}`)}</li>
                              <li>• {pattern.stages?.length || 0} {t('patterns.stages')}</li>
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {behaviors.map((pattern) => {
                      const config = ROLE_CONFIG[pattern.role];
                      const Icon = config?.icon || Sparkles;
                      return (
                        <Tooltip key={pattern.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "relative flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                                selectedId === pattern.id ? "bg-primary/10" : "hover:bg-muted/30"
                              )}
                              onClick={() => handleSelectPattern(pattern)}
                            >
                              <Icon className={cn("h-5 w-5", config?.color)} />
                              {selectedId === pattern.id && hasUnsavedChanges && (
                                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-hydra-warning animate-pulse-glow" />
                              )}
                             </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[220px]">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Icon className={cn("h-4 w-4", config?.color)} />
                                <span className="font-medium text-sm">{t(config?.label || pattern.role)}</span>
                              </div>
                              <ul className="text-xs text-muted-foreground space-y-0.5">
                                <li>• {config?.isTechnicalStaff ? t('patterns.technicalGroup') : t('patterns.expertGroup')}</li>
                                <li>• {pattern.role}</li>
                              </ul>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">{t('staffRoles.icon')}</TableHead>
                    <TableHead>{t('patterns.pattern')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Strategic Patterns Group */}
                  <TableRow
                    className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setStrategicExpanded(!strategicExpanded)}
                  >
                    <TableCell colSpan={2} className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {strategicExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Target className="h-4 w-4" />
                        {t('patterns.strategicGroup')}
                        <Badge variant="outline" className="ml-2 text-xs">{blueprints.length}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-6 px-2"
                          onClick={(e) => { e.stopPropagation(); handleCreateBlueprint(); }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {t('patterns.createNew')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {strategicExpanded && blueprints.map((pattern) => (
                    <BlueprintRow
                      key={pattern.id}
                      pattern={pattern}
                      isSelected={selectedId === pattern.id}
                      hasUnsavedChanges={selectedId === pattern.id && hasUnsavedChanges}
                      onSelect={handleSelectPattern}
                      onEdit={handleEditBlueprint}
                      onDuplicate={handleDuplicateBlueprint}
                      onDelete={handleDeleteBlueprint}
                    />
                  ))}

                  {/* Expert Behaviors Group */}
                  <TableRow
                    className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setExpertExpanded(!expertExpanded)}
                  >
                    <TableCell colSpan={2} className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {expertExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Sparkles className="h-4 w-4" />
                        {t('patterns.expertGroup')}
                        <Badge variant="outline" className="ml-2 text-xs">{expertBehaviors.length}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-6 px-2"
                          onClick={(e) => { e.stopPropagation(); handleCreateBehavior(); }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {t('patterns.createNew')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Custom expert behaviors (non-system) */}
                  {expertExpanded && customExpertBehaviors.map((pattern) => (
                    <BehaviorRow
                      key={pattern.id}
                      pattern={pattern}
                      isSelected={selectedId === pattern.id}
                      hasUnsavedChanges={selectedId === pattern.id && hasUnsavedChanges}
                      onSelect={handleSelectPattern}
                      onEdit={handleEditBehavior}
                      onDuplicate={handleDuplicateBehavior}
                      onDelete={handleDeleteBehavior}
                    />
                  ))}
                  
                  {/* Default expert behaviors subsection (system) */}
                  {expertExpanded && defaultExpertBehaviors.length > 0 && (
                    <TableRow
                      className="bg-muted/20 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setDefaultExpertExpanded(!defaultExpertExpanded)}
                    >
                      <TableCell colSpan={2} className="py-1.5 pl-8">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          {defaultExpertExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          <Settings2 className="h-3 w-3" />
                          {t('patterns.defaultBehaviors')}
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">{defaultExpertBehaviors.length}</Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {expertExpanded && defaultExpertExpanded && defaultExpertBehaviors.map((pattern) => (
                    <BehaviorRow
                      key={pattern.id}
                      pattern={pattern}
                      isSelected={selectedId === pattern.id}
                      hasUnsavedChanges={selectedId === pattern.id && hasUnsavedChanges}
                      onSelect={handleSelectPattern}
                      onEdit={handleEditBehavior}
                      onDuplicate={handleDuplicateBehavior}
                      onDelete={handleDeleteBehavior}
                    />
                  ))}

                  {/* Technical Staff Behaviors Group */}
                  <TableRow
                    className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setTechExpanded(!techExpanded)}
                  >
                    <TableCell colSpan={2} className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {techExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Wrench className="h-4 w-4" />
                        {t('patterns.technicalGroup')}
                        <Badge variant="outline" className="ml-2 text-xs">{techBehaviors.length}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-6 px-2"
                          onClick={(e) => { e.stopPropagation(); handleCreateBehavior(); }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {t('patterns.createNew')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {techExpanded && techBehaviors.map((pattern) => (
                    <BehaviorRow
                      key={pattern.id}
                      pattern={pattern}
                      isSelected={selectedId === pattern.id}
                      hasUnsavedChanges={selectedId === pattern.id && hasUnsavedChanges}
                      onSelect={handleSelectPattern}
                      onEdit={handleEditBehavior}
                      onDuplicate={handleDuplicateBehavior}
                      onDelete={handleDeleteBehavior}
                    />
                  ))}
                </TableBody>
              </Table>
              )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={100 - nav.panelSize} minSize={50} maxSize={96}>
            <div className="h-full border-l border-border bg-card">
              <PatternDetailsPanel 
                selectedPattern={selectedPattern} 
                patternMeta={selectedMeta}
                isEditing={isEditing}
                onCancelEdit={handleCancelEdit}
                onSaveBehavior={handleSaveBehaviorInline}
                onSaveBlueprint={handleSaveBlueprintInline}
                isSaving={isSaving}
                onHasUnsavedChanges={setHasUnsavedChanges}
                onEdit={() => {
                  if (!selectedPattern) return;
                  const bp = blueprints.find(b => b.id === selectedPattern.id);
                  if (bp) {
                    handleEditBlueprint(bp);
                  } else {
                    const bh = behaviors.find(b => b.id === selectedPattern.id);
                    if (bh) {
                      handleEditBehavior(bh);
                    }
                  }
                }}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('patterns.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('patterns.deleteConfirmDescription')} <strong>{patternToDelete?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Unsaved changes confirmation dialog */}
      <UnsavedChangesDialog
        open={showConfirmDialog}
        onConfirm={confirmAndProceed}
        onCancel={cancelNavigation}
      />
    </Layout>
  );
};

export default BehavioralPatterns;
