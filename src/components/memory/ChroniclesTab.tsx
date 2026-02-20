import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Search, Loader2, Filter, X, Download, AlertCircle,
  CheckCircle2, Lightbulb, FlaskConical, CheckCheck, Timer,
  ScrollText, Wrench, ExternalLink,
} from 'lucide-react';
import { TermLabel } from '@/components/ui/TermLabel';
import { getTermLabel } from '@/config/memoryGlossary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { RoleBadge, parseAiRevision } from './shared';

// ─── Types & constants ───────────────────────────────────────────────────────

interface ChronicleDBEntry {
  id: string;
  entry_code: string;
  title: string;
  entry_date: string;
  role_object: string;
  initiator: string;
  status: string;
  supervisor_resolution: string;
  supervisor_comment: string | null;
  hypothesis: string | null;
  metrics_before: Record<string, unknown> | null;
  metrics_after: Record<string, unknown> | null;
  summary: string | null;
  ai_revision: string | null;
  created_at: string;
  updated_at: string;
}

const RESOLUTION_CONFIG: Record<string, { label: { ru: string; en: string }; color: string }> = {
  approved: { label: { ru: '✅ Согласен', en: '✅ Agreed' }, color: 'text-hydra-success' },
  wish: { label: { ru: '💬 Пожелание', en: '💬 User Wish' }, color: 'text-hydra-info' },
  rejected: { label: { ru: '❌ Не согласен', en: '❌ Disagreed' }, color: 'text-hydra-critical' },
  pending: { label: { ru: '⏳ Ожидает', en: '⏳ Pending' }, color: 'text-muted-foreground' },
  revised: { label: { ru: '🔄 Пересмотрено ИИ', en: '🔄 AI Revised' }, color: 'text-hydra-expert' },
};

const STATUS_DISPLAY: Record<string, { label: { ru: string; en: string }; color: string; bg: string; Icon: React.ElementType }> = {
  completed: { label: { ru: 'Выполнено', en: 'Completed' }, color: 'text-hydra-success', bg: 'bg-hydra-success/5 border-hydra-success/30', Icon: CheckCheck },
  pending: { label: { ru: 'Ожидает тестирования', en: 'Awaiting Testing' }, color: 'text-hydra-warning', bg: 'bg-hydra-warning/5 border-hydra-warning/30', Icon: Timer },
  sample: { label: { ru: 'Образцовая запись', en: 'Sample Entry' }, color: 'text-hydra-warning', bg: 'bg-hydra-warning/5 border-hydra-warning/30', Icon: Timer },
  revised: { label: { ru: 'Пересмотрено ИИ', en: 'AI Revised' }, color: 'text-hydra-expert', bg: 'bg-hydra-expert/5 border-hydra-expert/30', Icon: FlaskConical },
};

const EMPTY_FORM = {
  title: '',
  entry_code: '',
  role_object: '',
  initiator: 'Supervisor',
  status: 'pending',
  hypothesis: '',
  summary: '',
  metrics_before: '',
  metrics_after: '',
};

// ─── MD Export ───────────────────────────────────────────────────────────────

