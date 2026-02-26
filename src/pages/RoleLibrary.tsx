 import React, { useState, useEffect, useMemo } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '@/contexts/AuthContext';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Layout } from '@/components/layout/Layout';
 import { SidebarTrigger } from '@/components/ui/sidebar';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Table, TableBody } from '@/components/ui/table';
 import { Loader2, Search, Plus, Library, FileText, Shield, User } from 'lucide-react';
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from '@/components/ui/collapsible';
  import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
  } from '@/components/ui/resizable';
 import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
 import { usePromptsCRUD, RolePrompt, PromptFormData, getEmptyPromptFormData, promptToFormData, generatePromptName } from '@/hooks/usePromptsCRUD';
 import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
 import { PromptRow, PromptGroupHeader } from '@/components/prompts/PromptRow';
 import { PromptDetailsPanel } from '@/components/prompts/PromptDetailsPanel';
 import { AdvancedPromptEditor } from '@/components/prompts/AdvancedPromptEditor';
 import { RoleSelectOptions } from '@/components/ui/RoleSelectItem';
 import { useNavigatorResize } from '@/hooks/useNavigatorResize';
 import { NavigatorHeader } from '@/components/layout/NavigatorHeader';
 import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
 import { cn } from '@/lib/utils';
 import { ROLE_CONFIG } from '@/config/roles';
 
 type OwnerFilter = 'all' | 'own' | 'shared' | 'system';
 
 
 export default function RoleLibrary() {
   const { user, loading: authLoading } = useAuth();
   const { t, language } = useLanguage();
   const navigate = useNavigate();
 
   // CRUD hook
   const { prompts, loading, saving, createPrompt, updatePrompt, deletePrompt } = usePromptsCRUD();
 
   // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');

    // Persistent collapse state
    const [systemOpen, setSystemOpen] = useState(() => {
      const stored = localStorage.getItem('rl-system-open');
      return stored !== null ? stored === 'true' : true;
    });
    const [userOpen, setUserOpen] = useState(() => {
      const stored = localStorage.getItem('rl-user-open');
      return stored !== null ? stored === 'true' : true;
    });
 
   // Selected prompt
   const [selectedPrompt, setSelectedPrompt] = useState<RolePrompt | null>(null);
   const [editingPrompt, setEditingPrompt] = useState<RolePrompt | null>(null);
 
   const [isEditing, setIsEditing] = useState(false);
   const [isCreating, setIsCreating] = useState(false);
   const [formData, setFormData] = useState<PromptFormData>(getEmptyPromptFormData());
 
   // Delete dialog
   const [promptToDelete, setPromptToDelete] = useState<RolePrompt | null>(null);
 
 
   // Unsaved changes protection
   const unsavedChanges = useUnsavedChanges();

   // Navigator resize
   const nav = useNavigatorResize({ storageKey: 'role-library', defaultMaxSize: 40 });
 
   // Auth redirect
   useEffect(() => {
     if (!authLoading && !user) {
       navigate('/login');
     }
   }, [user, authLoading, navigate]);
 
    // Filter prompts — show only prompts matching the user's selected language
    const filteredPrompts = useMemo(() => {
      return prompts.filter((prompt) => {
        const matchesSearch =
          prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (prompt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

        if (!matchesSearch) return false;

        // Language filter: show prompts matching user's language (+ auto)
        const promptLang = prompt.language || 'auto';
        if (promptLang !== 'auto' && promptLang !== language) return false;

        // Role filter
        if (roleFilter !== 'all' && prompt.role !== roleFilter) return false;

        // Owner filter
        if (ownerFilter === 'own' && !prompt.is_owner) return false;
        if (ownerFilter === 'shared' && !prompt.is_shared) return false;
        if (ownerFilter === 'system' && !prompt.is_default) return false;

        return true;
      });
    }, [prompts, searchQuery, roleFilter, ownerFilter, language]);
 
 
   // Handlers
   const handleSelectPrompt = (prompt: RolePrompt) => {
     if (isEditing || isCreating) {
       unsavedChanges.withConfirmation(() => {
         setSelectedPrompt(prompt);
         setEditingPrompt(null);
         setIsEditing(false);
         setIsCreating(false);
         unsavedChanges.markSaved();
       });
     } else {
       setSelectedPrompt(prompt);
       setEditingPrompt(null);
       setIsEditing(false);
     }
   };
 
   const handleStartCreate = () => {
     if (isEditing || isCreating) {
       unsavedChanges.withConfirmation(() => {
         setFormData(getEmptyPromptFormData());
         setIsCreating(true);
         setIsEditing(false);
         setSelectedPrompt(null);
         setEditingPrompt(null);
         unsavedChanges.markSaved();
       });
     } else {
       setFormData(getEmptyPromptFormData());
       setIsCreating(true);
       setIsEditing(false);
       setSelectedPrompt(null);
       setEditingPrompt(null);
     }
   };
 
   const handleStartEdit = (prompt: RolePrompt, e?: React.MouseEvent) => {
     e?.stopPropagation();
     if (isEditing || isCreating) {
       unsavedChanges.withConfirmation(() => {
         setSelectedPrompt(prompt);
         setEditingPrompt(prompt);
         setFormData(promptToFormData(prompt));
         setIsEditing(true);
         setIsCreating(false);
         unsavedChanges.markSaved();
       });
     } else {
       setSelectedPrompt(prompt);
       setEditingPrompt(prompt);
       setFormData(promptToFormData(prompt));
       setIsEditing(true);
       setIsCreating(false);
     }
   };
 
   const handleCancelEdit = () => {
     if (unsavedChanges.hasUnsavedChanges) {
       unsavedChanges.withConfirmation(() => {
         setIsEditing(false);
         setIsCreating(false);
         setEditingPrompt(null);
         unsavedChanges.markSaved();
       });
     } else {
       setIsEditing(false);
       setIsCreating(false);
       setEditingPrompt(null);
     }
   };
 
   const handleFormChange = (data: PromptFormData) => {
     setFormData(data);
     unsavedChanges.setHasUnsavedChanges(true);
   };
 
   const handleSave = async () => {
     if (isCreating) {
       const newPrompt = await createPrompt(formData);
       if (newPrompt) {
         setIsCreating(false);
         setSelectedPrompt(newPrompt);
         setEditingPrompt(null);
         unsavedChanges.markSaved();
       }
     } else if (isEditing && editingPrompt) {
       const success = await updatePrompt(editingPrompt.id, formData);
       if (success) {
         setIsEditing(false);
         // Update selected prompt with new data
         const updatedPrompt: RolePrompt = {
           ...editingPrompt,
           name: formData.name,
           description: formData.description || null,
           content: formData.content,
           role: formData.role,
           is_shared: formData.is_shared,
           language: formData.language,
         };
         setSelectedPrompt(updatedPrompt);
         setEditingPrompt(null);
         unsavedChanges.markSaved();
       }
     }
   };
 
   const handleDeleteClick = (prompt: RolePrompt, e?: React.MouseEvent) => {
     e?.stopPropagation();
     setPromptToDelete(prompt);
   };
 
    const handleDuplicate = (prompt: RolePrompt, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const duplicateFormData = promptToFormData(prompt);
      // Add "(копия)" to nickname and regenerate name
      duplicateFormData.nickname = `${duplicateFormData.nickname} (копия)`;
      duplicateFormData.name = generatePromptName(
        duplicateFormData.nickname,
        duplicateFormData.role,
        duplicateFormData.language,
        false
      );
      duplicateFormData.is_shared = false;
      
      setFormData(duplicateFormData);
      setIsCreating(true);
      setIsEditing(false);
      setSelectedPrompt(null);
      setEditingPrompt(null);
    };
 
   const handleConfirmDelete = async () => {
     if (!promptToDelete) return;
     const success = await deletePrompt(promptToDelete.id);
     if (success) {
       if (selectedPrompt?.id === promptToDelete.id) {
         setSelectedPrompt(null);
         setEditingPrompt(null);
         setIsEditing(false);
       }
     }
     setPromptToDelete(null);
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
 
   return (
    <Layout hideHeader>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="text-muted-foreground hover:text-primary" />
            <div className="flex items-center gap-3">
              <Library className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">{t('roleLibrary.title')}</h1>
            </div>
          </div>
           <Button onClick={handleStartCreate} data-guide="prompt-create-btn">
             <Plus className="h-4 w-4 mr-2" />
             {t('roleLibrary.new')}
           </Button>
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
              data-guide="prompt-list"
            >
             <div className="h-full flex flex-col hydra-nav-surface">
               <NavigatorHeader
                 title={t('roleLibrary.title')}
                 isMinimized={nav.isMinimized}
                 onToggle={nav.toggle}
               />
               {nav.isMinimized ? (
                 <TooltipProvider delayDuration={200}>
                   <div className="flex-1 overflow-auto p-1 space-y-1">
                     {filteredPrompts.map((prompt) => {
                       const config = ROLE_CONFIG[prompt.role];
                       const Icon = config?.icon || FileText;
                       return (
                         <Tooltip key={prompt.id}>
                           <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "relative flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                                  selectedPrompt?.id === prompt.id ? "bg-primary/10" : "hover:bg-muted/30"
                                )}
                                onClick={() => handleSelectPrompt(prompt)}
                              >
                                <Icon className={cn("h-5 w-5", config?.color)} />
                                {selectedPrompt?.id === prompt.id && unsavedChanges.hasUnsavedChanges && (
                                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-hydra-warning animate-pulse-glow" />
                                )}
                               </div>
                           </TooltipTrigger>
                           <TooltipContent side="right" className="max-w-[220px]">
                             <div className="space-y-1">
                               <span className="font-medium text-sm">{prompt.name}</span>
                               <ul className="text-xs text-muted-foreground space-y-0.5">
                                 <li>• {t(`role.${prompt.role}`)}</li>
                                 <li>• {prompt.language || 'auto'}</li>
                               </ul>
                             </div>
                           </TooltipContent>
                         </Tooltip>
                       );
                     })}
                   </div>
                 </TooltipProvider>
               ) : (
               <div className="flex-1 flex flex-col min-h-0">
               {/* Filters */}
               <div className="p-4 border-b space-y-3" data-guide="prompt-filters">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder={t('roleLibrary.search')}
                     className="pl-9"
                   />
                 </div>
                 <div className="flex gap-2">
                   <Select value={roleFilter} onValueChange={setRoleFilter}>
                     <SelectTrigger className="flex-1">
                       <SelectValue placeholder={t('roleLibrary.filterAll')} />
                     </SelectTrigger>
                     <SelectContent className="bg-popover border border-border z-50">
                       <SelectItem value="all">{t('roleLibrary.filterAll')}</SelectItem>
                       <RoleSelectOptions />
                     </SelectContent>
                   </Select>
                   <Select value={ownerFilter} onValueChange={(v) => setOwnerFilter(v as OwnerFilter)}>
                     <SelectTrigger className="w-[120px]">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="bg-popover border border-border z-50">
                       <SelectItem value="all">{t('roleLibrary.filterAll')}</SelectItem>
                       <SelectItem value="own">{t('roleLibrary.filterOwn')}</SelectItem>
                       <SelectItem value="shared">{t('roleLibrary.filterShared')}</SelectItem>
                       <SelectItem value="system">{t('roleLibrary.filterSystem')}</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
 
               {/* Prompts list */}
               <div className="flex-1 overflow-auto">
                 {filteredPrompts.length === 0 ? (
                   <div className="h-full flex items-center justify-center text-muted-foreground p-8">
                     <div className="text-center">
                       <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                       <p>
                         {prompts.length === 0
                           ? t('roleLibrary.empty')
                           : t('roleLibrary.noResults')}
                       </p>
                     </div>
                   </div>
                   ) : (
                     (() => {
                       const systemPrompts = filteredPrompts.filter(p => p.is_default);
                       const userPrompts = filteredPrompts.filter(p => !p.is_default);
                       return (
                         <div className="space-y-0">
                            {systemPrompts.length > 0 && (
                              <Collapsible open={systemOpen} onOpenChange={(v) => { setSystemOpen(v); localStorage.setItem('rl-system-open', String(v)); }}>
                               <CollapsibleTrigger className="w-full">
                                 <PromptGroupHeader label={t('roleLibrary.filterSystem')} icon={Shield} count={systemPrompts.length} />
                               </CollapsibleTrigger>
                               <CollapsibleContent>
                                 <Table>
                                   <TableBody>
                                     {systemPrompts.map((prompt) => (
                                       <PromptRow
                                         key={prompt.id}
                                         prompt={prompt}
                                         isSelected={selectedPrompt?.id === prompt.id}
                                         hasUnsavedChanges={selectedPrompt?.id === prompt.id && unsavedChanges.hasUnsavedChanges}
                                         onSelect={handleSelectPrompt}
                                       />
                                     ))}
                                   </TableBody>
                                 </Table>
                               </CollapsibleContent>
                             </Collapsible>
                           )}
                            {userPrompts.length > 0 && (
                              <Collapsible open={userOpen} onOpenChange={(v) => { setUserOpen(v); localStorage.setItem('rl-user-open', String(v)); }}>
                               <CollapsibleTrigger className="w-full">
                                 <PromptGroupHeader label={t('roleLibrary.filterOwn')} icon={User} count={userPrompts.length} />
                               </CollapsibleTrigger>
                               <CollapsibleContent>
                                 <Table>
                                   <TableBody>
                                     {userPrompts.map((prompt) => (
                                       <PromptRow
                                         key={prompt.id}
                                         prompt={prompt}
                                         isSelected={selectedPrompt?.id === prompt.id}
                                         hasUnsavedChanges={selectedPrompt?.id === prompt.id && unsavedChanges.hasUnsavedChanges}
                                         onSelect={handleSelectPrompt}
                                       />
                                     ))}
                                   </TableBody>
                                 </Table>
                               </CollapsibleContent>
                             </Collapsible>
                           )}
                         </div>
                       );
                     })()
                   )}
               </div>
              </div>
              )}
             </div>
           </ResizablePanel>
 
           <ResizableHandle withHandle />
 
           {/* Right panel - Details or Editor */}
           <ResizablePanel defaultSize={100 - nav.panelSize} minSize={40} maxSize={96} data-guide="prompt-details">
            {isCreating || isEditing ? (
                <AdvancedPromptEditor
                  formData={formData}
                  onChange={handleFormChange}
                  onSave={handleSave}
                  onCancel={handleCancelEdit}
                  saving={saving}
                  isEditing={isEditing}
                />
             ) : (
               <PromptDetailsPanel
                 prompt={selectedPrompt}
                 onEdit={() => selectedPrompt && handleStartEdit(selectedPrompt)}
                 onDelete={() => selectedPrompt && setPromptToDelete(selectedPrompt)}
                 onDuplicate={() => selectedPrompt && handleDuplicate(selectedPrompt)}
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
 
       {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!promptToDelete} onOpenChange={(open) => !open && setPromptToDelete(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>{t('roleLibrary.deleteConfirmTitle')}</AlertDialogTitle>
             <AlertDialogDescription>
               {t('roleLibrary.deleteConfirmDescription')}
               {promptToDelete && (
                 <span className="block mt-2 font-medium text-foreground">
                   "{promptToDelete.name}"
                 </span>
               )}
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
