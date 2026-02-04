import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody } from '@/components/ui/table';
import { Loader2, Search, Plus, Wrench } from 'lucide-react';
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
  getEmptyFormData, 
  toolToFormData,
  SYSTEM_TOOLS,
  SystemTool,
} from '@/types/customTools';
import { ToolItem, isSystemTool } from '@/components/tools/ToolRow';

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
          <Button onClick={handleStartCreate} className="hydra-glow-sm">
            <Plus className="h-4 w-4 mr-2" />
            {t('tools.createTool')}
          </Button>
        </div>

        {/* Main content */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left panel - List */}
          <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
            <div className="h-full flex flex-col">
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
                  <Table>
                    <TableBody>
                      {filteredTools.map((tool) => {
                        const isSys = isSystemTool(tool);
                        return (
                          <ToolRow
                            key={tool.id}
                            tool={tool}
                            isSelected={selectedTool?.id === tool.id}
                            isOwned={!isSys && (tool as CustomTool).user_id === user?.id}
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
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right panel - Details or Editor */}
          <ResizablePanel defaultSize={60} minSize={40}>
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
                isOwned={isOwned}
                onEdit={() => selectedTool && !isSystemTool(selectedTool) && handleStartEdit(selectedTool as CustomTool)}
                onDelete={() => selectedTool && !isSystemTool(selectedTool) && setToolToDelete(selectedTool as CustomTool)}
                onDuplicate={() => selectedTool && !isSystemTool(selectedTool) && handleDuplicate(selectedTool as CustomTool)}
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