function generateChroniclesMD(entries: ChronicleDBEntry[], isRu: boolean): string {
  const now = new Date().toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const resLabel: Record<string, string> = {
    approved: isRu ? '✅ Согласован' : '✅ Approved',
    rejected: isRu ? '❌ Отклонён' : '❌ Rejected',
    wish: isRu ? '💬 Пожелание' : '💬 Wish',
    pending: isRu ? '⏳ Ожидает' : '⏳ Pending',
    revised: isRu ? '🔄 Пересмотрено ИИ' : '🔄 AI Revised',
  };
  const statusLabel: Record<string, string> = {
    completed: isRu ? '✅ Выполнено' : '✅ Completed',
    pending: isRu ? '🟡 Ожидает тестирования' : '🟡 Awaiting Testing',
    revised: isRu ? '🔄 Пересмотрено' : '🔄 Revised',
    sample: isRu ? '🟡 Образцовая запись' : '🟡 Sample Entry',
  };

  const header = isRu
    ? `# 📜 Хроники Гидры\n\n> *Публичный артефакт Отдела Эволюционирования. Экспорт от ${now}.*\n\n`
    : `# 📜 Chronicles of Hydra\n\n> *Public artifact of the Evolution Department. Exported on ${now}.*\n\n`;

  const stats = [
    `| ${isRu ? 'Всего записей' : 'Total'} | ${isRu ? 'Одобрено' : 'Approved'} | ${isRu ? 'Отклонено' : 'Rejected'} | ${isRu ? 'Ожидает' : 'Pending'} |`,
    `|---|---|---|---|`,
    `| ${entries.length} | ${entries.filter(e => e.supervisor_resolution === 'approved').length} | ${entries.filter(e => e.supervisor_resolution === 'rejected').length} | ${entries.filter(e => e.supervisor_resolution === 'pending').length} |`,
  ].join('\n');

  const entriesMD = entries.map(e => {
    const lines: string[] = [
      `---`, ``,
      `### [${e.entry_code}] ${e.title}`, ``,
      `| ${isRu ? 'Поле' : 'Field'} | ${isRu ? 'Значение' : 'Value'} |`,
      `|---|---|`,
      `| **${isRu ? 'Дата' : 'Date'}** | ${e.entry_date} |`,
      `| **${isRu ? 'Объект' : 'Target'}** | \`${e.role_object || '—'}\` |`,
      `| **${isRu ? 'Инициатор' : 'Initiator'}** | ${e.initiator} |`,
      `| **${isRu ? 'Статус' : 'Status'}** | ${statusLabel[e.status] ?? e.status} |`,
      `| **${isRu ? 'Резолюция' : 'Resolution'}** | ${resLabel[e.supervisor_resolution] ?? e.supervisor_resolution} |`,
    ];
    if (e.supervisor_comment) lines.push(`| **${isRu ? 'Комментарий' : 'Comment'}** | ${e.supervisor_comment} |`);
    lines.push('');
    if (e.hypothesis) { lines.push(`**${isRu ? 'Гипотеза' : 'Hypothesis'}:**`); lines.push(`> ${e.hypothesis.replace(/\n/g, '\n> ')}`); lines.push(''); }
    if (e.summary) { lines.push(`**${isRu ? 'Результат' : 'Summary'}:**`); lines.push(e.summary); lines.push(''); }
    const mb = e.metrics_before; const ma = e.metrics_after;
    if (mb && ma && Object.keys(mb).length > 0 && Object.keys(ma).length > 0) {
      lines.push(`**${isRu ? 'Метрики' : 'Metrics'}:**`); lines.push('');
      const metricKeys = Array.from(new Set([...Object.keys(mb), ...Object.keys(ma)]));
      lines.push(`| ${isRu ? 'Показатель' : 'Metric'} | ${isRu ? 'До' : 'Before'} | ${isRu ? 'После' : 'After'} |`);
      lines.push(`|---|---|---|`);
      metricKeys.forEach(k => {
        const label = getTermLabel(k, isRu);
        lines.push(`| ${label} | ${mb[k] !== undefined ? String(mb[k]) : '—'} | ${ma[k] !== undefined ? String(ma[k]) : '—'} |`);
      });
      lines.push('');
    }
    if (e.ai_revision) {
      lines.push(`<details>`); lines.push(`<summary>🔬 ${isRu ? 'ИИ-ревизия Эволюционера' : 'AI Evolutioner Revision'}</summary>`);
      lines.push(''); lines.push(e.ai_revision); lines.push(''); lines.push(`</details>`); lines.push('');
    }
    return lines.join('\n');
  }).join('\n');

  return `${header}## ${isRu ? 'Статистика' : 'Statistics'}\n\n${stats}\n\n## ${isRu ? 'Записи' : 'Entries'}\n\n${entriesMD}\n`;
}

// ─── Evolutioner Prompts Panel ───────────────────────────────────────────────

interface EvolutionerPrompt {
  id: string;
  name: string;
  description: string | null;
  content: string;
  tags: string[] | null;
  updated_at: string;
}

const PROMPT_LABELS: Record<string, { ru: string; en: string; color: string }> = {
  contest_discrepancy: { ru: 'Расхождение оценок (Конкурс)', en: 'Score Discrepancy (Contest)', color: 'text-hydra-info border-hydra-info/30 bg-hydra-info/10' },
  rejected_default: { ru: 'Отклонение (универсальный)', en: 'Rejected (default)', color: 'text-hydra-arbiter border-hydra-arbiter/30 bg-hydra-arbiter/10' },
  rejected_technoarbiter: { ru: 'Отклонение → ТехноАрбитр', en: 'Rejected → TechnoArbiter', color: 'text-hydra-expert border-hydra-expert/30 bg-hydra-expert/10' },
  rejected_technocritic: { ru: 'Отклонение → ТехноКритик', en: 'Rejected → TechnoCritic', color: 'text-hydra-critical border-hydra-critical/30 bg-hydra-critical/10' },
  rejected_guide: { ru: 'Отклонение → Гид', en: 'Rejected → Guide', color: 'text-hydra-success border-hydra-success/30 bg-hydra-success/10' },
};

