import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoleKnowledge, type RoleKnowledgeEntry } from '@/hooks/useRoleKnowledge';
import type { AgentRole } from '@/config/roles';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  DialogDescription,
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
import { Plus, Trash2, Search, BookOpen, FileText, Loader2, ExternalLink, Sparkles, Globe, Upload, RefreshCw, Link, FileUp, PenLine, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CATEGORIES = [
  { value: 'general', label: { ru: 'Общее', en: 'General' } },
  { value: 'documentation', label: { ru: 'Документация', en: 'Documentation' } },
  { value: 'standard', label: { ru: 'Стандарты', en: 'Standards' } },
  { value: 'procedure', label: { ru: 'Процедуры', en: 'Procedures' } },
  { value: 'system_prompt', label: { ru: 'Системный промпт', en: 'System Prompt' } },
  { value: 'best-practices', label: { ru: 'Лучшие практики', en: 'Best Practices' } },
  { value: 'architecture', label: { ru: 'Архитектура', en: 'Architecture' } },
  { value: 'api-reference', label: { ru: 'API Reference', en: 'API Reference' } },
  { value: 'tutorial', label: { ru: 'Туториал', en: 'Tutorial' } },
  { value: 'hydra-internals', label: { ru: 'Hydra Internals', en: 'Hydra Internals' } },
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
  const { user } = useAuth();
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
  const [isSeeding, setIsSeeding] = useState(false);
  const [refreshingSource, setRefreshingSource] = useState<string | null>(null);

  // Firecrawl state
  const [showFirecrawlDialog, setShowFirecrawlDialog] = useState(false);
  const [firecrawlUrl, setFirecrawlUrl] = useState('');
  const [firecrawlCategory, setFirecrawlCategory] = useState('documentation');
  const [firecrawlVersion, setFirecrawlVersion] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedContent, setScrapedContent] = useState<string | null>(null);
  const [scrapedTitle, setScrapedTitle] = useState('');
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

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

  // Seed knowledge from Hydrapedia
  const handleSeed = useCallback(async (force = false) => {
    setIsSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-role-knowledge', {
        body: { role, include_system_prompt: true, force },
      });
      
      if (error) throw error;
      
      if (data?.skipped) {
        toast.info(
          language === 'ru'
            ? `У роли уже есть ${data.existing_count} документов. Используйте пересидинг для обновления.`
            : `Role already has ${data.existing_count} docs. Use re-seed to update.`
        );
      } else if (data?.seeded > 0) {
        toast.success(
          language === 'ru'
            ? `Загружено ${data.seeded} фрагментов из ${data.sources?.length || 0} источников`
            : `Loaded ${data.seeded} chunks from ${data.sources?.length || 0} sources`
        );
        await fetchEntries();
      } else {
        toast.info(
          language === 'ru'
            ? 'Нет доступных знаний для этой роли'
            : 'No knowledge available for this role'
        );
      }
    } catch (error) {
      console.error('[RoleKnowledgeTab] Seed error:', error);
      toast.error(language === 'ru' ? 'Ошибка загрузки знаний' : 'Failed to seed knowledge');
    } finally {
      setIsSeeding(false);
    }
  }, [role, language, fetchEntries]);

  // Handle file upload
  const ALLOWED_KNOWLEDGE_TYPES = [
    'text/plain', 'text/markdown', 'text/x-markdown',
    'application/json', 'text/csv', 'text/yaml', 'text/x-yaml',
  ];
  const ALLOWED_EXTENSIONS = ['.txt', '.md', '.markdown', '.json', '.csv', '.yaml', '.yml'];

  const handleFileUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.[0] || !user?.id) return;
    const file = fileList[0];
    
    // Validate file type
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAllowed = ALLOWED_KNOWLEDGE_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);
    if (!isAllowed) {
      toast.error(language === 'ru' 
        ? 'Поддерживаются только текстовые файлы: TXT, MD, JSON, CSV, YAML' 
        : 'Only text files supported: TXT, MD, JSON, CSV, YAML');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'ru' ? 'Максимум 5 МБ' : 'Max 5 MB');
      return;
    }

    setIsUploadingFile(true);
    setSaveProgress(null);
    try {
      // 1. Read file content
      const content = await file.text();
      if (!content.trim()) {
        toast.error(language === 'ru' ? 'Файл пустой' : 'File is empty');
        return;
      }

      // 2. Upload to storage
      const filePath = `${user.id}/${role}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('knowledge-files')
        .upload(filePath, file);
      if (uploadErr) throw uploadErr;

      // 3. Chunk and save to role_knowledge
      const chunks = chunkText(content);
      let saved = 0;
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      setSaveProgress({ current: 0, total: chunks.length });

      for (let i = 0; i < chunks.length; i++) {
        setSaveProgress({ current: i + 1, total: chunks.length });
        const id = await saveEntry({
          content: chunks[i],
          source_title: fileName,
          category: 'documentation',
          chunk_index: i,
          chunk_total: chunks.length,
          metadata: { 
            file_path: filePath, 
            file_name: file.name,
            file_size: file.size,
            uploaded_at: new Date().toISOString(),
            load_method: 'file',
          },
        });
        if (id) saved++;
      }

      toast.success(
        language === 'ru'
          ? `Файл «${file.name}» → ${saved} фрагмент(ов) в базу знаний`
          : `File "${file.name}" → ${saved} chunk(s) to knowledge base`
      );
    } catch (err) {
      console.error('[RoleKnowledgeTab] File upload error:', err);
      toast.error(language === 'ru' ? 'Ошибка загрузки файла' : 'File upload failed');
    } finally {
      setIsUploadingFile(false);
      setSaveProgress(null);
    }
  }, [user?.id, role, language, saveEntry]);


  const isEn = language !== 'ru';
  const groupedEntries = entries.reduce((acc, entry) => {
    const key = entry.source_title || (language === 'ru' ? '(без источника)' : '(no source)');
    if (!acc[key]) acc[key] = { items: [], titleEn: entry.source_title_en || null };
    acc[key].items.push(entry);
    return acc;
  }, {} as Record<string, { items: RoleKnowledgeEntry[]; titleEn: string | null }>);

  // Filter
  const filteredGroups = Object.entries(groupedEntries).filter(([title, { items }]) => {
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
    setSaveProgress(null);
    try {
      const chunks = chunkText(newContent);
      let saved = 0;
      setSaveProgress({ current: 0, total: chunks.length });

      for (let i = 0; i < chunks.length; i++) {
        setSaveProgress({ current: i + 1, total: chunks.length });
        const id = await saveEntry({
          content: chunks[i],
          source_title: newTitle.trim() || undefined,
          source_url: newUrl.trim() || undefined,
          category: newCategory,
          version: newVersion.trim() || undefined,
          chunk_index: i,
          chunk_total: chunks.length,
          metadata: {
            load_method: 'manual',
          },
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
      setSaveProgress(null);
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

  // Refresh a source: re-scrape URL or re-read file
  const handleRefreshSource = useCallback(async (sourceTitle: string, items: RoleKnowledgeEntry[]) => {
    const meta = items[0]?.metadata as any;
    const loadMethod = meta?.load_method;
    const sourceUrl = items[0]?.source_url;

    if (loadMethod === 'url' && sourceUrl) {
      // Re-scrape the URL
      setRefreshingSource(sourceTitle);
      try {
        const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
          body: { url: sourceUrl, options: { formats: ['markdown'], onlyMainContent: true } },
        });
        if (error) throw error;
        const markdown = data?.data?.markdown || data?.markdown;
        if (!markdown) {
          toast.error(language === 'ru' ? 'Не удалось извлечь контент' : 'Failed to extract content');
          return;
        }

        // Delete old entries
        await deleteBySource(sourceTitle);

        // Save new
        const chunks = chunkText(markdown);
        let saved = 0;
        for (let i = 0; i < chunks.length; i++) {
          const id = await saveEntry({
            content: chunks[i],
            source_title: sourceTitle,
            source_url: sourceUrl,
            category: items[0]?.category || 'documentation',
            version: items[0]?.version || undefined,
            chunk_index: i,
            chunk_total: chunks.length,
            metadata: {
              load_method: 'url',
              is_virtual: true,
              scraped_at: new Date().toISOString(),
            },
          });
          if (id) saved++;
        }

        toast.success(
          language === 'ru'
            ? `Обновлено: ${saved} фрагментов из «${sourceTitle}»`
            : `Refreshed: ${saved} chunks from "${sourceTitle}"`
        );
      } catch (err) {
        console.error('[RefreshSource] Error:', err);
        toast.error(language === 'ru' ? 'Ошибка обновления' : 'Refresh failed');
      } finally {
        setRefreshingSource(null);
      }
    } else if (loadMethod === 'file' && meta?.file_path) {
      // Re-read file from storage
      setRefreshingSource(sourceTitle);
      try {
        const { data: blob, error } = await supabase.storage
          .from('knowledge-files')
          .download(meta.file_path);
        if (error || !blob) throw error || new Error('Download failed');
        const content = await blob.text();
        if (!content.trim()) {
          toast.error(language === 'ru' ? 'Файл пустой' : 'File is empty');
          return;
        }

        await deleteBySource(sourceTitle);

        const chunks = chunkText(content);
        let saved = 0;
        for (let i = 0; i < chunks.length; i++) {
          const id = await saveEntry({
            content: chunks[i],
            source_title: sourceTitle,
            category: items[0]?.category || 'documentation',
            chunk_index: i,
            chunk_total: chunks.length,
            metadata: {
              ...meta,
              load_method: 'file',
              uploaded_at: new Date().toISOString(),
            },
          });
          if (id) saved++;
        }

        toast.success(
          language === 'ru'
            ? `Перечитано: ${saved} фрагментов из файла`
            : `Re-read: ${saved} chunks from file`
        );
      } catch (err) {
        console.error('[RefreshSource] File error:', err);
        toast.error(language === 'ru' ? 'Ошибка повторного чтения файла' : 'File re-read failed');
      } finally {
        setRefreshingSource(null);
      }
    } else {
      toast.info(language === 'ru' ? 'Для этого источника обновление недоступно' : 'Refresh not available for this source');
    }
  }, [language, deleteBySource, saveEntry]);

  // Firecrawl: scrape URL
  const handleScrape = useCallback(async () => {
    if (!firecrawlUrl.trim()) return;
    setIsScraping(true);
    setScrapedContent(null);
    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url: firecrawlUrl.trim(), options: { formats: ['markdown'], onlyMainContent: true } },
      });
      if (error) throw error;
      const markdown = data?.data?.markdown || data?.markdown;
      const title = data?.data?.metadata?.title || data?.metadata?.title || firecrawlUrl.trim();
      if (!markdown) {
        toast.error(language === 'ru' ? 'Не удалось извлечь контент' : 'Failed to extract content');
        return;
      }
      setScrapedContent(markdown);
      setScrapedTitle(title);
      toast.success(language === 'ru' ? `Извлечено ${markdown.length} символов` : `Extracted ${markdown.length} chars`);
    } catch (err) {
      console.error('[Firecrawl] Scrape error:', err);
      toast.error(language === 'ru' ? 'Ошибка скрейпинга' : 'Scrape failed');
    } finally {
      setIsScraping(false);
    }
  }, [firecrawlUrl, language]);

  // Firecrawl: save scraped content as knowledge
  const handleSaveScraped = useCallback(async () => {
    if (!scrapedContent) return;
    setIsSaving(true);
    setSaveProgress(null);
    try {
      const chunks = chunkText(scrapedContent);
      let saved = 0;
      setSaveProgress({ current: 0, total: chunks.length });
      for (let i = 0; i < chunks.length; i++) {
        setSaveProgress({ current: i + 1, total: chunks.length });
        const id = await saveEntry({
          content: chunks[i],
          source_title: scrapedTitle || firecrawlUrl.trim(),
          source_url: firecrawlUrl.trim(),
          category: firecrawlCategory,
          version: firecrawlVersion.trim() || undefined,
          chunk_index: i,
          chunk_total: chunks.length,
          metadata: {
            load_method: 'url',
            is_virtual: true,
            scraped_at: new Date().toISOString(),
          },
        });
        if (id) saved++;
      }
      toast.success(
        language === 'ru'
          ? `Сохранено ${saved} фрагмент(ов) из «${scrapedTitle}»`
          : `Saved ${saved} chunk(s) from "${scrapedTitle}"`
      );
      setShowFirecrawlDialog(false);
      setFirecrawlUrl('');
      setScrapedContent(null);
      setScrapedTitle('');
      setFirecrawlVersion('');
    } catch (err) {
      console.error('[Firecrawl] Save error:', err);
      toast.error(language === 'ru' ? 'Ошибка сохранения' : 'Save failed');
    } finally {
      setIsSaving(false);
      setSaveProgress(null);
    }
  }, [scrapedContent, scrapedTitle, firecrawlUrl, firecrawlCategory, firecrawlVersion, saveEntry, language]);

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
        <div className="flex items-center gap-1.5">
          {stats.total === 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-7 text-xs"
              onClick={() => handleSeed(false)}
              disabled={isSeeding}
            >
              {isSeeding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {language === 'ru' ? 'Из Гидрапедии' : 'From Hydrapedia'}
            </Button>
          )}
          {stats.total > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 h-7 text-xs text-muted-foreground"
              onClick={() => handleSeed(true)}
              disabled={isSeeding}
              title={language === 'ru' ? 'Пересидить знания из Гидрапедии (заменит существующие)' : 'Re-seed from Hydrapedia (replaces existing)'}
            >
              {isSeeding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-7 text-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingFile}
          >
            {isUploadingFile ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {language === 'ru' ? 'Из файла' : 'From file'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setShowFirecrawlDialog(true)}
          >
            <Globe className="h-3 w-3" />
            {language === 'ru' ? 'С веб-страницы' : 'From URL'}
          </Button>
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
      </div>

      {/* Hidden file input for knowledge files */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.json,.csv,.yaml,.yml"
        className="hidden"
        onChange={(e) => {
          handleFileUpload(e.target.files);
          e.target.value = '';
        }}
      />

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
              <SelectItem key={c.value} value={c.value}>{language === 'ru' ? c.label.ru : c.label.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredGroups.length === 0 && entries.length === 0 ? (
        <div className="text-center py-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            {language === 'ru' ? 'Нет загруженных знаний.' : 'No knowledge loaded.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="default"
              className="gap-1.5"
              onClick={() => handleSeed(false)}
              disabled={isSeeding}
            >
              {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {language === 'ru' ? 'Загрузить из Гидрапедии' : 'Seed from Hydrapedia'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFile}
            >
              {isUploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {language === 'ru' ? 'Из файла' : 'From file'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowFirecrawlDialog(true)}
            >
              <Globe className="h-4 w-4" />
              {language === 'ru' ? 'С веб-страницы' : 'From URL'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4" />
              {language === 'ru' ? 'Добавить вручную' : 'Add manually'}
            </Button>
          </div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          {language === 'ru' ? 'Ничего не найдено' : 'Nothing found'}
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {filteredGroups.map(([sourceTitle, { items, titleEn }]) => {
              const displayTitle = isEn && titleEn ? titleEn : sourceTitle;
              const meta = items[0]?.metadata as any;
              const loadMethod: string = meta?.load_method || (items[0]?.source_url ? 'url' : meta?.file_path ? 'file' : 'manual');
              const isVirtual = !!meta?.is_virtual;
              const scrapedAt = meta?.scraped_at;
              const uploadedAt = meta?.uploaded_at;
              const canRefresh = loadMethod === 'url' || loadMethod === 'file';
              const isRefreshing = refreshingSource === sourceTitle;

              const LoadMethodIcon = loadMethod === 'url' ? Globe : loadMethod === 'file' ? FileUp : PenLine;
              const methodLabel = loadMethod === 'url'
                ? (language === 'ru' ? 'Скрейпинг' : 'Scraped')
                : loadMethod === 'file'
                  ? (language === 'ru' ? 'Файл' : 'File')
                  : (language === 'ru' ? 'Вручную' : 'Manual');

              const lastDate = scrapedAt || uploadedAt;

              return (
              <div key={sourceTitle} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <LoadMethodIcon className={cn("h-3.5 w-3.5 shrink-0", loadMethod === 'url' ? 'text-hydra-info' : loadMethod === 'file' ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-sm font-medium truncate">{displayTitle}</span>
                    {isVirtual && (
                      <Badge variant="outline" className="text-[10px] shrink-0 border-hydra-info/40 text-hydra-info">
                        {language === 'ru' ? 'виртуальный' : 'virtual'}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {items.length} {language === 'ru' ? 'чанк.' : 'ch.'}
                    </Badge>
                    {items[0]?.visibility_level && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] shrink-0 font-bold",
                          items[0].visibility_level === 'global' && "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
                          items[0].visibility_level === 'organizational' && "border-sky-500/50 text-sky-400 bg-sky-500/10",
                          items[0].visibility_level === 'role_specific' && "border-amber-500/50 text-amber-400 bg-amber-500/10",
                        )}
                      >
                        {items[0].visibility_level === 'global' ? 'A' : items[0].visibility_level === 'organizational' ? 'B' : 'C'}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {items[0]?.category}
                    </Badge>
                    {items[0]?.version && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        v{items[0].version}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] shrink-0 gap-0.5">
                      <LoadMethodIcon className="h-2.5 w-2.5" />
                      {methodLabel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canRefresh && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-primary"
                        onClick={() => handleRefreshSource(sourceTitle, items)}
                        disabled={isRefreshing}
                        title={language === 'ru' ? 'Обновить источник' : 'Refresh source'}
                      >
                        {isRefreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      </Button>
                    )}
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
                        label: displayTitle,
                      })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {/* Date info */}
                {lastDate && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Calendar className="h-2.5 w-2.5" />
                    {loadMethod === 'url' ? (language === 'ru' ? 'Скрейпинг: ' : 'Scraped: ') : (language === 'ru' ? 'Загружено: ' : 'Uploaded: ')}
                    {format(new Date(lastDate), 'dd.MM.yyyy HH:mm')}
                  </div>
                )}
                {/* Preview first chunk */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {isEn && items[0]?.content_en ? items[0].content_en : items[0]?.content}
                </p>
              </div>
              );
            })}
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
            <DialogDescription>
              {language === 'ru' ? 'Вставьте текст документации для обучения роли' : 'Paste documentation text to train the role'}
            </DialogDescription>
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
                      <SelectItem key={c.value} value={c.value}>{language === 'ru' ? c.label.ru : c.label.en}</SelectItem>
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

          {saveProgress && (
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{language === 'ru' ? 'Сохранение чанков...' : 'Saving chunks...'}</span>
                <span>{saveProgress.current}/{saveProgress.total}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(saveProgress.current / saveProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isSaving}>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleAdd} disabled={isSaving || !newContent.trim()}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {isSaving && saveProgress
                ? `${saveProgress.current}/${saveProgress.total}`
                : language === 'ru' ? 'Сохранить' : 'Save'}
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

      {/* Firecrawl Import Dialog */}
      <Dialog open={showFirecrawlDialog} onOpenChange={(open) => {
        setShowFirecrawlDialog(open);
        if (!open) { setScrapedContent(null); setScrapedTitle(''); }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {language === 'ru' ? 'Импорт с веб-страницы' : 'Import from Web Page'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ru'
                ? 'Укажите URL — содержимое страницы будет извлечено и сохранено как профильное знание'
                : 'Enter a URL — the page content will be extracted and saved as domain knowledge'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* URL input */}
            <div className="flex gap-2">
              <Input
                value={firecrawlUrl}
                onChange={e => setFirecrawlUrl(e.target.value)}
                placeholder="https://docs.example.com/guide"
                className="text-sm flex-1"
                onKeyDown={e => e.key === 'Enter' && !isScraping && handleScrape()}
              />
              <Button
                onClick={handleScrape}
                disabled={isScraping || !firecrawlUrl.trim()}
                className="gap-1.5"
              >
                {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {language === 'ru' ? 'Извлечь' : 'Scrape'}
              </Button>
            </div>

            {/* Category & Version */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{language === 'ru' ? 'Категория' : 'Category'}</Label>
                <Select value={firecrawlCategory} onValueChange={setFirecrawlCategory}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{language === 'ru' ? c.label.ru : c.label.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{language === 'ru' ? 'Версия' : 'Version'}</Label>
                <Input
                  value={firecrawlVersion}
                  onChange={e => setFirecrawlVersion(e.target.value)}
                  placeholder="1.0"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Scraped content preview */}
            {scrapedContent && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    {language === 'ru' ? 'Извлечённый контент' : 'Extracted Content'}
                    {' · '}{scrapedTitle}
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    ~{chunkText(scrapedContent).length} {language === 'ru' ? 'фрагм.' : 'chunks'}
                    {' · '}{scrapedContent.length} {language === 'ru' ? 'символов' : 'chars'}
                  </span>
                </div>
                <ScrollArea className="max-h-[200px] rounded-md border p-3">
                  <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                    {scrapedContent.slice(0, 3000)}
                    {scrapedContent.length > 3000 && '\n\n... (truncated preview)'}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>

          {saveProgress && (
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{language === 'ru' ? 'Сохранение чанков...' : 'Saving chunks...'}</span>
                <span>{saveProgress.current}/{saveProgress.total}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(saveProgress.current / saveProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFirecrawlDialog(false)} disabled={isSaving}>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSaveScraped} disabled={isSaving || !scrapedContent}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
              {isSaving && saveProgress
                ? `${saveProgress.current}/${saveProgress.total}`
                : language === 'ru' ? 'Сохранить знание' : 'Save Knowledge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
