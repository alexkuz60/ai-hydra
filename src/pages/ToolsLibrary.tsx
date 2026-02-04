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
  toolToFormData 
} from '@/types/customTools';

export default function ToolsLibrary() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // CRUD hook
  const { tools, loading, saving, createTool, updateTool, deleteTool } = useToolsCRUD();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');

  // Selection & editing state
  const [selectedTool, setSelectedTool] = useState<CustomTool | null>(null);
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

  // Filter tools
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesOwner =
        ownerFilter === 'all' ||
        (ownerFilter === 'own' && tool.user_id === user?.id) ||
        (ownerFilter === 'shared' && tool.is_shared);

      return matchesSearch && matchesOwner;
    });
  }, [tools, searchQuery, ownerFilter, user?.id]);

  // Handlers
  const handleSelectTool = (tool: CustomTool) => {
    if (isEditing || isCreating) {
      unsavedChanges.withConfirmation(() => {
        setSelectedTool(tool);
        setIsEditing(false);
        setIsCreating(false);
        unsavedChanges.markSaved();
      });
    } else {
      setSelectedTool(tool);
    }
  };

  const handleStartCreate = () => {
    if (isEditing || isCreating) {
      unsavedChanges.withConfirmation(() => {
        setFormData(getEmptyFormData());
        setIsCreating(true);
        setIsEditing(false);
        setSelectedTool(null);
        unsavedChanges.markSaved();
      });
    } else {
      setFormData(getEmptyFormData());
      setIsCreating(true);
      setIsEditing(false);
      setSelectedTool(null);
    }
  };

  const handleStartEdit = (tool: CustomTool, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isEditing || isCreating) {
      unsavedChanges.withConfirmation(() => {
        setSelectedTool(tool);
        setFormData(toolToFormData(tool));
        setIsEditing(true);
        setIsCreating(false);
        unsavedChanges.markSaved();
      });
    } else {
      setSelectedTool(tool);
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
        unsavedChanges.markSaved();
      });
    } else {
      setIsEditing(false);
      setIsCreating(false);
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
        unsavedChanges.markSaved();
      }
    } else if (isEditing && selectedTool) {
      const success = await updateTool(selectedTool.id, formData);
      if (success) {
        setIsEditing(false);
        // Update selected tool with new data
        setSelectedTool((prev) =>
          prev
            ? {
                ...prev,
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
              }
            : null
        );
        unsavedChanges.markSaved();
      }
    }
  };

  const handleDeleteClick = (tool: CustomTool, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setToolToDelete(tool);
  };

  const handleConfirmDelete = async () => {
    if (!toolToDelete) return;
    const success = await deleteTool(toolToDelete.id);
    if (success && selectedTool?.id === toolToDelete.id) {
      setSelectedTool(null);
      setIsEditing(false);
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

  const isOwned = selectedTool?.user_id === user?.id;

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
                        {tools.length === 0
                          ? t('tools.noTools')
                          : t('tools.nothingFound')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableBody>
                      {filteredTools.map((tool) => (
                        <ToolRow
                          key={tool.id}
                          tool={tool}
                          isSelected={selectedTool?.id === tool.id}
                          isOwned={tool.user_id === user?.id}
                          onSelect={handleSelectTool}
                          onEdit={handleStartEdit}
                          onDelete={handleDeleteClick}
                        />
                      ))}
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
                onEdit={() => selectedTool && handleStartEdit(selectedTool)}
                onDelete={() => selectedTool && setToolToDelete(selectedTool)}
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