function EvolutionerPromptsPanel({ isRu }: { isRu: boolean }) {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<EvolutionerPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('prompt_library')
      .select('id, name, description, content, tags, updated_at')
      .eq('role', 'evolutioner')
      .eq('is_default', true)
      .order('name');
    setPrompts((data || []) as EvolutionerPrompt[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (open) loadPrompts(); }, [open, loadPrompts]);

  const startEdit = (p: EvolutionerPrompt) => { setEditingId(p.id); setEditContent(p.content); };
  const cancelEdit = () => { setEditingId(null); setEditContent(''); };

  const savePrompt = async (id: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('prompt_library')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error(isRu ? 'Ошибка сохранения' : 'Save failed');
    else {
      toast.success(isRu ? 'Промпт обновлён' : 'Prompt updated');
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, content: editContent } : p));
      setEditingId(null);
    }
    setSaving(false);
  };

  return (
    <Card className="border-hydra-success/20 bg-hydra-success/5 mt-4">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-hydra-success" />
            <CardTitle className="text-sm font-semibold text-hydra-success">
              {isRu ? 'Промпты Эволюционера' : "Evolutioner's Prompts"}
            </CardTitle>
            <Badge variant="secondary" className="text-xs bg-hydra-success/15 text-hydra-success">
              {isRu ? 'только Супервизор' : 'Supervisor only'}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{open ? '▲' : '▼'}</span>
        </div>
        {!open && (
          <p className="text-xs text-muted-foreground mt-1">
            {isRu
              ? 'Роль-специфичные шаблоны для авторевизии. Нажмите, чтобы раскрыть и отредактировать.'
              : 'Role-specific templates for auto-revision. Click to expand and edit.'}
          </p>
        )}
      </CardHeader>
      {open && (
        <CardContent className="pt-0 space-y-3">
          <p className="text-xs text-muted-foreground">
            {isRu
              ? 'Шаблоны используют плейсхолдеры: {{entry_code}}, {{title}}, {{role_object}}, {{hypothesis}}, {{metrics_before}}, {{metrics_after}}, {{supervisor_comment}}, {{summary}} — для записей Хроник; и {{model_id}}, {{user_score}}, {{arbiter_score}}, {{delta}}, {{threshold}}, {{round_prompt}}, {{direction}} — для расхождений конкурса.'
              : 'Templates use placeholders: {{entry_code}}, {{title}}, {{role_object}}, {{hypothesis}}, etc. for chronicle entries; {{model_id}}, {{user_score}}, {{arbiter_score}}, {{delta}}, etc. for contest discrepancies.'}
          </p>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="space-y-3">
              {prompts.map(p => {
                const label = PROMPT_LABELS[p.name];
                const isEditing = editingId === p.id;
                return (
                  <div key={p.id} className="rounded-lg border border-border bg-background/50 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {label ? (
                          <Badge className={cn('text-xs border font-mono', label.color)}>
                            {isRu ? label.ru : label.en}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs font-mono">{p.name}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {isRu ? 'обн.' : 'upd.'} {format(new Date(p.updated_at), 'dd.MM.yy')}
                        </span>
                      </div>
                      {!isEditing ? (
                        <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => startEdit(p)}>
                          <Wrench className="h-3 w-3" />
                          {isRu ? 'Изменить' : 'Edit'}
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={cancelEdit} disabled={saving}>
                            {isRu ? 'Отмена' : 'Cancel'}
                          </Button>
                          <Button
                            size="sm"
                            className="h-6 text-xs bg-hydra-success/20 text-hydra-success border border-hydra-success/40 hover:bg-hydra-success/30"
                            onClick={() => savePrompt(p.id)} disabled={saving}
                          >
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            {isRu ? 'Сохранить' : 'Save'}
                          </Button>
                        </div>
                      )}
                    </div>
                    {p.description && !isEditing && (
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    )}
                    {isEditing ? (
                      <textarea
                        value={editContent} onChange={e => setEditContent(e.target.value)}
                        rows={12}
                        className="w-full rounded-md border border-input bg-background/80 px-3 py-2 text-xs font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                        {p.content.slice(0, 180)}…
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── ChroniclesTab ──────────────────────────────────────────────────────────

export function ChroniclesTab({ language, isSupervisor }: { language: string; isSupervisor: boolean }) {
  const isRu = language === 'ru';
  const { user } = useAuth();
  const [entries, setEntries] = useState<ChronicleDBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [autorunning, setAutorunning] = useState(false);
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterResolution, setFilterResolution] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const uniqueRoles = useMemo(() => {
    const roles = Array.from(new Set(entries.map(e => e.role_object).filter(Boolean)));
    return roles.sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterResolution !== 'all' && e.supervisor_resolution !== filterResolution) return false;
      if (filterRole !== 'all' && e.role_object !== filterRole) return false;
      if (filterDateFrom && e.entry_date < filterDateFrom) return false;
      if (filterDateTo && e.entry_date > filterDateTo) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const haystack = [e.title, e.entry_code, e.role_object, e.initiator, e.hypothesis, e.summary, e.ai_revision]
          .filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [entries, filterResolution, filterRole, filterDateFrom, filterDateTo, searchText]);

  const hasActiveFilters = filterResolution !== 'all' || filterRole !== 'all' || filterDateFrom || filterDateTo || searchText.trim();
  const clearFilters = () => { setSearchText(''); setFilterResolution('all'); setFilterRole('all'); setFilterDateFrom(''); setFilterDateTo(''); };

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chronicles')
        .select('*')
        .order('entry_code', { ascending: false });
      if (error) throw error;
      setEntries((data || []) as ChronicleDBEntry[]);
    } catch (err) {
      console.error('Failed to load chronicles:', err);
      toast.error(isRu ? 'Ошибка загрузки хроник' : 'Failed to load chronicles');
    } finally {
      setLoading(false);
    }
  }, [isRu]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const setResolution = async (entryId: string, resolution: string) => {
    setUpdatingId(entryId);
    try {
      const { error } = await supabase.from('chronicles').update({ supervisor_resolution: resolution }).eq('id', entryId);
      if (error) throw error;
      const entry = entries.find(e => e.id === entryId);
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, supervisor_resolution: resolution } : e));
      toast.success(isRu ? 'Резолюция сохранена' : 'Resolution saved');

      if (entry?.status === 'revised' && entry?.ai_revision && (resolution === 'approved' || resolution === 'rejected')) {
        try {
          let strategyTags: string[] = [];
          let confidence = 0.5;
          try {
            const parsed = JSON.parse(entry.ai_revision);
            strategyTags = parsed.strategy_tags || [];
            confidence = parsed.confidence || 0.5;
          } catch { /* plain text */ }
          await supabase.functions.invoke('evolution-trigger', {
            body: {
              mode: 'record_outcome', entry_code: entry.entry_code, title: entry.title,
              role_object: entry.role_object, strategy_tags: strategyTags, confidence,
              resolution: resolution === 'approved' ? 'accepted' : 'rejected',
              supervisor_comment: entry.supervisor_comment, user_id: user?.id,
            },
          });
        } catch (e) { console.warn('[Phase3] Outcome recording failed:', e); }
      }

      if (resolution === 'rejected') triggerEvolution(entryId, 'single');
    } catch {
      toast.error(isRu ? 'Ошибка сохранения' : 'Save failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const triggerEvolution = async (chronicleId: string | null, mode: 'single' | 'autorun') => {
    if (mode === 'autorun') setAutorunning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evolution-trigger`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ mode, chronicle_id: chronicleId }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Evolution trigger failed');
      if (mode === 'autorun') {
        const revised = result.revised ?? 0;
        const total = result.total ?? 0;
        const remaining = result.remaining ?? 0;
        if (total === 0) toast.info(isRu ? 'Нет записей для авторевизии — все уже пересмотрены' : 'No entries to revise — all already processed');
        else if (remaining > 0) toast.success(isRu ? `Батч завершён: ${revised}/${total} пересмотрено. Осталось ещё ${remaining} — запустите повторно.` : `Batch complete: ${revised}/${total} revised. ${remaining} remaining — run again.`);
        else toast.success(isRu ? `Автопробег завершён: ${revised}/${total} пересмотрено` : `Autorun complete: ${revised}/${total} revised`);
      } else {
        toast.success(isRu ? 'ИИ-ревизия запущена' : 'AI revision triggered');
      }
      await loadEntries();
    } catch (err) {
      console.error('Evolution trigger error:', err);
      toast.error(isRu ? 'Ошибка запуска Эволюционера' : 'Evolution trigger failed');
    } finally {
      if (mode === 'autorun') setAutorunning(false);
    }
  };

  const generateNextCode = useCallback((existing: ChronicleDBEntry[]) => {
    const nums = existing.map(e => parseInt(e.entry_code?.replace(/\D/g, '') || '0', 10)).filter(n => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `EVO-${String(next).padStart(3, '0')}`;
  }, []);

  const openForm = () => {
    setFormData({ ...EMPTY_FORM, entry_code: generateNextCode(entries) });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.entry_code.trim()) {
      toast.error(isRu ? 'Заполните код и заголовок' : 'Entry code and title are required');
      return;
    }
    setSaving(true);
    try {
      let metricsBefore: Record<string, unknown> | null = null;
      let metricsAfter: Record<string, unknown> | null = null;
      if (formData.metrics_before.trim()) {
        try { metricsBefore = JSON.parse(formData.metrics_before); } catch { toast.error(isRu ? 'Метрики "До" — невалидный JSON' : '"Before" metrics: invalid JSON'); setSaving(false); return; }
      }
      if (formData.metrics_after.trim()) {
        try { metricsAfter = JSON.parse(formData.metrics_after); } catch { toast.error(isRu ? 'Метрики "После" — невалидный JSON' : '"After" metrics: invalid JSON'); setSaving(false); return; }
      }
      const { error } = await supabase.from('chronicles').insert([{
        entry_code: formData.entry_code.trim(),
        title: formData.title.trim(),
        role_object: formData.role_object.trim(),
        initiator: formData.initiator.trim() || 'Evolutioner',
        status: formData.status,
        hypothesis: formData.hypothesis.trim() || null,
        summary: formData.summary.trim() || null,
        metrics_before: metricsBefore as import('@/integrations/supabase/types').Json,
        metrics_after: metricsAfter as import('@/integrations/supabase/types').Json,
        supervisor_resolution: 'pending',
        is_visible: true,
      }]);
      if (error) throw error;
      toast.success(isRu ? 'Запись создана' : 'Entry created');
      setShowForm(false);
      setFormData(EMPTY_FORM);
      await loadEntries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(isRu ? `Ошибка: ${msg}` : `Error: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const rejectedCount = entries.filter(e => e.supervisor_resolution === 'rejected' && e.status !== 'revised').length;
  const approvedCount = entries.filter(e => e.supervisor_resolution === 'approved').length;
  const pendingCount = entries.filter(e => e.supervisor_resolution === 'pending').length;

  const exportToMarkdown = useCallback(() => {
    const md = generateChroniclesMD(entries, isRu);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'CHRONICLES.md'; a.click();
    URL.revokeObjectURL(url);
    toast.success(isRu ? 'CHRONICLES.md скачан' : 'CHRONICLES.md downloaded');
  }, [entries, isRu]);

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <Card className="border-hydra-arbiter/30 bg-hydra-arbiter/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl p-3 bg-hydra-arbiter/15 border border-hydra-arbiter/30 shrink-0">
              <ScrollText className="h-6 w-6 text-hydra-arbiter" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-hydra-arbiter">
                {isRu ? 'Хроники Эволюции Hydra' : 'Chronicles of Hydra Evolution'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isRu
                  ? 'Публичный артефакт Отдела Эволюционирования. Каждая запись — доказательство того, что «живая архитектура» Hydra не метафора, а инженерный факт.'
                  : "A public artifact of the Evolution Department. Each entry proves that Hydra's \"living architecture\" is not a metaphor — it is an engineering fact."}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FlaskConical className="h-3.5 w-3.5 text-hydra-success" />
                  <span className="text-hydra-success font-medium">{isRu ? 'Эволюционер' : 'Evolutioner'}</span>
                  <span>{isRu ? '→ тестирует и измеряет' : '→ tests & measures'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ScrollText className="h-3.5 w-3.5 text-hydra-arbiter" />
                  <span className="text-hydra-arbiter font-medium">{isRu ? 'Летописец' : 'Chronicler'}</span>
                  <span>{isRu ? '→ фиксирует и архивирует' : '→ records & archives'}</span>
                </div>
                {isSupervisor && rejectedCount > 0 && (
                  <div className="ml-auto">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => triggerEvolution(null, 'autorun')}
                      disabled={autorunning}
                      className="gap-1.5 border-hydra-expert/30 text-hydra-expert hover:bg-hydra-expert/10"
                    >
                      {autorunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
                      {isRu ? `Автопробег (${rejectedCount} отклонённых)` : `Autorun (${rejectedCount} rejected)`}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isSupervisor && entries.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportToMarkdown} className="gap-1.5 border-amber-500/40 text-amber-300 hover:bg-amber-500/10">
                  <Download className="h-3.5 w-3.5" />
                  {isRu ? 'Экспорт в MD' : 'Export MD'}
                </Button>
              )}
              <a href="https://github.com/alexkuz60/ai-hydra/blob/main/CHRONICLES.md" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                  <ExternalLink className="h-3.5 w-3.5" />
                  GitHub
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-muted"><ScrollText className="h-4 w-4 text-amber-400" /></div>
          <div><p className="text-xs text-muted-foreground">{isRu ? 'Всего записей' : 'Total entries'}</p><p className="text-2xl font-bold">{entries.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-muted"><CheckCheck className="h-4 w-4 text-emerald-400" /></div>
          <div><p className="text-xs text-muted-foreground">{isRu ? 'Одобрено' : 'Approved'}</p><p className="text-2xl font-bold">{approvedCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-muted"><Timer className="h-4 w-4 text-amber-400" /></div>
          <div><p className="text-xs text-muted-foreground">{isRu ? 'Ожидает' : 'Pending'}</p><p className="text-2xl font-bold">{pendingCount}</p></div>
        </CardContent></Card>
      </div>

      {/* New Entry button & form */}
      {isSupervisor && (
        <div>
          {!showForm ? (
            <Button variant="outline" size="sm" onClick={openForm} className="gap-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
              <ScrollText className="h-4 w-4" />
              {isRu ? 'Добавить запись Летописца' : 'Add Chronicle Entry'}
            </Button>
          ) : (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                    <ScrollText className="h-4 w-4" />
                    {isRu ? 'Новая запись Летописца' : 'New Chronicle Entry'}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="h-7 w-7">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Код записи *' : 'Entry Code *'}</label>
                    <Input value={formData.entry_code} onChange={e => setFormData(p => ({ ...p, entry_code: e.target.value }))} placeholder="EVO-001" className="h-8 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Статус' : 'Status'}</label>
                    <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="pending">{isRu ? 'Ожидает тестирования' : 'Awaiting Testing'}</option>
                      <option value="completed">{isRu ? 'Выполнено' : 'Completed'}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Заголовок *' : 'Title *'}</label>
                  <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder={isRu ? 'Оптимизация промпта Критика...' : 'Critic prompt optimization...'} className="h-8 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Объект (роль)' : 'Target Role'}</label>
                    <Input value={formData.role_object} onChange={e => setFormData(p => ({ ...p, role_object: e.target.value }))} placeholder="Critic, Evolutioner..." className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Инициатор' : 'Initiator'}</label>
                    <Input value={formData.initiator} onChange={e => setFormData(p => ({ ...p, initiator: e.target.value }))} placeholder="Supervisor" className="h-8 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Гипотеза' : 'Hypothesis'}</label>
                  <textarea value={formData.hypothesis} onChange={e => setFormData(p => ({ ...p, hypothesis: e.target.value }))} placeholder={isRu ? 'Что предполагается улучшить...' : 'What is expected to improve...'} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Описание / Результат' : 'Summary / Result'}</label>
                  <textarea value={formData.summary} onChange={e => setFormData(p => ({ ...p, summary: e.target.value }))} placeholder={isRu ? 'Что было сделано и что получилось...' : 'What was done and the outcome...'} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Метрики "До" (JSON)' : '"Before" Metrics (JSON)'}</label>
                    <textarea value={formData.metrics_before} onChange={e => setFormData(p => ({ ...p, metrics_before: e.target.value }))} placeholder={'{"tokens": 450, "score": 6.2}'} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Метрики "После" (JSON)' : '"After" Metrics (JSON)'}</label>
                    <textarea value={formData.metrics_after} onChange={e => setFormData(p => ({ ...p, metrics_after: e.target.value }))} placeholder={'{"tokens": 310, "score": 7.8}'} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} disabled={saving}>{isRu ? 'Отмена' : 'Cancel'}</Button>
                  <Button size="sm" onClick={handleSave} disabled={saving} className="bg-hydra-arbiter/20 text-hydra-arbiter border border-hydra-arbiter/40 hover:bg-hydra-arbiter/30">
                    {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ScrollText className="h-3.5 w-3.5 mr-1.5" />}
                    {isRu ? 'Зафиксировать запись' : 'Save Entry'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Autorun banner */}
      {isSupervisor && !loading && rejectedCount > 0 && (
        <div className="sticky top-0 z-10 rounded-xl border border-hydra-critical/40 bg-hydra-critical/10 backdrop-blur-sm p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-hydra-critical shrink-0" />
            <span className="text-hydra-critical font-medium">
              {isRu
                ? `${rejectedCount} ${rejectedCount === 1 ? 'запись отклонена' : rejectedCount < 5 ? 'записи отклонены' : 'записей отклонено'} — требуют авторевизии Эволюционера`
                : `${rejectedCount} ${rejectedCount === 1 ? 'entry rejected' : 'entries rejected'} — awaiting Evolutioner auto-revision`}
            </span>
          </div>
          <Button size="sm" onClick={() => triggerEvolution(null, 'autorun')} disabled={autorunning} className="gap-1.5 shrink-0 bg-hydra-critical/80 hover:bg-hydra-critical text-white border-0">
            {autorunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
            {isRu ? 'Запустить авторевизию всех отклонённых' : 'Auto-revise all rejected'}
          </Button>
        </div>
      )}

      {/* Filter & Search */}
      {!loading && entries.length > 0 && (
        <Card className="border-border bg-card/60">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder={isRu ? 'Поиск по тексту (заголовок, гипотеза, резолюция...)' : 'Search text (title, hypothesis, revision...)'} className="pl-9 h-9 text-sm" />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1.5 text-muted-foreground hover:text-foreground shrink-0">
                  <X className="h-3.5 w-3.5" />
                  {isRu ? 'Сбросить' : 'Reset'}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <select value={filterResolution} onChange={e => setFilterResolution(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="all">{isRu ? 'Все резолюции' : 'All resolutions'}</option>
                <option value="pending">{isRu ? '⏳ Ожидает' : '⏳ Pending'}</option>
                <option value="approved">{isRu ? '✅ Согласовано' : '✅ Approved'}</option>
                <option value="rejected">{isRu ? '❌ Отклонено' : '❌ Rejected'}</option>
                <option value="wish">{isRu ? '💬 Пожелание' : '💬 Wish'}</option>
                <option value="revised">{isRu ? '🔄 Пересмотрено ИИ' : '🔄 AI Revised'}</option>
              </select>
              {uniqueRoles.length > 0 && (
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="all">{isRu ? 'Все роли' : 'All roles'}</option>
                  {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              )}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-muted-foreground shrink-0">{isRu ? 'С' : 'From'}</span>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                <span className="text-xs text-muted-foreground shrink-0">{isRu ? 'по' : 'to'}</span>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground">
                {isRu ? `Показано ${filteredEntries.length} из ${entries.length} записей` : `Showing ${filteredEntries.length} of ${entries.length} entries`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Entries */}
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : filteredEntries.length === 0 && entries.length > 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {isRu ? 'Нет записей по выбранным фильтрам' : 'No entries match the selected filters'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const statusCfg = STATUS_DISPLAY[entry.status] || STATUS_DISPLAY['pending'];
            const StatusIcon = statusCfg.Icon;
            const resolutionCfg = RESOLUTION_CONFIG[entry.supervisor_resolution] || RESOLUTION_CONFIG['pending'];
            const mb = entry.metrics_before;
            const mat = entry.metrics_after;
            const isUpdating = updatingId === entry.id;
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Card className={`border ${statusCfg.bg}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Badge variant="outline" className="font-mono text-xs shrink-0 border-muted-foreground/30">{entry.entry_code}</Badge>
                        <span className={`inline-flex items-center gap-1 text-xs ${statusCfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label[isRu ? 'ru' : 'en']}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{entry.entry_date}</span>
                    </div>
                    <CardTitle className="text-base mt-1">{entry.title}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="text-xs text-muted-foreground font-medium">{isRu ? 'Объект:' : 'Target:'}</span>
                      <RoleBadge value={entry.role_object} isRu={isRu} />
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground font-medium">{isRu ? 'Инициатор:' : 'Initiator:'}</span>
                      <RoleBadge value={entry.initiator} isRu={isRu} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Hypothesis — collapsible */}
                    {entry.hypothesis && (
                      <Collapsible
                        open={expandedCards.has(entry.id)}
                        onOpenChange={() => setExpandedCards(prev => {
                          const next = new Set(prev);
                          next.has(entry.id) ? next.delete(entry.id) : next.add(entry.id);
                          return next;
                        })}
                      >
                        <div className="rounded-lg border border-border bg-muted/20 p-3">
                          <CollapsibleTrigger className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Lightbulb className="h-3.5 w-3.5" />
                              {isRu ? 'Гипотеза' : 'Hypothesis'}
                            </div>
                            <span className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                              {expandedCards.has(entry.id) ? (isRu ? 'Свернуть детали' : 'Collapse details') : (isRu ? 'Показать детали' : 'Show details')}
                              {!expandedCards.has(entry.id) && entry.ai_revision && <FlaskConical className="h-3 w-3 text-hydra-expert ml-1" />}
                            </span>
                          </CollapsibleTrigger>
                          <p className="text-sm text-muted-foreground leading-relaxed mt-2">{entry.hypothesis}</p>
                        </div>

                        <CollapsibleContent className="space-y-4 mt-4">
                          {entry.summary && (
                            <div className="rounded-lg border border-border bg-muted/20 p-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">{isRu ? 'Результат' : 'Summary'}</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{entry.summary}</p>
                            </div>
                          )}

                          {((mb && Object.keys(mb).length > 0) || (mat && Object.keys(mat).length > 0)) && (
                            <div className="grid grid-cols-2 gap-3">
                              {mb && Object.keys(mb).length > 0 && (
                                <div className="rounded-lg border border-border p-3 space-y-1.5">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{isRu ? 'До' : 'Before'}</p>
                                  {Object.entries(mb).map(([k, v]) => (
                                    <div key={k} className="flex justify-between text-xs">
                                      <TermLabel term={k} className="text-muted-foreground">{getTermLabel(k, isRu)}</TermLabel>
                                      <span className="font-mono font-medium">{String(v)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {mat && Object.keys(mat).length > 0 && (
                                <div className="rounded-lg border border-hydra-success/30 bg-hydra-success/5 p-3 space-y-1.5">
                                  <p className="text-xs font-medium text-hydra-success uppercase tracking-wide">{isRu ? 'Цель →' : 'Target →'}</p>
                                  {Object.entries(mat).map(([k, v]) => (
                                    <div key={k} className="flex justify-between text-xs">
                                      <TermLabel term={k} className="text-muted-foreground">{getTermLabel(k, isRu)}</TermLabel>
                                      <span className="font-mono font-medium text-hydra-success">{String(v)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {entry.ai_revision && (
                            <Collapsible open={expandedRevision === entry.id} onOpenChange={() => setExpandedRevision(expandedRevision === entry.id ? null : entry.id)}>
                              <div className="rounded-lg border border-hydra-expert/30 bg-hydra-expert/5 p-3">
                                <CollapsibleTrigger className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-1.5 text-xs text-hydra-expert font-medium">
                                    <FlaskConical className="h-3.5 w-3.5" />
                                    {isRu ? 'ИИ-ревизия Эволюционера' : 'AI Evolutioner Revision'}
                                  </div>
                                  <span className="text-xs text-hydra-expert hover:text-hydra-expert/80">
                                    {expandedRevision === entry.id ? (isRu ? 'Свернуть' : 'Collapse') : (isRu ? 'Развернуть' : 'Expand')}
                                  </span>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="mt-2 prose prose-sm dark:prose-invert max-w-none">
                                    <MarkdownRenderer content={parseAiRevision(entry.ai_revision)} className="text-sm" />
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* No hypothesis but has other details */}
                    {!entry.hypothesis && (entry.summary || entry.ai_revision || (mb && Object.keys(mb).length > 0) || (mat && Object.keys(mat).length > 0)) && (
                      <>
                        {entry.summary && (
                          <div className="rounded-lg border border-border bg-muted/20 p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">{isRu ? 'Результат' : 'Summary'}</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{entry.summary}</p>
                          </div>
                        )}
                        {((mb && Object.keys(mb).length > 0) || (mat && Object.keys(mat).length > 0)) && (
                          <div className="grid grid-cols-2 gap-3">
                            {mb && Object.keys(mb).length > 0 && (
                              <div className="rounded-lg border border-border p-3 space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{isRu ? 'До' : 'Before'}</p>
                                {Object.entries(mb).map(([k, v]) => (
                                  <div key={k} className="flex justify-between text-xs">
                                    <TermLabel term={k} className="text-muted-foreground">{getTermLabel(k, isRu)}</TermLabel>
                                    <span className="font-mono font-medium">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {mat && Object.keys(mat).length > 0 && (
                              <div className="rounded-lg border border-hydra-success/30 bg-hydra-success/5 p-3 space-y-1.5">
                                <p className="text-xs font-medium text-hydra-success uppercase tracking-wide">{isRu ? 'Цель →' : 'Target →'}</p>
                                {Object.entries(mat).map(([k, v]) => (
                                  <div key={k} className="flex justify-between text-xs">
                                    <TermLabel term={k} className="text-muted-foreground">{getTermLabel(k, isRu)}</TermLabel>
                                    <span className="font-mono font-medium text-hydra-success">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {entry.ai_revision && (
                          <Collapsible open={expandedRevision === entry.id} onOpenChange={() => setExpandedRevision(expandedRevision === entry.id ? null : entry.id)}>
                            <div className="rounded-lg border border-hydra-expert/30 bg-hydra-expert/5 p-3">
                              <CollapsibleTrigger className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1.5 text-xs text-hydra-expert font-medium">
                                  <FlaskConical className="h-3.5 w-3.5" />
                                  {isRu ? 'ИИ-ревизия Эволюционера' : 'AI Evolutioner Revision'}
                                </div>
                                <span className="text-xs text-hydra-expert hover:text-hydra-expert/80">
                                  {expandedRevision === entry.id ? (isRu ? 'Свернуть' : 'Collapse') : (isRu ? 'Развернуть' : 'Expand')}
                                </span>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="mt-2 prose prose-sm dark:prose-invert max-w-none">
                                  <MarkdownRenderer content={parseAiRevision(entry.ai_revision)} className="text-sm" />
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        )}
                      </>
                    )}

                    {/* Resolution row */}
                    <div className="flex items-center gap-2 pt-1 border-t border-border flex-wrap">
                      <span className="text-xs text-muted-foreground">{isRu ? 'Резолюция супервизора:' : 'Supervisor resolution:'}</span>
                      <span className={`text-xs font-medium ${resolutionCfg.color}`}>{resolutionCfg.label[isRu ? 'ru' : 'en']}</span>
                      {entry.supervisor_comment && (
                        <span className="text-xs text-muted-foreground">— {entry.supervisor_comment}</span>
                      )}
                      {isSupervisor && (
                        <div className="flex items-center gap-1 ml-auto">
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setResolution(entry.id, 'approved')} disabled={entry.supervisor_resolution === 'approved'} className={cn('h-6 text-xs', entry.supervisor_resolution === 'approved' ? 'text-hydra-success bg-hydra-success/10' : 'text-muted-foreground hover:text-hydra-success')}>✅ {isRu ? 'Согласен' : 'Agree'}</Button>
                              <Button variant="ghost" size="sm" onClick={() => setResolution(entry.id, 'wish')} disabled={entry.supervisor_resolution === 'wish'} className={cn('h-6 text-xs', entry.supervisor_resolution === 'wish' ? 'text-hydra-info bg-hydra-info/10' : 'text-muted-foreground hover:text-hydra-info')}>💬 {isRu ? 'Пожелание' : 'Wish'}</Button>
                              <Button variant="ghost" size="sm" onClick={() => setResolution(entry.id, 'rejected')} disabled={entry.supervisor_resolution === 'rejected'} className={cn('h-6 text-xs', entry.supervisor_resolution === 'rejected' ? 'text-hydra-critical bg-hydra-critical/10' : 'text-muted-foreground hover:text-hydra-critical')}>❌ {isRu ? 'Не согласен' : 'Reject'}</Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Evolutioner Prompts Manager */}
      {isSupervisor && <EvolutionerPromptsPanel isRu={isRu} />}
    </div>
  );
}
