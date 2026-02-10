import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody } from '@/components/ui/table';
import { Loader2, Search, Plus, Wrench, Upload, Database, Plug, Sparkles, Zap, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useToolsCRUD } from '@/hooks/useToolsCRUD';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { ToolRow } from '@/components/tools/ToolRow';
import { ToolDetailsPanel } from '@/components/tools/ToolDetailsPanel';
import { ToolEditor } from '@/components/tools/ToolEditor';
import { 
  CustomTool, 
  OwnerFilter, 
  ToolFormData, 
  ToolCategory,
  getEmptyFormData, 
  toolToFormData,
  SYSTEM_TOOLS,
  SystemTool,
  TOOL_CATEGORIES,
  exportToolToJson,
  importToolFromJson,
} from '@/types/customTools';
import { ToolItem, isSystemTool } from '@/components/tools/ToolRow';
import { toast } from 'sonner';
import { useNavigatorResize } from '@/hooks/useNavigatorResize';
import { NavigatorHeader } from '@/components/layout/NavigatorHeader';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function ToolsLibrary() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // CRUD hook
  const { tools, loading, saving, createTool, updateTool, deleteTool } = useToolsCRUD();

  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');

  // Selected tool can be CustomTool or SystemTool
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);
  // Editing state - only for custom tools
  const [editingTool, setEditingTool] = useState<CustomTool | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<ToolFormData>(getEmptyFormData());

  // Delete dialog
  const [toolToDelete, setToolToDelete] = useState<CustomTool | null>(null);

  // Unsaved changes protection
  const unsavedChanges = useUnsavedChanges();

  // Navigator resize
  const nav = useNavigatorResize({ storageKey: 'tools-library', defaultMaxSize: 40 });

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Combined tools list: system tools + user tools
  const allTools = useMemo((): ToolItem[] => {
    return [...SYSTEM_TOOLS, ...tools];
  }, [tools]);

  // Filter tools
  const filteredTools = useMemo(() => {
    return allTools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filter by owner
      if (ownerFilter === 'system') {
        return isSystemTool(tool);
      }
      if (ownerFilter === 'own') {
        return !isSystemTool(tool) && (tool as CustomTool).user_id === user?.id;
      }
      if (ownerFilter === 'shared') {
        return !isSystemTool(tool) && (tool as CustomTool).is_shared;
      }
      // 'all' - show everything
      return true;
    });
  }, [allTools, searchQuery, ownerFilter, user?.id]);

  // Group tools by category
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const groupedTools = useMemo(() => {
    const groups: Record<string, ToolItem[]> = {};
    
    // Group all tools (system and custom) by category
    for (const tool of filteredTools) {
      const cat = (tool as SystemTool).category || (tool as CustomTool).category || 'general';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(tool);
    }
    
    return groups;
  }, [filteredTools]);

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'system': return Wrench;
      case 'data': return Database;
      case 'integration': return Plug;
      case 'ai': return Sparkles;
      case 'automation': return Zap;
      case 'utility': return Settings;
      default: return Wrench;
    }
  };

  // Handlers
  const handleSelectTool = (tool: ToolItem) => {
    if (isEditing || isCreating) {
      unsavedChanges.withConfirmation(() => {
        setSelectedTool(tool);
        setEditingTool(null);
        setIsEditing(false);
        setIsCreating(false);
        unsavedChanges.markSaved();
      });
    } else {
      setSelectedTool(tool);
      setEditingTool(null);
      setIsEditing(false);
    }
  };

  const handleStartCreate = () => {
    if (isEditing || isCreating) {
      unsavedChanges.withConfirmation(() => {
        setFormData(getEmptyFormData());
        setIsCreating(true);
        setIsEditing(false);
        setSelectedTool(null);
        setEditingTool(null);
        unsavedChanges.markSaved();
      });
    } else {
      setFormData(getEmptyFormData());
      setIsCreating(true);
      setIsEditing(false);
      setSelectedTool(null);
      setEditingTool(null);
    }
  };

  const handleStartEdit = (tool: CustomTool, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isEditing || isCreating) {
      unsavedChanges.withConfirmation(() => {
        setSelectedTool(tool);
        setEditingTool(tool);
        setFormData(toolToFormData(tool));
        setIsEditing(true);
        setIsCreating(false);
        unsavedChanges.markSaved();
      });
    } else {
      setSelectedTool(tool);
      setEditingTool(tool);
      setFormData(toolToFormData(tool));
      setIsEditing(true);
      setIsCreating(false);
    }
  };

  const handleCancelEdit = () => {
    if (unsavedChanges.hasUnsavedChanges) {
      unsavedChanges.withConfirmation(() => {
        setIsEditing(false);
        setIsCreating(false);
        setEditingTool(null);
        unsavedChanges.markSaved();
      });
    } else {
      setIsEditing(false);
      setIsCreating(false);
      setEditingTool(null);
    }
  };

  const handleFormChange = (data: ToolFormData) => {
    setFormData(data);
    unsavedChanges.setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (isCreating) {
      const newTool = await createTool(formData);
      if (newTool) {
        setIsCreating(false);
        setSelectedTool(newTool);
        setEditingTool(null);
        unsavedChanges.markSaved();
      }
    } else if (isEditing && editingTool) {
      const success = await updateTool(editingTool.id, formData);
      if (success) {
        setIsEditing(false);
        // Update selected tool with new data
        const updatedTool: CustomTool = {
          ...editingTool,
          name: formData.name,
          display_name: formData.displayName,
          description: formData.description,
          prompt_template: formData.promptTemplate,
          parameters: formData.parameters,
          is_shared: formData.isShared,
          tool_type: formData.toolType,
          http_config:
            formData.toolType === 'http_api'
              ? {
                  url: formData.httpUrl,
                  method: formData.httpMethod,
                  headers:
                    formData.httpHeaders.length > 0
                      ? Object.fromEntries(
                          formData.httpHeaders
                            .filter((h) => h.key.trim())
                            .map((h) => [h.key.trim(), h.value])
                        )
                      : undefined,
                  body_template: formData.httpBodyTemplate || undefined,
                  response_path: formData.httpResponsePath || undefined,
                }
              : null,
        };
        setSelectedTool(updatedTool);
        setEditingTool(null);
        unsavedChanges.markSaved();
      }
    }
  };

  const handleDeleteClick = (tool: CustomTool, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setToolToDelete(tool);
  };

  const handleDuplicate = (tool: CustomTool, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Create form data from the tool with modified name
    const duplicateFormData = toolToFormData(tool);
    duplicateFormData.name = `${tool.name}_copy`;
    duplicateFormData.displayName = `${tool.display_name} (копия)`;
    duplicateFormData.isShared = false; // New copy is private by default
    
    setFormData(duplicateFormData);
    setIsCreating(true);
    setIsEditing(false);
    setSelectedTool(null);
    setEditingTool(null);
  };

  const handleExport = (tool: CustomTool, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const json = exportToolToJson(tool);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('tools.exportSuccess'));
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const importedData = importToolFromJson(text);
        
        if (!importedData) {
          toast.error(t('tools.importError'));
          return;
        }
        
        // Set form data and enter create mode
        setFormData(importedData);
        setIsCreating(true);
        setIsEditing(false);
        setSelectedTool(null);
        setEditingTool(null);
        toast.success(t('tools.importSuccess'));
      } catch (err) {
        console.error('Import error:', err);
        toast.error(t('tools.importError'));
      }
    };
    input.click();
  };

  const handleConfirmDelete = async () => {
    if (!toolToDelete) return;
    const success = await deleteTool(toolToDelete.id);
    if (success) {
      // Clear selection if we deleted the selected tool
      if (selectedTool && !isSystemTool(selectedTool) && selectedTool.id === toolToDelete.id) {
        setSelectedTool(null);
        setEditingTool(null);
        setIsEditing(false);
      }
    }
    setToolToDelete(null);
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Check ownership for custom tools only
  const isOwned = selectedTool && !isSystemTool(selectedTool) 
    ? (selectedTool as CustomTool).user_id === user?.id 
    : false;

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold">{t('tools.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('tools.description')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleStartCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {t('tools.createTool')}
            </Button>
            <Button variant="outline" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              {t('tools.import')}
            </Button>
          </div>
        </div>

        {/* Main content */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left panel - List */}
          <ResizablePanel 
            ref={nav.panelRef}
            defaultSize={nav.panelSize} 
            minSize={4} 
            maxSize={60}
            onResize={nav.onPanelResize}
            data-guide="tools-list"
          >
            <div className="h-full flex flex-col hydra-nav-surface">
              <NavigatorHeader
                title={t('tools.title')}
                isMinimized={nav.isMinimized}
                onToggle={nav.toggle}
              />
              {nav.isMinimized ? (
                <TooltipProvider delayDuration={200}>
                  <div className="flex-1 overflow-auto p-1 space-y-1">
                    {filteredTools.map((tool) => {
                      const isSys = isSystemTool(tool);
                      const CategoryIcon = getCategoryIcon((tool as any).category || 'general');
                      return (
                        <Tooltip key={tool.id}>
                          <TooltipTrigger asChild>
                             <div
                               className={cn(
                                 "relative flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                                 selectedTool?.id === tool.id ? "bg-primary/10" : "hover:bg-muted/30"
                               )}
                               onClick={() => handleSelectTool(tool)}
                             >
                               <CategoryIcon className={cn("h-5 w-5", isSys ? "text-muted-foreground" : "text-primary")} />
                               {selectedTool?.id === tool.id && unsavedChanges.hasUnsavedChanges && (
                                 <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-hydra-warning animate-pulse-glow" />
                               )}
                              </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[220px]">
                            <div className="space-y-1">
                              <span className="font-medium text-sm">{tool.display_name}</span>
                              <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              ) : (
              <div className="flex-1 flex flex-col">
              {/* Filters */}
              <div className="p-4 border-b space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('tools.searchPlaceholder')}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={ownerFilter}
                  onValueChange={(v) => setOwnerFilter(v as OwnerFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    <SelectItem value="all">{t('tools.filterAll')}</SelectItem>
                    <SelectItem value="system">{t('tools.filterSystem')}</SelectItem>
                    <SelectItem value="own">{t('tools.filterOwn')}</SelectItem>
                    <SelectItem value="shared">{t('tools.filterShared')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tools list */}
              <div className="flex-1 overflow-auto">
                {filteredTools.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground p-8">
                    <div className="text-center">
                      <Wrench className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>
                        {allTools.length === 0
                          ? t('tools.noTools')
                          : t('tools.nothingFound')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y">
                    {/* Order: by TOOL_CATEGORIES order */}
                    {(TOOL_CATEGORIES.map(c => c.value) as string[])
                      .filter(cat => groupedTools[cat] && groupedTools[cat].length > 0)
                      .map((category) => {
                        const toolsInCategory = groupedTools[category];
                        const isCollapsed = collapsedCategories.has(category);
                        const CategoryIcon = getCategoryIcon(category);
                        const categoryLabel = t(`tools.category.${category}`);

                        return (
                          <div key={category}>
                            <button
                              onClick={() => toggleCategory(category)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                            >
                              {isCollapsed ? (
                                <ChevronRight className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <CategoryIcon className="h-4 w-4" />
                              <span>{categoryLabel}</span>
                              <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                                {toolsInCategory.length}
                              </span>
                            </button>
                            {!isCollapsed && (
                              <Table>
                                <TableBody>
                                  {toolsInCategory.map((tool) => {
                                    const isSys = isSystemTool(tool);
                                    return (
                                      <ToolRow
                                        key={tool.id}
                                        tool={tool}
                                        isSelected={selectedTool?.id === tool.id}
                                        isOwned={!isSys && (tool as CustomTool).user_id === user?.id}
                                        hasUnsavedChanges={selectedTool?.id === tool.id && unsavedChanges.hasUnsavedChanges}
                                        onSelect={handleSelectTool}
                                        onEdit={handleStartEdit}
                                        onDelete={handleDeleteClick}
                                        onDuplicate={handleDuplicate}
                                      />
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
              </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right panel - Details or Editor */}
          <ResizablePanel defaultSize={100 - nav.panelSize} minSize={40} maxSize={96} data-guide="tools-details">
            {isEditing || isCreating ? (
              <ToolEditor
                formData={formData}
                onChange={handleFormChange}
                onSave={handleSave}
                onCancel={handleCancelEdit}
                saving={saving}
                isEditing={isEditing}
              />
            ) : (
              <ToolDetailsPanel
                tool={selectedTool}
                allTools={tools}
                isOwned={isOwned}
                onEdit={() => selectedTool && !isSystemTool(selectedTool) && handleStartEdit(selectedTool as CustomTool)}
                onDelete={() => selectedTool && !isSystemTool(selectedTool) && setToolToDelete(selectedTool as CustomTool)}
                onDuplicate={() => selectedTool && !isSystemTool(selectedTool) && handleDuplicate(selectedTool as CustomTool)}
                onExport={() => selectedTool && !isSystemTool(selectedTool) && handleExport(selectedTool as CustomTool)}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Unsaved changes dialog */}
      <UnsavedChangesDialog
        open={unsavedChanges.showConfirmDialog}
        onConfirm={unsavedChanges.confirmAndProceed}
        onCancel={unsavedChanges.cancelNavigation}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!toolToDelete} onOpenChange={() => setToolToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tools.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tools.deleteConfirmDescription')} "{toolToDelete?.display_name}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
