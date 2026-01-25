import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Library, Trash2, Loader2, User, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AgentRole } from './PerModelSettings';

interface PromptItem {
  id: string;
  name: string;
  description: string | null;
  role: string;
  content: string;
  is_shared: boolean;
  is_default: boolean;
  usage_count: number;
  user_id: string;
  created_at: string;
}

interface PromptLibraryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (prompt: { content: string; role: AgentRole }) => void;
  currentRole?: AgentRole;
}

export function PromptLibraryPicker({ open, onOpenChange, onSelect, currentRole }: PromptLibraryPickerProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(currentRole || 'all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchPrompts();
    }
  }, [open, user]);

  useEffect(() => {
    if (currentRole) {
      setRoleFilter(currentRole);
    }
  }, [currentRole]);

  const fetchPrompts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('prompt_library')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = async (prompt: PromptItem) => {
    // Increment usage count
    try {
      await supabase
        .from('prompt_library')
        .update({ usage_count: prompt.usage_count + 1 })
        .eq('id', prompt.id);
    } catch (error) {
      console.error('Failed to update usage count:', error);
    }

    onSelect({
      content: prompt.content,
      role: prompt.role as AgentRole,
    });
    onOpenChange(false);
    toast.success(t('promptLibrary.applied'));
  };

  const handleDeletePrompt = async (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    setDeletingId(promptId);

    try {
      const { error } = await supabase
        .from('prompt_library')
        .delete()
        .eq('id', promptId);

      if (error) throw error;

      setPrompts(prompts.filter(p => p.id !== promptId));
      toast.success(t('promptLibrary.deleted'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = 
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prompt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesRole = roleFilter === 'all' || prompt.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'assistant': return 'bg-primary/20 text-primary';
      case 'critic': return 'bg-orange-500/20 text-orange-400';
      case 'arbiter': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            {t('promptLibrary.title')}
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('promptLibrary.searchPlaceholder')}
              className="pl-8 h-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('promptLibrary.allRoles')}</SelectItem>
              <SelectItem value="assistant">{t('role.assistant')}</SelectItem>
              <SelectItem value="critic">{t('role.critic')}</SelectItem>
              <SelectItem value="arbiter">{t('role.arbiter')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Prompts List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {prompts.length === 0 
                ? t('promptLibrary.empty')
                : t('promptLibrary.noResults')
              }
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {filteredPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleSelectPrompt(prompt)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border border-border',
                    'hover:bg-accent hover:border-accent-foreground/20 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{prompt.name}</span>
                        <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', getRoleBadgeColor(prompt.role))}>
                          {t(`role.${prompt.role}`)}
                        </Badge>
                        {prompt.is_shared && (
                          <span title={t('promptLibrary.shared')}>
                            <Users className="h-3 w-3 text-muted-foreground" />
                          </span>
                        )}
                        {prompt.user_id === user?.id && (
                          <span title={t('promptLibrary.own')}>
                            <User className="h-3 w-3 text-muted-foreground" />
                          </span>
                        )}
                      </div>
                      {prompt.description && (
                        <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                          {prompt.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70 line-clamp-2">
                        {prompt.content}
                      </p>
                    </div>
                    {prompt.user_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeletePrompt(e, prompt.id)}
                        disabled={deletingId === prompt.id}
                      >
                        {deletingId === prompt.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                    <span>{t('promptLibrary.usedTimes').replace('{count}', String(prompt.usage_count))}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}