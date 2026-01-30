import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Search, 
  Pencil, 
  Users, 
  BookOpen,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgentRole, AGENT_ROLES, getRoleBadgeColor } from '@/config/roles';
import { RoleSelectOptions, RoleDisplay } from '@/components/ui/RoleSelectItem';

type OwnerFilter = 'all' | 'own' | 'shared';

interface RolePrompt {
  id: string;
  name: string;
  description: string | null;
  content: string;
  role: string;
  is_shared: boolean;
  is_default: boolean;
  usage_count: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export default function RoleLibrary() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Data state
  const [prompts, setPrompts] = useState<RolePrompt[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');

  // Create form
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newRole, setNewRole] = useState<AgentRole>('assistant');
  const [newIsShared, setNewIsShared] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit sheet
  const [editSheet, setEditSheet] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<RolePrompt | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editRole, setEditRole] = useState<AgentRole>('assistant');
  const [editIsShared, setEditIsShared] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Delete dialog
  const [promptToDelete, setPromptToDelete] = useState<RolePrompt | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchPrompts();
    }
  }, [user, authLoading, navigate]);

  const fetchPrompts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('prompt_library')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !newName.trim() || !newContent.trim()) return;
    setCreating(true);

    try {
      const { data, error } = await supabase
        .from('prompt_library')
        .insert([{
          user_id: user.id,
          name: newName.trim(),
          description: newDescription.trim() || null,
          content: newContent.trim(),
          role: newRole,
          is_shared: newIsShared,
        }])
        .select()
        .single();

      if (error) throw error;

      setPrompts([data, ...prompts]);
      setNewName('');
      setNewDescription('');
      setNewContent('');
      setNewRole('assistant');
      setNewIsShared(false);
      toast.success(t('roleLibrary.created'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const openEditSheet = (prompt: RolePrompt) => {
    setEditingPrompt(prompt);
    setEditName(prompt.name);
    setEditDescription(prompt.description || '');
    setEditContent(prompt.content);
    setEditRole(prompt.role as AgentRole);
    setEditIsShared(prompt.is_shared);
    setEditSheet(true);
  };

  const handleUpdate = async () => {
    if (!editingPrompt || !editName.trim() || !editContent.trim()) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('prompt_library')
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null,
          content: editContent.trim(),
          role: editRole,
          is_shared: editIsShared,
        })
        .eq('id', editingPrompt.id);

      if (error) throw error;

      setPrompts(prompts.map(p => 
        p.id === editingPrompt.id 
          ? { 
              ...p, 
              name: editName.trim(),
              description: editDescription.trim() || null,
              content: editContent.trim(),
              role: editRole,
              is_shared: editIsShared,
              updated_at: new Date().toISOString()
            } 
          : p
      ));
      
      setEditSheet(false);
      setEditingPrompt(null);
      toast.success(t('roleLibrary.updated'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!promptToDelete) return;

    try {
      const { error } = await supabase
        .from('prompt_library')
        .delete()
        .eq('id', promptToDelete.id);

      if (error) throw error;

      setPrompts(prompts.filter(p => p.id !== promptToDelete.id));
      toast.success(t('roleLibrary.deleted'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPromptToDelete(null);
    }
  };

  // Filter prompts
  const filteredPrompts = prompts.filter(prompt => {
    // Search
    const matchesSearch = 
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prompt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    // Role filter
    const matchesRole = roleFilter === 'all' || prompt.role === roleFilter;
    
    // Owner filter
    const matchesOwner = 
      ownerFilter === 'all' ||
      (ownerFilter === 'own' && prompt.user_id === user?.id) ||
      (ownerFilter === 'shared' && prompt.is_shared);
    
    return matchesSearch && matchesRole && matchesOwner;
  });

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
      <div className="container max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t('roleLibrary.title')}</h1>
        </div>

        {/* Create New Prompt */}
        <HydraCard variant="glass" className="p-6 mb-8">
          <HydraCardHeader>
            <Plus className="h-5 w-5 text-primary" />
            <HydraCardTitle>{t('roleLibrary.new')}</HydraCardTitle>
          </HydraCardHeader>
          <HydraCardContent>
            <div className="space-y-4">
              {/* Name and Role row */}
              <div className="flex gap-3">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('roleLibrary.namePlaceholder')}
                  className="flex-1"
                />
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AgentRole)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue>
                      <RoleDisplay role={newRole} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    <RoleSelectOptions />
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t('roleLibrary.descriptionPlaceholder')}
              />

              {/* Content */}
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={t('roleLibrary.contentPlaceholder')}
                className="min-h-[120px]"
              />

              {/* Footer with switch and button */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="new-shared"
                    checked={newIsShared}
                    onCheckedChange={setNewIsShared}
                  />
                  <Label htmlFor="new-shared" className="text-sm cursor-pointer">
                    {t('roleLibrary.isShared')}
                  </Label>
                </div>
                <Button 
                  onClick={handleCreate} 
                  disabled={creating || !newName.trim() || !newContent.trim()}
                  className="hydra-glow-sm"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  {t('roleLibrary.create')}
                </Button>
              </div>
            </div>
          </HydraCardContent>
        </HydraCard>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('roleLibrary.search')}
              className="pl-9"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="all">{t('roleLibrary.filterAll')}</SelectItem>
              <RoleSelectOptions />
            </SelectContent>
          </Select>

          <Select value={ownerFilter} onValueChange={(v) => setOwnerFilter(v as OwnerFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="all">{t('roleLibrary.filterAll')}</SelectItem>
              <SelectItem value="own">{t('roleLibrary.filterOwn')}</SelectItem>
              <SelectItem value="shared">{t('roleLibrary.filterShared')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Prompts List */}
        <div className="space-y-4">
          {filteredPrompts.length === 0 ? (
            <HydraCard variant="glass" className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {prompts.length === 0 ? t('roleLibrary.empty') : t('roleLibrary.noResults')}
              </p>
            </HydraCard>
          ) : (
            filteredPrompts.map((prompt) => (
              <HydraCard 
                key={prompt.id} 
                variant="glass" 
                glow 
                className="p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium truncate">{prompt.name}</h3>
                      <Badge className={getRoleBadgeColor(prompt.role)}>
                        {t(`role.${prompt.role}`)}
                      </Badge>
                      {prompt.is_shared && (
                        <span title={t('roleLibrary.filterShared')}>
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                      )}
                    </div>
                    
                    {/* Description */}
                    {prompt.description && (
                      <p className="text-sm text-muted-foreground mb-2">{prompt.description}</p>
                    )}
                    
                    {/* Content preview */}
                    <p className="text-xs text-muted-foreground/70 line-clamp-2">
                      {prompt.content}
                    </p>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                      <span>{t('roleLibrary.usedCount').replace('{count}', String(prompt.usage_count))}</span>
                      <span>{format(new Date(prompt.updated_at), 'dd.MM.yyyy')}</span>
                    </div>
                  </div>
                  
                  {/* Actions (only for own prompts) */}
                  {prompt.user_id === user?.id && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditSheet(prompt)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setPromptToDelete(prompt)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </HydraCard>
            ))
          )}
        </div>

        {/* Edit Sheet */}
        <Sheet open={editSheet} onOpenChange={setEditSheet}>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>{t('roleLibrary.edit')}</SheetTitle>
            </SheetHeader>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label>{t('roleLibrary.name')}</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={t('roleLibrary.namePlaceholder')}
                  />
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label>{t('roleLibrary.role')}</Label>
                  <Select value={editRole} onValueChange={(v) => setEditRole(v as AgentRole)}>
                    <SelectTrigger>
                      <SelectValue>
                        <RoleDisplay role={editRole} />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      <RoleSelectOptions />
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>{t('roleLibrary.description')}</Label>
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder={t('roleLibrary.descriptionPlaceholder')}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>{t('roleLibrary.content')}</Label>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder={t('roleLibrary.contentPlaceholder')}
                    className="min-h-[200px]"
                  />
                </div>

                {/* Shared switch */}
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-shared"
                    checked={editIsShared}
                    onCheckedChange={setEditIsShared}
                  />
                  <Label htmlFor="edit-shared" className="cursor-pointer">
                    {t('roleLibrary.isShared')}
                  </Label>
                </div>
              </div>
            </ScrollArea>
            
            <SheetFooter className="p-4 border-t">
              <Button variant="outline" onClick={() => setEditSheet(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={updating || !editName.trim() || !editContent.trim()}
              >
                {updating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('common.save')}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!promptToDelete} onOpenChange={(open) => !open && setPromptToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('roleLibrary.deleteConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('roleLibrary.deleteConfirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
