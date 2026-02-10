import React, { useState, useEffect, useCallback, useRef } from 'react';
import { icons } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Pencil,
  Trash2,
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Compass,
  Save,
  X,
  Eye,
  EyeOff,
  GripVertical,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import type { DbTour, DbStep, DbElement } from '@/pages/GuideToursEditor';

interface Props {
  tour: DbTour;
  steps: DbStep[];
  elements: DbElement[];
  lang: 'ru' | 'en';
  onDeleteTour: () => void;
  onRefresh: () => Promise<void>;
  onSelectTour: (id: string) => void;
}

const PLACEMENT_OPTIONS = ['top', 'bottom', 'left', 'right'];
const ICON_OPTIONS = ['Compass', 'Users', 'UserCog', 'BookOpen', 'Crown', 'GitBranch', 'Library', 'Wrench', 'Target', 'CheckSquare'];

export function GuideTourDetailPanel({ tour, steps, elements, lang, onDeleteTour, onRefresh, onSelectTour }: Props) {
  /* ─── Content language tab ─── */
  const [contentLang, setContentLang] = useState<'ru' | 'en'>('ru');

  /* ─── Inline tour editing ─── */
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<DbTour>({ ...tour });
  const [saving, setSaving] = useState(false);

  const unsaved = useUnsavedChanges();

  // Sync draft when tour changes externally
  useEffect(() => {
    if (!editMode) {
      setDraft({ ...tour });
    }
  }, [tour, editMode]);

  // Track changes
  useEffect(() => {
    if (!editMode) return;
    const changed = JSON.stringify(draft) !== JSON.stringify(tour);
    unsaved.setHasUnsavedChanges(changed);
  }, [draft, tour, editMode]);

  const enterEditMode = useCallback(() => {
    setDraft({ ...tour });
    setEditMode(true);
  }, [tour]);

  const cancelEdit = useCallback(() => {
    setDraft({ ...tour });
    setEditMode(false);
    unsaved.markSaved();
  }, [tour, unsaved]);

  const saveTour = async () => {
    if (!draft.title_ru || !draft.title_en) {
      toast.error(lang === 'ru' ? 'Заполните название RU и EN' : 'Fill title RU and EN');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('guide_tours').update({
        title_ru: draft.title_ru,
        title_en: draft.title_en,
        description_ru: draft.description_ru || '',
        description_en: draft.description_en || '',
        icon: draft.icon || 'Compass',
        sort_order: draft.sort_order ?? 0,
        is_active: draft.is_active ?? true,
      }).eq('id', tour.id);
      if (error) throw error;
      toast.success(lang === 'ru' ? 'Тур обновлён' : 'Tour updated');
      setEditMode(false);
      unsaved.markSaved();
      await onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTour = useCallback((id: string) => {
    unsaved.withConfirmation(() => onSelectTour(id));
  }, [unsaved, onSelectTour]);

  /* ─── Drag & Drop reorder ─── */
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const [optimisticSteps, setOptimisticSteps] = useState<typeof steps | null>(null);
  const dragIdxRef = useRef<number | null>(null);

  // Use optimistic steps when reordering, otherwise use real steps
  const displaySteps = optimisticSteps ?? steps;

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    if (reordering) return;
    dragIdxRef.current = idx;
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = async (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceIdx = dragIdxRef.current;
    
    setDragIdx(null);
    setDragOverIdx(null);
    dragIdxRef.current = null;

    if (sourceIdx === null || sourceIdx === targetIdx || reordering) return;

    // Optimistic reorder
    const ordered = [...steps];
    const [moved] = ordered.splice(sourceIdx, 1);
    ordered.splice(targetIdx, 0, moved);
    const reindexed = ordered.map((s, i) => ({ ...s, step_index: i }));

    setOptimisticSteps(reindexed);
    setReordering(true);

    try {
      // Pass 1: offset all indices to temporary values
      for (let i = 0; i < ordered.length; i++) {
        const { error } = await supabase
          .from('guide_tour_steps')
          .update({ step_index: 10000 + i })
          .eq('id', ordered[i].id);
        if (error) throw error;
      }
      // Pass 2: set final indices
      for (let i = 0; i < ordered.length; i++) {
        const { error } = await supabase
          .from('guide_tour_steps')
          .update({ step_index: i })
          .eq('id', ordered[i].id);
        if (error) throw error;
      }
      await onRefresh();
      toast.success(lang === 'ru' ? 'Порядок обновлён' : 'Order updated');
    } catch (err: any) {
      console.error('Reorder error:', err);
      toast.error(err.message || 'Reorder failed');
    } finally {
      setOptimisticSteps(null);
      setReordering(false);
    }
  };

  const handleDragEnd = () => {
    // Only reset visual state, don't clear ref (drop handler reads it first)
    setDragIdx(null);
    setDragOverIdx(null);
  };

  /* ─── Step CRUD ─── */
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [stepDialog, setStepDialog] = useState<{ open: boolean; step: Partial<DbStep> | null }>({ open: false, step: null });
  const [elementDialog, setElementDialog] = useState<{ open: boolean; element: Partial<DbElement> | null; stepIndex: number }>({ open: false, element: null, stepIndex: 0 });

  const stepElements = (stepIndex: number) =>
    elements.filter(e => e.step_index === stepIndex).sort((a, b) => a.sort_order - b.sort_order);

  /* ─── Step CRUD ─── */
  const openStepDialog = (step?: DbStep) => {
    setStepDialog({
      open: true,
      step: step ? { ...step } : {
        tour_id: tour.id, step_index: steps.length, selector: '',
        placement: 'bottom', title_ru: '', title_en: '', description_ru: '', description_en: '',
        route: null, delay_ms: null, action: null,
      },
    });
  };

  const saveStep = async () => {
    const s = stepDialog.step;
    if (!s || !s.selector || !s.title_ru || !s.title_en) {
      toast.error(lang === 'ru' ? 'Заполните selector, заголовок RU и EN' : 'Fill selector, title RU and EN');
      return;
    }
    setSaving(true);
    try {
      if (s.id) {
        const { error } = await supabase.from('guide_tour_steps').update({
          step_index: s.step_index!, selector: s.selector!,
          placement: s.placement || 'bottom',
          title_ru: s.title_ru!, title_en: s.title_en!,
          description_ru: s.description_ru || '', description_en: s.description_en || '',
          route: s.route || null, delay_ms: s.delay_ms || null, action: s.action || null,
        }).eq('id', s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('guide_tour_steps').insert({
          tour_id: tour.id, step_index: s.step_index!,
          selector: s.selector!, placement: s.placement || 'bottom',
          title_ru: s.title_ru!, title_en: s.title_en!,
          description_ru: s.description_ru || '', description_en: s.description_en || '',
          route: s.route || null, delay_ms: s.delay_ms || null, action: s.action || null,
        });
        if (error) throw error;
      }
      setStepDialog({ open: false, step: null });
      await onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteStep = async (step: DbStep) => {
    try {
      await supabase.from('guide_panel_elements').delete().eq('tour_id', tour.id).eq('step_index', step.step_index);
      const { error } = await supabase.from('guide_tour_steps').delete().eq('id', step.id);
      if (error) throw error;
      await onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  /* ─── Element CRUD ─── */
  const openElementDialog = (stepIndex: number, el?: DbElement) => {
    setElementDialog({
      open: true, stepIndex,
      element: el ? { ...el } : {
        tour_id: tour.id, step_index: stepIndex, element_id: '',
        label_ru: '', label_en: '', description_ru: '', description_en: '',
        selector: null, sort_order: stepElements(stepIndex).length,
      },
    });
  };

  const saveElement = async () => {
    const el = elementDialog.element;
    if (!el || !el.element_id || !el.label_ru || !el.label_en) {
      toast.error(lang === 'ru' ? 'Заполните ID, название RU и EN' : 'Fill ID, label RU and EN');
      return;
    }
    setSaving(true);
    try {
      if (el.id) {
        const { error } = await supabase.from('guide_panel_elements').update({
          element_id: el.element_id!, label_ru: el.label_ru!, label_en: el.label_en!,
          description_ru: el.description_ru || '', description_en: el.description_en || '',
          selector: el.selector || null, sort_order: el.sort_order ?? 0,
        }).eq('id', el.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('guide_panel_elements').insert({
          tour_id: tour.id, step_index: elementDialog.stepIndex,
          element_id: el.element_id!, label_ru: el.label_ru!, label_en: el.label_en!,
          description_ru: el.description_ru || '', description_en: el.description_en || '',
          selector: el.selector || null, sort_order: el.sort_order ?? 0,
        });
        if (error) throw error;
      }
      setElementDialog({ open: false, element: null, stepIndex: 0 });
      await onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteElement = async (id: string) => {
    try {
      const { error } = await supabase.from('guide_panel_elements').delete().eq('id', id);
      if (error) throw error;
      await onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const updateDraft = (patch: Partial<DbTour>) => setDraft(prev => ({ ...prev, ...patch }));

  /* ─── Bulk copy translations ─── */
  const [copying, setCopying] = useState(false);
  const copyTranslations = async (direction: 'ru-en' | 'en-ru') => {
    const fromRu = direction === 'ru-en';
    if (!confirm(fromRu
      ? (lang === 'ru' ? 'Скопировать все RU-тексты в EN? Существующие EN-тексты будут перезаписаны.' : 'Copy all RU texts to EN? Existing EN texts will be overwritten.')
      : (lang === 'ru' ? 'Скопировать все EN-тексты в RU? Существующие RU-тексты будут перезаписаны.' : 'Copy all EN texts to RU? Existing RU texts will be overwritten.')
    )) return;

    setCopying(true);
    try {
      const { error: tErr } = await supabase.from('guide_tours').update(fromRu
        ? { title_en: tour.title_ru, description_en: tour.description_ru }
        : { title_ru: tour.title_en, description_ru: tour.description_en }
      ).eq('id', tour.id);
      if (tErr) throw tErr;

      for (const s of steps) {
        const { error } = await supabase.from('guide_tour_steps').update(fromRu
          ? { title_en: s.title_ru, description_en: s.description_ru }
          : { title_ru: s.title_en, description_ru: s.description_en }
        ).eq('id', s.id);
        if (error) throw error;
      }

      for (const el of elements) {
        const { error } = await supabase.from('guide_panel_elements').update(fromRu
          ? { label_en: el.label_ru, description_en: el.description_ru }
          : { label_ru: el.label_en, description_ru: el.description_en }
        ).eq('id', el.id);
        if (error) throw error;
      }

      await onRefresh();
      toast.success(fromRu ? 'RU → EN' : 'EN → RU');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* ─── Language tabs in header ─── */}
      <div className="px-6 pt-3 pb-0 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5">
            <button
              onClick={() => setContentLang('ru')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                contentLang === 'ru'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              RU
            </button>
            <button
              onClick={() => setContentLang('en')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                contentLang === 'en'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              EN
            </button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => copyTranslations('ru-en')}
            disabled={copying}
          >
            {copying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
            RU → EN
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => copyTranslations('en-ru')}
            disabled={copying}
          >
            {copying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
            EN → RU
          </Button>
        </div>
      </div>

      {/* ─── Tour header / inline editor ─── */}
      <div className="px-6 py-4 border-b shrink-0">
        {editMode ? (
          <div className="space-y-3">
            {/* Title */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {contentLang === 'ru' ? 'Название (RU)' : 'Title (EN)'}
              </Label>
              <Input
                value={contentLang === 'ru' ? draft.title_ru : draft.title_en}
                onChange={e => updateDraft(contentLang === 'ru' ? { title_ru: e.target.value } : { title_en: e.target.value })}
              />
            </div>
            {/* Description */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {contentLang === 'ru' ? 'Описание (RU)' : 'Description (EN)'}
              </Label>
              <Textarea
                rows={2}
                value={contentLang === 'ru' ? draft.description_ru : draft.description_en}
                onChange={e => updateDraft(contentLang === 'ru' ? { description_ru: e.target.value } : { description_en: e.target.value })}
              />
            </div>
            {/* Row 3: icon, sort, active + actions */}
            <div className="flex items-end gap-3">
              <div className="space-y-1 w-32">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {lang === 'ru' ? 'Иконка' : 'Icon'}
                </Label>
                <Select value={draft.icon} onValueChange={v => updateDraft({ icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(i => {
                      const Ic = icons[i as keyof typeof icons];
                      return (
                        <SelectItem key={i} value={i}>
                          {Ic ? <Ic className="h-4 w-4" /> : i}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 w-20">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {lang === 'ru' ? 'Порядок' : 'Sort'}
                </Label>
                <Input type="number" value={draft.sort_order} onChange={e => updateDraft({ sort_order: Number(e.target.value) })} />
              </div>
              <label className="flex items-center gap-2 text-sm pb-2 cursor-pointer">
                <input type="checkbox" checked={draft.is_active} onChange={e => updateDraft({ is_active: e.target.checked })} />
                {lang === 'ru' ? 'Активен' : 'Active'}
              </label>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                <X className="h-3.5 w-3.5 mr-1.5" />
                {lang === 'ru' ? 'Отмена' : 'Cancel'}
              </Button>
              <Button size="sm" onClick={saveTour} disabled={saving || !unsaved.hasUnsavedChanges}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                {lang === 'ru' ? 'Сохранить' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {(() => {
                const TourIcon = icons[tour.icon as keyof typeof icons] || Compass;
                return <TourIcon className="h-5 w-5 text-hydra-guide shrink-0" />;
              })()}
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate">{tour[`title_${contentLang}`]}</h2>
                <p className="text-xs text-muted-foreground truncate">{tour[`description_${contentLang}`]}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant="outline" className="text-[10px]">#{tour.sort_order}</Badge>
                {!tour.is_active && <Badge variant="destructive" className="text-[10px]">{lang === 'ru' ? 'Выкл' : 'Off'}</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={enterEditMode}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                {lang === 'ru' ? 'Редактировать' : 'Edit'}
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDeleteTour}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                {lang === 'ru' ? 'Удалить' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Steps — Vertical Timeline with Drag & Drop */}
      <div className="flex-1 overflow-auto hydra-scrollbar">
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {lang === 'ru' ? 'Шаги' : 'Steps'} ({displaySteps.length})
              {reordering && <Loader2 className="inline h-3.5 w-3.5 ml-2 animate-spin text-hydra-guide" />}
            </span>
            <Button variant="outline" size="sm" onClick={() => openStepDialog()}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              {lang === 'ru' ? 'Добавить шаг' : 'Add Step'}
            </Button>
          </div>

          {displaySteps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{lang === 'ru' ? 'Нет шагов — добавьте первый' : 'No steps — add the first one'}</p>
            </div>
          ) : (
            <div className={cn("relative pl-6 transition-opacity duration-200", reordering && "opacity-70 pointer-events-none")}>
              {/* Timeline line */}
              <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

              {displaySteps.map((step, idx) => {
                const isExpanded = expandedStepId === step.id;
                const sElements = stepElements(step.step_index);
                const isDragging = dragIdx === idx;
                const isDragOver = dragOverIdx === idx && dragIdx !== idx;
                const isLast = idx === displaySteps.length - 1;

                return (
                  <div
                    key={step.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "relative mb-2 transition-all",
                      isDragging && "opacity-40",
                      isDragOver && "translate-y-1"
                    )}
                  >
                    {/* Drop indicator */}
                    {isDragOver && (
                      <div className="absolute -top-1.5 left-0 right-0 h-0.5 bg-hydra-guide rounded-full z-10" />
                    )}

                    {/* Timeline node */}
                    <div className={cn(
                      "absolute -left-6 top-3.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold z-[1]",
                      isExpanded
                        ? "bg-hydra-guide border-hydra-guide text-white"
                        : "bg-background border-border text-muted-foreground"
                    )}>
                      {idx + 1}
                    </div>

                    {/* Step card */}
                    <div className={cn(
                      "rounded-lg border bg-card ml-2 transition-colors",
                      isExpanded ? "border-hydra-guide/30" : "border-border",
                      isDragOver && "border-hydra-guide/50"
                    )}>
                      <div className="flex items-center justify-between p-3">
                        {/* Drag handle */}
                        <div className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0 mr-1">
                          <GripVertical className="h-4 w-4" />
                        </div>

                        <button
                          onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                          className="flex items-center gap-3 flex-1 text-left min-w-0"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium">{step[`title_${contentLang}`]}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <code className="text-[10px] text-muted-foreground bg-muted px-1 rounded max-w-[300px] truncate">
                                {step.selector}
                              </code>
                              {step.route && (
                                <code className="text-[10px] text-hydra-guide bg-hydra-guide/10 px-1 rounded">{step.route}</code>
                              )}
                              {step.action && (
                                <Badge variant="outline" className="text-[10px] h-4">{step.action}</Badge>
                              )}
                              {sElements.length > 0 && (
                                <Badge variant="secondary" className="text-[10px] h-4">{sElements.length} el</Badge>
                              )}
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openStepDialog(step)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteStep(step)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                              {contentLang === 'ru' ? 'Описание (RU)' : 'Description (EN)'}
                            </span>
                            <p className="text-sm text-muted-foreground mt-1">{step[`description_${contentLang}`] || '—'}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Placement: <code className="bg-muted px-1 rounded">{step.placement}</code></span>
                            {step.delay_ms && <span>Delay: <code className="bg-muted px-1 rounded">{step.delay_ms}ms</code></span>}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                {lang === 'ru' ? 'Элементы панели' : 'Panel Elements'}
                              </span>
                              <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => openElementDialog(step.step_index)}>
                                <Plus className="h-2.5 w-2.5 mr-1" />
                                {lang === 'ru' ? 'Элемент' : 'Element'}
                              </Button>
                            </div>
                            {sElements.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">{lang === 'ru' ? 'Нет элементов' : 'No elements'}</p>
                            ) : (
                              <div className="space-y-1">
                                {sElements.map((el) => (
                                  <div key={el.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/30 border border-border/50">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium">{el[`label_${contentLang}`]}</span>
                                        <code className="text-[10px] text-muted-foreground">{el.element_id}</code>
                                      </div>
                                      {el.selector && <code className="text-[10px] text-muted-foreground">{el.selector}</code>}
                                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{el[`description_${contentLang}`]}</p>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0 ml-2">
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openElementDialog(el.step_index, el)}>
                                        <Pencil className="h-2.5 w-2.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteElement(el.id)}>
                                        <Trash2 className="h-2.5 w-2.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Step Dialog ─── */}
      <Dialog open={stepDialog.open} onOpenChange={(o) => !o && setStepDialog({ open: false, step: null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{stepDialog.step?.id ? (lang === 'ru' ? 'Редактировать шаг' : 'Edit Step') : (lang === 'ru' ? 'Новый шаг' : 'New Step')}</DialogTitle>
          </DialogHeader>
          {stepDialog.step && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>CSS Selector *</Label><Input value={stepDialog.step.selector || ''} onChange={e => setStepDialog(p => ({ ...p, step: { ...p.step!, selector: e.target.value } }))} placeholder="[data-guide='sidebar']" /></div>
                <div className="space-y-1"><Label>{lang === 'ru' ? 'Индекс' : 'Index'}</Label><Input type="number" value={stepDialog.step.step_index ?? 0} onChange={e => setStepDialog(p => ({ ...p, step: { ...p.step!, step_index: Number(e.target.value) } }))} /></div>
              </div>
              <div className="space-y-1">
                <Label>{contentLang === 'ru' ? 'Заголовок (RU) *' : 'Title (EN) *'}</Label>
                <Input
                  value={contentLang === 'ru' ? stepDialog.step.title_ru || '' : stepDialog.step.title_en || ''}
                  onChange={e => setStepDialog(p => ({ ...p, step: { ...p.step!, [contentLang === 'ru' ? 'title_ru' : 'title_en']: e.target.value } }))}
                />
              </div>
              <div className="space-y-1">
                <Label>{contentLang === 'ru' ? 'Описание (RU)' : 'Description (EN)'}</Label>
                <Textarea
                  rows={2}
                  value={contentLang === 'ru' ? stepDialog.step.description_ru || '' : stepDialog.step.description_en || ''}
                  onChange={e => setStepDialog(p => ({ ...p, step: { ...p.step!, [contentLang === 'ru' ? 'description_ru' : 'description_en']: e.target.value } }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Route</Label>
                  <Input value={stepDialog.step.route || ''} onChange={e => setStepDialog(p => ({ ...p, step: { ...p.step!, route: e.target.value || null } }))} placeholder="/tasks" />
                </div>
                <div className="space-y-1">
                  <Label>Placement</Label>
                  <Select value={stepDialog.step.placement || 'bottom'} onValueChange={v => setStepDialog(p => ({ ...p, step: { ...p.step!, placement: v } }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PLACEMENT_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Action</Label>
                  <Select value={stepDialog.step.action || 'none'} onValueChange={v => setStepDialog(p => ({ ...p, step: { ...p.step!, action: v === 'none' ? null : v } }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      <SelectItem value="click">click</SelectItem>
                      <SelectItem value="hover">hover</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Delay (ms)</Label>
                <Input type="number" value={stepDialog.step.delay_ms ?? ''} onChange={e => setStepDialog(p => ({ ...p, step: { ...p.step!, delay_ms: e.target.value ? Number(e.target.value) : null } }))} placeholder="300" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStepDialog({ open: false, step: null })}>{lang === 'ru' ? 'Отмена' : 'Cancel'}</Button>
            <Button onClick={saveStep} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{lang === 'ru' ? 'Сохранить' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Element Dialog ─── */}
      <Dialog open={elementDialog.open} onOpenChange={(o) => !o && setElementDialog({ open: false, element: null, stepIndex: 0 })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{elementDialog.element?.id ? (lang === 'ru' ? 'Редактировать элемент' : 'Edit Element') : (lang === 'ru' ? 'Новый элемент' : 'New Element')}</DialogTitle>
          </DialogHeader>
          {elementDialog.element && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Element ID *</Label><Input value={elementDialog.element.element_id || ''} onChange={e => setElementDialog(p => ({ ...p, element: { ...p.element!, element_id: e.target.value } }))} placeholder="sidebar-tasks" /></div>
                <div className="space-y-1"><Label>CSS Selector</Label><Input value={elementDialog.element.selector || ''} onChange={e => setElementDialog(p => ({ ...p, element: { ...p.element!, selector: e.target.value || null } }))} placeholder="[data-guide='tasks']" /></div>
              </div>
              <div className="space-y-1">
                <Label>{contentLang === 'ru' ? 'Название (RU) *' : 'Label (EN) *'}</Label>
                <Input
                  value={contentLang === 'ru' ? elementDialog.element.label_ru || '' : elementDialog.element.label_en || ''}
                  onChange={e => setElementDialog(p => ({ ...p, element: { ...p.element!, [contentLang === 'ru' ? 'label_ru' : 'label_en']: e.target.value } }))}
                />
              </div>
              <div className="space-y-1">
                <Label>{contentLang === 'ru' ? 'Описание (RU)' : 'Description (EN)'}</Label>
                <Textarea
                  rows={2}
                  value={contentLang === 'ru' ? elementDialog.element.description_ru || '' : elementDialog.element.description_en || ''}
                  onChange={e => setElementDialog(p => ({ ...p, element: { ...p.element!, [contentLang === 'ru' ? 'description_ru' : 'description_en']: e.target.value } }))}
                />
              </div>
              <div className="space-y-1"><Label>{lang === 'ru' ? 'Порядок' : 'Sort'}</Label><Input type="number" value={elementDialog.element.sort_order ?? 0} onChange={e => setElementDialog(p => ({ ...p, element: { ...p.element!, sort_order: Number(e.target.value) } }))} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setElementDialog({ open: false, element: null, stepIndex: 0 })}>{lang === 'ru' ? 'Отмена' : 'Cancel'}</Button>
            <Button onClick={saveElement} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{lang === 'ru' ? 'Сохранить' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved changes dialog */}
      <UnsavedChangesDialog
        open={unsaved.showConfirmDialog}
        onConfirm={unsaved.confirmAndProceed}
        onCancel={unsaved.cancelNavigation}
      />
    </div>
  );
}
