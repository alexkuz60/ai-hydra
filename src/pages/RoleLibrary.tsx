 import React, { useState, useEffect, useMemo } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '@/contexts/AuthContext';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Layout } from '@/components/layout/Layout';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Table, TableBody } from '@/components/ui/table';
 import { Loader2, Search, Plus, Library, ChevronDown, ChevronRight, FileText } from 'lucide-react';
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
 import { usePromptsCRUD, RolePrompt, PromptFormData, getEmptyPromptFormData, promptToFormData, generatePromptName } from '@/hooks/usePromptsCRUD';
 import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
 import { PromptRow } from '@/components/prompts/PromptRow';
 import { PromptDetailsPanel } from '@/components/prompts/PromptDetailsPanel';
 import { AdvancedPromptEditor } from '@/components/prompts/AdvancedPromptEditor';
 import { RoleSelectOptions } from '@/components/ui/RoleSelectItem';
 
 type OwnerFilter = 'all' | 'own' | 'shared' | 'system';
 
 // Group prompts by language
 type LanguageGroup = 'ru' | 'en' | 'auto';
 
 const LANGUAGE_ORDER: LanguageGroup[] = ['ru', 'en', 'auto'];
 
 export default function RoleLibrary() {
   const { user, loading: authLoading } = useAuth();
   const { t } = useLanguage();
   const navigate = useNavigate();
 
   // CRUD hook
   const { prompts, loading, saving, createPrompt, updatePrompt, deletePrompt } = usePromptsCRUD();
 
   // Filters
   const [searchQuery, setSearchQuery] = useState('');
   const [roleFilter, setRoleFilter] = useState<string>('all');
   const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
 
   // Selected prompt
   const [selectedPrompt, setSelectedPrompt] = useState<RolePrompt | null>(null);
   const [editingPrompt, setEditingPrompt] = useState<RolePrompt | null>(null);
 
   const [isEditing, setIsEditing] = useState(false);
   const [isCreating, setIsCreating] = useState(false);
   const [formData, setFormData] = useState<PromptFormData>(getEmptyPromptFormData());
 
   // Delete dialog
   const [promptToDelete, setPromptToDelete] = useState<RolePrompt | null>(null);
 
   // Collapsed groups
   const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
 
   // Unsaved changes protection
   const unsavedChanges = useUnsavedChanges();
 
   // Auth redirect
   useEffect(() => {
     if (!authLoading && !user) {
       navigate('/login');
     }
   }, [user, authLoading, navigate]);
 
   // Filter prompts
   const filteredPrompts = useMemo(() => {
     return prompts.filter((prompt) => {
       const matchesSearch =
         prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (prompt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
 
       if (!matchesSearch) return false;
 
       // Role filter
       if (roleFilter !== 'all' && prompt.role !== roleFilter) return false;
 
       // Owner filter
       if (ownerFilter === 'own' && !prompt.is_owner) return false;
       if (ownerFilter === 'shared' && !prompt.is_shared) return false;
       if (ownerFilter === 'system' && !prompt.is_default) return false;
 
       return true;
     });
   }, [prompts, searchQuery, roleFilter, ownerFilter]);
 
   // Group by language
   const groupedPrompts = useMemo(() => {
     const groups: Record<LanguageGroup, RolePrompt[]> = { ru: [], en: [], auto: [] };
     
     for (const prompt of filteredPrompts) {
       const lang = (prompt.language as LanguageGroup) || 'auto';
       groups[lang].push(prompt);
     }
     
     return groups;
   }, [filteredPrompts]);
 
   const toggleGroup = (group: string) => {
     setCollapsedGroups(prev => {
       const next = new Set(prev);
       if (next.has(group)) {
         next.delete(group);
       } else {
         next.add(group);
       }
       return next;
     });
   };
 
   const getLanguageLabel = (lang: LanguageGroup) => {
     switch (lang) {
       case 'ru': return t('roleLibrary.languageRu');
       case 'en': return t('roleLibrary.languageEn');
       default: return t('roleLibrary.languageAuto');
     }
   };
 
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
     <Layout>
       <div className="h-[calc(100vh-4rem)] flex flex-col">
         {/* Header */}
         <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
           <div>
             <div className="flex items-center gap-3">
               <Library className="h-6 w-6 text-primary" />
               <h1 className="text-2xl font-bold">{t('roleLibrary.title')}</h1>
             </div>
             <p className="text-sm text-muted-foreground mt-1">{t('roleLibrary.pageDescription')}</p>
           </div>
           <Button onClick={handleStartCreate}>
             <Plus className="h-4 w-4 mr-2" />
             {t('roleLibrary.new')}
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
                   <div className="divide-y">
                     {LANGUAGE_ORDER
                       .filter(lang => groupedPrompts[lang].length > 0)
                       .map((lang) => {
                         const promptsInGroup = groupedPrompts[lang];
                         const isCollapsed = collapsedGroups.has(lang);
 
                         return (
                           <div key={lang}>
                             <button
                               onClick={() => toggleGroup(lang)}
                               className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                             >
                               {isCollapsed ? (
                                 <ChevronRight className="h-4 w-4" />
                               ) : (
                                 <ChevronDown className="h-4 w-4" />
                               )}
                               <span>{getLanguageLabel(lang)}</span>
                               <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                                 {promptsInGroup.length}
                               </span>
                             </button>
                             {!isCollapsed && (
                               <Table>
                                 <TableBody>
                                   {promptsInGroup.map((prompt) => (
                                     <PromptRow
                                       key={prompt.id}
                                       prompt={prompt}
                                       isSelected={selectedPrompt?.id === prompt.id}
                                       onSelect={handleSelectPrompt}
                                       onEdit={handleStartEdit}
                                       onDelete={handleDeleteClick}
                                       onDuplicate={handleDuplicate}
                                     />
                                   ))}
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
           </ResizablePanel>
 
           <ResizableHandle withHandle />
 
           {/* Right panel - Details or Editor */}
           <ResizablePanel defaultSize={60} minSize={40}>
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
