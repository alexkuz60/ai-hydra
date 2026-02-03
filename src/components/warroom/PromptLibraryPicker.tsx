import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Search, Library, Trash2, Loader2, User, Users, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AgentRole, getRoleBadgeColor } from '@/config/roles';
import { RoleSelectOptions } from '@/components/ui/RoleSelectItem';

// Detect if text is primarily Russian (Cyrillic)
function detectLanguage(text: string): 'ru' | 'en' {
  const cyrillicRegex = /[\u0400-\u04FF]/g;
  const latinRegex = /[a-zA-Z]/g;
  const cyrillicMatches = text.match(cyrillicRegex) || [];
  const latinMatches = text.match(latinRegex) || [];
  return cyrillicMatches.length > latinMatches.length ? 'ru' : 'en';
}

type PromptLanguage = 'ru' | 'en' | 'auto';

interface PromptItem {
  id: string;
  name: string;
  description: string | null;
  role: string;
  content: string;
  is_shared: boolean;
  is_default: boolean;
  usage_count: number;
  created_at: string;
  language: PromptLanguage;
  isOwner: boolean; // Determined separately without exposing user_id
}

// Get effective language for grouping (use manual setting or auto-detect)
function getEffectiveLanguage(prompt: PromptItem): 'ru' | 'en' {
  if (prompt.language === 'ru' || prompt.language === 'en') {
    return prompt.language;
  }
  return detectLanguage(prompt.content);
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
  const [ruOpen, setRuOpen] = useState(true);
  const [enOpen, setEnOpen] = useState(true);

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
      // Select only necessary columns, excluding user_id for privacy on shared prompts
      const { data, error } = await supabase
        .from('prompt_library')
        .select('id, name, description, role, content, is_shared, is_default, usage_count, created_at, language')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      
      // Map data to include ownership check without exposing user_id
      const promptsWithOwnership = (data || []).map(prompt => ({
        ...prompt,
        language: (prompt.language || 'auto') as PromptLanguage,
        isOwner: false, // Will be determined after we check ownership separately
      }));
      
      // Check ownership for own prompts only (RLS ensures we only see our own + shared)
      const { data: ownPrompts } = await supabase
        .from('prompt_library')
        .select('id')
        .eq('user_id', user!.id);
      
      const ownPromptIds = new Set((ownPrompts || []).map(p => p.id));
      
      const finalPrompts = promptsWithOwnership.map(prompt => ({
        ...prompt,
        isOwner: ownPromptIds.has(prompt.id),
      }));
      
      setPrompts(finalPrompts);
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

  // Group prompts by effective language (manual or auto-detected)
  const ruPrompts = filteredPrompts.filter(p => getEffectiveLanguage(p) === 'ru');
  const enPrompts = filteredPrompts.filter(p => getEffectiveLanguage(p) === 'en');

  const getRoleBadge = (role: string) => {
    const colorClass = getRoleBadgeColor(role);
    return colorClass;
  };

  const renderPromptItem = (prompt: PromptItem) => (
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
            <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', getRoleBadge(prompt.role))}>
              {t(`role.${prompt.role}`)}
            </Badge>
            {prompt.is_shared && (
              <span title={t('promptLibrary.shared')}>
                <Users className="h-3 w-3 text-muted-foreground" />
              </span>
            )}
            {prompt.isOwner && (
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
        {prompt.isOwner && !prompt.is_default && (
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
  );

  const renderLanguageGroup = (
    langPrompts: PromptItem[],
    langCode: 'ru' | 'en',
    isOpen: boolean,
    setIsOpen: (open: boolean) => void
  ) => {
    if (langPrompts.length === 0) return null;
    
    const label = langCode === 'ru' ? 'RU' : 'EN';
    const fullLabel = langCode === 'ru' ? t('promptLibrary.russianPrompts') : t('promptLibrary.englishPrompts');
    
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-1 hover:bg-accent/50 rounded-md transition-colors">
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            !isOpen && "-rotate-90"
          )} />
          <Badge variant="outline" className="font-mono text-xs">
            {label}
          </Badge>
          <span className="text-sm text-muted-foreground">{fullLabel}</span>
          <span className="text-xs text-muted-foreground/60 ml-auto">({langPrompts.length})</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {langPrompts.map(renderPromptItem)}
        </CollapsibleContent>
      </Collapsible>
    );
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
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('promptLibrary.allRoles')}</SelectItem>
              <RoleSelectOptions />
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
            <div className="space-y-3 py-2">
              {renderLanguageGroup(ruPrompts, 'ru', ruOpen, setRuOpen)}
              {renderLanguageGroup(enPrompts, 'en', enOpen, setEnOpen)}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}