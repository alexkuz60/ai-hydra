import React, { useState, useMemo } from 'react';
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
import { Target, Sparkles, ChevronDown, ChevronRight, Plus, Pencil, Copy, Loader2, Lock, Trash2, Users } from 'lucide-react';
import { ROLE_CONFIG } from '@/config/roles';
import { cn } from '@/lib/utils';
import PatternDetailsPanel from '@/components/patterns/PatternDetailsPanel';
import { BlueprintEditorDialog } from '@/components/patterns/BlueprintEditorDialog';
import { BehaviorEditorDialog } from '@/components/patterns/BehaviorEditorDialog';
import { usePatterns, type TaskBlueprintWithMeta, type RoleBehaviorWithMeta } from '@/hooks/usePatterns';
import type { TaskBlueprint, RoleBehavior } from '@/types/patterns';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type SelectedPattern = TaskBlueprint | RoleBehavior | null;

const BehavioralPatterns = () => {
  const { t } = useLanguage();
  const { blueprints, behaviors, isLoading, isSaving, saveBlueprint, saveBehavior, deleteBlueprint, deleteBehavior } = usePatterns();
  
  const [selectedPattern, setSelectedPattern] = useState<SelectedPattern>(null);
  const [strategicExpanded, setStrategicExpanded] = useState(true);
  const [roleExpanded, setRoleExpanded] = useState(true);
  
  // Editor dialogs
  const [blueprintDialogOpen, setBlueprintDialogOpen] = useState(false);
  const [behaviorDialogOpen, setBehaviorDialogOpen] = useState(false);
  const [editingBlueprint, setEditingBlueprint] = useState<TaskBlueprint | null>(null);
  const [editingBehavior, setEditingBehavior] = useState<RoleBehavior | null>(null);
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patternToDelete, setPatternToDelete] = useState<{ id: string; name: string; type: 'blueprint' | 'behavior' } | null>(null);

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

  const handleCreateBlueprint = () => {
    setEditingBlueprint(null);
    setBlueprintDialogOpen(true);
  };

  const handleEditBlueprint = (pattern: TaskBlueprintWithMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pattern.meta.isSystem) {
      // Duplicate for editing
      setEditingBlueprint({ ...pattern, id: undefined as unknown as string, name: `${pattern.name} (копия)` });
    } else {
      setEditingBlueprint(pattern);
    }
    setBlueprintDialogOpen(true);
  };

  const handleCreateBehavior = () => {
    setEditingBehavior(null);
    setBehaviorDialogOpen(true);
  };

  const handleEditBehavior = (pattern: RoleBehaviorWithMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pattern.meta.isSystem) {
      setEditingBehavior({ ...pattern, id: undefined as unknown as string });
    } else {
      setEditingBehavior(pattern);
    }
    setBehaviorDialogOpen(true);
  };

  const handleSaveBlueprint = async (data: Omit<TaskBlueprint, 'id'> & { id?: string }, isShared: boolean) => {
    await saveBlueprint(data, isShared);
  };

  const handleSaveBehavior = async (data: Omit<RoleBehavior, 'id'> & { id?: string }, isShared: boolean) => {
    await saveBehavior(data, isShared);
  };

  const handleDeleteBlueprint = (pattern: TaskBlueprintWithMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    setPatternToDelete({ id: pattern.id, name: pattern.name, type: 'blueprint' });
    setDeleteDialogOpen(true);
  };

  const handleDeleteBehavior = (pattern: RoleBehaviorWithMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    const config = ROLE_CONFIG[pattern.role];
    setPatternToDelete({ id: pattern.id, name: t(config?.label || pattern.role), type: 'behavior' });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!patternToDelete) return;
    
    if (patternToDelete.type === 'blueprint') {
      await deleteBlueprint(patternToDelete.id);
      if (selectedPattern?.id === patternToDelete.id) {
        setSelectedPattern(null);
      }
    } else {
      await deleteBehavior(patternToDelete.id);
      if (selectedPattern?.id === patternToDelete.id) {
        setSelectedPattern(null);
      }
    }
    
    setDeleteDialogOpen(false);
    setPatternToDelete(null);
  };

  const renderBlueprintRow = (pattern: TaskBlueprintWithMeta) => {
    const isSelected = selectedId === pattern.id;

    const categoryColors: Record<string, string> = {
      planning: 'text-blue-400',
      creative: 'text-purple-400',
      analysis: 'text-green-400',
      technical: 'text-orange-400',
    };

    return (
      <TableRow
        key={pattern.id}
        className={cn(
          'cursor-pointer transition-colors group',
          isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'
        )}
        onClick={() => setSelectedPattern(pattern)}
      >
        <TableCell className="pl-8">
          <div className="w-10 h-10 rounded-lg bg-hydra-arbiter/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-hydra-arbiter" />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{pattern.name}</span>
                {pattern.meta.isSystem && (
                  <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                {pattern.meta.isShared && !pattern.meta.isSystem && (
                  <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs', categoryColors[pattern.category])}>
                  {t(`patterns.category.${pattern.category}`)}
                </span>
                <Badge variant="outline" className="text-xs py-0">
                  {pattern.stages.length} {t('patterns.stagesCount')}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleEditBlueprint(pattern, e)}
                  >
                    {pattern.meta.isSystem ? (
                      <Copy className="h-4 w-4" />
                    ) : (
                      <Pencil className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {pattern.meta.isSystem ? t('patterns.duplicateToEdit') : t('common.edit')}
                </TooltipContent>
              </Tooltip>
              {!pattern.meta.isSystem && pattern.meta.isOwned && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={(e) => handleDeleteBlueprint(pattern, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('common.delete')}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderBehaviorRow = (pattern: RoleBehaviorWithMeta) => {
    const isSelected = selectedId === pattern.id;
    const config = ROLE_CONFIG[pattern.role];
    const IconComponent = config?.icon;

    return (
      <TableRow
        key={pattern.id}
        className={cn(
          'cursor-pointer transition-colors group',
          isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'
        )}
        onClick={() => setSelectedPattern(pattern)}
      >
        <TableCell className="pl-8">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              `bg-${config?.color.replace('text-', '')}/10`
            )}
          >
            {IconComponent && <IconComponent className={cn('h-5 w-5', config?.color)} />}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn('font-medium', config?.color)}>
                  {t(config?.label || pattern.role)}
                </span>
                {pattern.meta.isSystem && (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
                {pattern.meta.isShared && !pattern.meta.isSystem && (
                  <Users className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {t(`patterns.tone.${pattern.communication.tone}`)} •{' '}
                {t(`patterns.verbosity.${pattern.communication.verbosity}`)}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleEditBehavior(pattern, e)}
                  >
                    {pattern.meta.isSystem ? (
                      <Copy className="h-4 w-4" />
                    ) : (
                      <Pencil className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {pattern.meta.isSystem ? t('patterns.duplicateToEdit') : t('common.edit')}
                </TooltipContent>
              </Tooltip>
              {!pattern.meta.isSystem && pattern.meta.isOwned && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={(e) => handleDeleteBehavior(pattern, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('common.delete')}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
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
          <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
            <div className="h-full overflow-auto">
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
                        {strategicExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Target className="h-4 w-4" />
                        {t('patterns.strategicGroup')}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {blueprints.length}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateBlueprint();
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {t('patterns.createNew')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {strategicExpanded && blueprints.map(renderBlueprintRow)}

                  {/* Role Patterns Group */}
                  <TableRow
                    className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setRoleExpanded(!roleExpanded)}
                  >
                    <TableCell colSpan={2} className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {roleExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Sparkles className="h-4 w-4" />
                        {t('patterns.roleGroup')}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {behaviors.length}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateBehavior();
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {t('patterns.createNew')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {roleExpanded && behaviors.map(renderBehaviorRow)}
                </TableBody>
              </Table>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={65} minSize={50} maxSize={80}>
            <div className="h-full border-l border-border bg-card">
              <PatternDetailsPanel 
                selectedPattern={selectedPattern} 
                patternMeta={selectedMeta}
                onEdit={() => {
                  if (!selectedPattern) return;
                  const bp = blueprints.find(b => b.id === selectedPattern.id);
                  if (bp) {
                    setEditingBlueprint(bp.meta.isSystem ? { ...bp, id: undefined as unknown as string, name: `${bp.name} (копия)` } : bp);
                    setBlueprintDialogOpen(true);
                  } else {
                    const bh = behaviors.find(b => b.id === selectedPattern.id);
                    if (bh) {
                      setEditingBehavior(bh.meta.isSystem ? { ...bh, id: undefined as unknown as string } : bh);
                      setBehaviorDialogOpen(true);
                    }
                  }
                }}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Dialogs */}
      <BlueprintEditorDialog
        open={blueprintDialogOpen}
        onOpenChange={setBlueprintDialogOpen}
        blueprint={editingBlueprint}
        onSave={handleSaveBlueprint}
        isSaving={isSaving}
      />

      <BehaviorEditorDialog
        open={behaviorDialogOpen}
        onOpenChange={setBehaviorDialogOpen}
        behavior={editingBehavior}
        onSave={handleSaveBehavior}
        isSaving={isSaving}
      />

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
    </Layout>
  );
};

export default BehavioralPatterns;
