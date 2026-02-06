import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoleKnowledge, type RoleKnowledgeEntry } from '@/hooks/useRoleKnowledge';
import type { AgentRole } from '@/config/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { Plus, Trash2, Search, BookOpen, FileText, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'general', labelKey: 'Общее' },
  { value: 'documentation', labelKey: 'Документация' },
  { value: 'best-practices', labelKey: 'Лучшие практики' },
  { value: 'architecture', labelKey: 'Архитектура' },
  { value: 'api-reference', labelKey: 'API Reference' },
  { value: 'tutorial', labelKey: 'Туториал' },
  { value: 'hydra-internals', labelKey: 'Hydra Internals' },
];

interface RoleKnowledgeTabProps {
  role: AgentRole;
}

// Simple text chunking: split by paragraphs, combine to target size
function chunkText(text: string, maxChunkSize = 1500, overlap = 200): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      // Keep overlap from end of previous chunk
      const words = current.split(/\s+/);
      const overlapWords = words.slice(-Math.ceil(overlap / 5));
      current = overlapWords.join(' ') + '\n\n' + para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

export default function RoleKnowledgeTab({ role }: RoleKnowledgeTabProps) {
  const { t, language } = useLanguage();
  const {
    entries,
    loading,
    fetchEntries,
    saveEntry,
    deleteEntry,
    deleteBySource,
    getStats,
  } = useRoleKnowledge(role);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'entry' | 'source'; id: string; label: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Add form state
  const [newContent, setNewContent] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newVersion, setNewVersion] = useState('');

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const stats = getStats();

  // Group entries by source
  const groupedEntries = entries.reduce((acc, entry) => {
    const key = entry.source_title || '(без источника)';
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {} as Record<string, RoleKnowledgeEntry[]>);

  // Filter
  const filteredGroups = Object.entries(groupedEntries).filter(([title, items]) => {
    const matchesSearch = !searchQuery ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      items.some(i => i.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' ||
      items.some(i => i.category === filterCategory);
    return matchesSearch && matchesCategory;
  });

  const handleAdd = useCallback(async () => {
    if (!newContent.trim()) {
      toast.error('Введите содержание');
      return;
    }

    setIsSaving(true);
    try {
      const chunks = chunkText(newContent);
      let saved = 0;

      for (let i = 0; i < chunks.length; i++) {
        const id = await saveEntry({
          content: chunks[i],
          source_title: newTitle.trim() || undefined,
          source_url: newUrl.trim() || undefined,
          category: newCategory,
          version: newVersion.trim() || undefined,
          chunk_index: i,
          chunk_total: chunks.length,
        });
        if (id) saved++;
      }

      toast.success(
        language === 'ru'
          ? `Сохранено ${saved} фрагмент(ов)`
          : `Saved ${saved} chunk(s)`
      );

      // Reset form
      setNewContent('');
      setNewTitle('');
      setNewUrl('');
      setNewCategory('general');
      setNewVersion('');
      setShowAddDialog(false);
    } catch (error) {
      console.error('[RoleKnowledgeTab] Add error:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  }, [newContent, newTitle, newUrl, newCategory, newVersion, saveEntry, language]);

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;

    let success = false;
    if (deleteConfirm.type === 'entry') {
      success = await deleteEntry(deleteConfirm.id);
    } else {
      success = await deleteBySource(deleteConfirm.id);
    }

    if (success) {
      toast.success(language === 'ru' ? 'Удалено' : 'Deleted');
    }
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteEntry, deleteBySource, language]);

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {language === 'ru' ? 'Профильные знания' : 'Domain Knowledge'}
          </span>
          <Badge variant="secondary" className="text-xs">
            {stats.total} {language === 'ru' ? 'фрагм.' : 'chunks'}
          </Badge>
          {stats.sources > 0 && (
            <Badge variant="outline" className="text-xs">
              {stats.sources} {language === 'ru' ? 'источн.' : 'sources'}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-7 text-xs"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-3 w-3" />
          {language === 'ru' ? 'Добавить' : 'Add'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'ru' ? 'Поиск...' : 'Search...'}
            className="h-8 pl-7 text-xs"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ru' ? 'Все' : 'All'}</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.labelKey}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          {entries.length === 0
            ? (language === 'ru' ? 'Нет загруженных знаний. Добавьте документацию или материалы.' : 'No knowledge loaded. Add documentation or materials.')
            : (language === 'ru' ? 'Ничего не найдено' : 'Nothing found')
          }
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {filteredGroups.map(([sourceTitle, items]) => (
              <div key={sourceTitle} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">{sourceTitle}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {items.length} {language === 'ru' ? 'чанк.' : 'ch.'}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {items[0]?.category}
                    </Badge>
                    {items[0]?.version && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        v{items[0].version}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {items[0]?.source_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => window.open(items[0].source_url!, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm({
                        type: 'source',
                        id: items[0]?.source_title || '',
                        label: sourceTitle,
                      })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {/* Preview first chunk */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {items[0]?.content}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Add Knowledge Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ru' ? 'Добавить профильное знание' : 'Add Domain Knowledge'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {language === 'ru' ? 'Название источника' : 'Source Title'}
                </Label>
                <Input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="React 19 Documentation"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">URL</Label>
                <Input
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {language === 'ru' ? 'Категория' : 'Category'}
                </Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.labelKey}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {language === 'ru' ? 'Версия' : 'Version'}
                </Label>
                <Input
                  value={newVersion}
                  onChange={e => setNewVersion(e.target.value)}
                  placeholder="19.0"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                {language === 'ru' ? 'Содержание (будет разбито на фрагменты автоматически)' : 'Content (will be auto-chunked)'}
              </Label>
              <Textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder={language === 'ru'
                  ? 'Вставьте текст документации, статьи или материала...'
                  : 'Paste documentation text, article or material...'
                }
                className="min-h-[200px] text-sm font-mono"
              />
              {newContent.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  ~{chunkText(newContent).length} {language === 'ru' ? 'фрагмент(ов)' : 'chunk(s)'}
                  {' · '}{newContent.length} {language === 'ru' ? 'символов' : 'chars'}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleAdd} disabled={isSaving || !newContent.trim()}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {language === 'ru' ? 'Сохранить' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ru' ? 'Подтвердите удаление' : 'Confirm deletion'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'source'
                ? (language === 'ru'
                  ? `Удалить все фрагменты из источника «${deleteConfirm.label}»?`
                  : `Delete all chunks from source "${deleteConfirm.label}"?`)
                : (language === 'ru'
                  ? 'Удалить этот фрагмент знания?'
                  : 'Delete this knowledge chunk?')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ru' ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {language === 'ru' ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
