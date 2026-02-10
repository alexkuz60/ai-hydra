import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Badge } from '@/components/ui/badge';
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
  Compass,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Eye,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

/* ─── Types ─── */
interface DbTour {
  id: string;
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

interface DbStep {
  id: string;
  tour_id: string;
  step_index: number;
  selector: string;
  route: string | null;
  placement: string;
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
  delay_ms: number | null;
  action: string | null;
}

interface DbElement {
  id: string;
  tour_id: string;
  step_index: number;
  element_id: string;
  label_ru: string;
  label_en: string;
  description_ru: string;
  description_en: string;
  selector: string | null;
  sort_order: number;
}

/* ─── Constants ─── */
const ICON_OPTIONS = ['Compass', 'Users', 'UserCog', 'BookOpen', 'Crown', 'GitBranch', 'Library', 'Wrench', 'Target', 'CheckSquare'];
const PLACEMENT_OPTIONS = ['top', 'bottom', 'left', 'right'];

export default function GuideToursEditor() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lang = language as 'ru' | 'en';

  const [tours, setTours] = useState<DbTour[]>([]);
  const [steps, setSteps] = useState<DbStep[]>([]);
  const [elements, setElements] = useState<DbElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTourId, setExpandedTourId] = useState<string | null>(null);
  const [expandedStepKey, setExpandedStepKey] = useState<string | null>(null);

  // Dialog state
  const [tourDialog, setTourDialog] = useState<{ open: boolean; tour: Partial<DbTour> | null }>({ open: false, tour: null });
  const [stepDialog, setStepDialog] = useState<{ open: boolean; step: Partial<DbStep> | null; tourId: string }>({ open: false, step: null, tourId: '' });
  const [elementDialog, setElementDialog] = useState<{ open: boolean; element: Partial<DbElement> | null; tourId: string; stepIndex: number }>({ open: false, element: null, tourId: '', stepIndex: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user) { navigate('/login'); return; }
      if (!isAdmin) { toast.error(lang === 'ru' ? 'Доступ запрещён' : 'Access denied'); navigate('/'); return; }
      fetchAll();
    }
  }, [user, authLoading, isAdmin, rolesLoading, navigate]);

  const fetchAll = async () => {
    try {
      const [toursRes, stepsRes, elementsRes] = await Promise.all([
        supabase.from('guide_tours').select('*').order('sort_order'),
        supabase.from('guide_tour_steps').select('*').order('step_index'),
        supabase.from('guide_panel_elements').select('*').order('sort_order'),
      ]);
      if (toursRes.error) throw toursRes.error;
      if (stepsRes.error) throw stepsRes.error;
      if (elementsRes.error) throw elementsRes.error;
      setTours(toursRes.data as DbTour[]);
      setSteps(stepsRes.data as DbStep[]);
      setElements(elementsRes.data as DbElement[]);
    } catch (e: any) {
      toast.error(e.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: ['guide-tours-data'] });
  };

  /* ─── Tour CRUD ─── */
  const openTourDialog = (tour?: DbTour) => {
    setTourDialog({
      open: true,
      tour: tour ? { ...tour } : { id: '', title_ru: '', title_en: '', description_ru: '', description_en: '', icon: 'Compass', sort_order: tours.length, is_active: true },
    });
  };

  const saveTour = async () => {
    const t = tourDialog.tour;
    if (!t || !t.id || !t.title_ru || !t.title_en) {
      toast.error(lang === 'ru' ? 'Заполните все обязательные поля' : 'Fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const existing = tours.find(x => x.id === t.id);
      if (existing) {
        const { error } = await supabase.from('guide_tours').update({
          title_ru: t.title_ru!, title_en: t.title_en!,
          description_ru: t.description_ru || '', description_en: t.description_en || '',
          icon: t.icon || 'Compass', sort_order: t.sort_order ?? 0, is_active: t.is_active ?? true,
        }).eq('id', t.id);
        if (error) throw error;
        toast.success(lang === 'ru' ? 'Тур обновлён' : 'Tour updated');
      } else {
        const { error } = await supabase.from('guide_tours').insert({
          id: t.id!, title_ru: t.title_ru!, title_en: t.title_en!,
          description_ru: t.description_ru || '', description_en: t.description_en || '',
          icon: t.icon || 'Compass', sort_order: t.sort_order ?? 0, is_active: t.is_active ?? true,
        });
        if (error) throw error;
        toast.success(lang === 'ru' ? 'Тур создан' : 'Tour created');
      }
      setTourDialog({ open: false, tour: null });
      await fetchAll();
      invalidateCache();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteTour = async (id: string) => {
    if (!confirm(lang === 'ru' ? `Удалить тур "${id}" и все его шаги?` : `Delete tour "${id}" and all steps?`)) return;
    try {
      // Delete elements, steps, then tour
      await supabase.from('guide_panel_elements').delete().eq('tour_id', id);
      await supabase.from('guide_tour_steps').delete().eq('tour_id', id);
      const { error } = await supabase.from('guide_tours').delete().eq('id', id);
      if (error) throw error;
      toast.success(lang === 'ru' ? 'Тур удалён' : 'Tour deleted');
      await fetchAll();
      invalidateCache();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  /* ─── Step CRUD ─── */
  const tourSteps = (tourId: string) => steps.filter(s => s.tour_id === tourId).sort((a, b) => a.step_index - b.step_index);

  const openStepDialog = (tourId: string, step?: DbStep) => {
    const existing = tourSteps(tourId);
    setStepDialog({
      open: true,
      tourId,
      step: step ? { ...step } : {
        tour_id: tourId, step_index: existing.length, selector: '',
        placement: 'bottom', title_ru: '', title_en: '', description_ru: '', description_en: '',
        route: null, delay_ms: null, action: null,
      },
    });
  };

  const saveStep = async () => {
    const s = stepDialog.step;
    if (!s || !s.selector || !s.title_ru || !s.title_en) {
      toast.error(lang === 'ru' ? 'Заполните все обязательные поля' : 'Fill all required fields');
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
          tour_id: stepDialog.tourId, step_index: s.step_index!,
          selector: s.selector!, placement: s.placement || 'bottom',
          title_ru: s.title_ru!, title_en: s.title_en!,
          description_ru: s.description_ru || '', description_en: s.description_en || '',
          route: s.route || null, delay_ms: s.delay_ms || null, action: s.action || null,
        });
        if (error) throw error;
      }
      setStepDialog({ open: false, step: null, tourId: '' });
      await fetchAll();
      invalidateCache();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteStep = async (stepId: string, tourId: string, stepIndex: number) => {
    try {
      await supabase.from('guide_panel_elements').delete().eq('tour_id', tourId).eq('step_index', stepIndex);
      const { error } = await supabase.from('guide_tour_steps').delete().eq('id', stepId);
      if (error) throw error;
      await fetchAll();
      invalidateCache();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  /* ─── Element CRUD ─── */
  const stepElements = (tourId: string, stepIndex: number) =>
    elements.filter(e => e.tour_id === tourId && e.step_index === stepIndex).sort((a, b) => a.sort_order - b.sort_order);

  const openElementDialog = (tourId: string, stepIndex: number, el?: DbElement) => {
    setElementDialog({
      open: true, tourId, stepIndex,
      element: el ? { ...el } : {
        tour_id: tourId, step_index: stepIndex, element_id: '',
        label_ru: '', label_en: '', description_ru: '', description_en: '',
        selector: null, sort_order: stepElements(tourId, stepIndex).length,
      },
    });
  };

  const saveElement = async () => {
    const el = elementDialog.element;
    if (!el || !el.element_id || !el.label_ru || !el.label_en) {
      toast.error(lang === 'ru' ? 'Заполните все обязательные поля' : 'Fill all required fields');
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
          tour_id: elementDialog.tourId, step_index: elementDialog.stepIndex,
          element_id: el.element_id!, label_ru: el.label_ru!, label_en: el.label_en!,
          description_ru: el.description_ru || '', description_en: el.description_en || '',
          selector: el.selector || null, sort_order: el.sort_order ?? 0,
        });
        if (error) throw error;
      }
      setElementDialog({ open: false, element: null, tourId: '', stepIndex: 0 });
      await fetchAll();
      invalidateCache();
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
      await fetchAll();
      invalidateCache();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  /* ─── Render ─── */
  if (authLoading || rolesLoading || loading) {
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
      <div className="container py-8 px-4 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="h-8 w-8 text-hydra-guide" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-hydra-guide to-primary bg-clip-text text-transparent">
              {lang === 'ru' ? 'Редактор экскурсий' : 'Tour Editor'}
            </h1>
          </div>
          <Button onClick={() => openTourDialog()} className="hydra-glow-sm">
            <Plus className="h-4 w-4 mr-2" />
            {lang === 'ru' ? 'Новый тур' : 'New Tour'}
          </Button>
        </div>

        {/* Tour list */}
        <div className="space-y-3">
          {tours.map((tour) => {
            const isExpanded = expandedTourId === tour.id;
            const tSteps = tourSteps(tour.id);
            return (
              <HydraCard key={tour.id} variant="glass">
                <div className="flex items-center justify-between p-4">
                  <button
                    onClick={() => setExpandedTourId(isExpanded ? null : tour.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{tour.title_ru}</span>
                        <Badge variant="outline" className="text-[10px]">{tour.icon}</Badge>
                        <Badge variant="outline" className="text-[10px]">{tSteps.length} {lang === 'ru' ? 'шагов' : 'steps'}</Badge>
                        {!tour.is_active && <Badge variant="destructive" className="text-[10px]">{lang === 'ru' ? 'Выкл' : 'Off'}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{tour.description_ru}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openTourDialog(tour)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteTour(tour.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {lang === 'ru' ? 'Шаги' : 'Steps'}
                      </span>
                      <Button variant="outline" size="sm" className="h-7" onClick={() => openStepDialog(tour.id)}>
                        <Plus className="h-3 w-3 mr-1" />
                        {lang === 'ru' ? 'Шаг' : 'Step'}
                      </Button>
                    </div>

                    {tSteps.map((step) => {
                      const stepKey = `${step.tour_id}-${step.step_index}`;
                      const isStepExpanded = expandedStepKey === stepKey;
                      const sElements = stepElements(step.tour_id, step.step_index);
                      return (
                        <div key={step.id} className="rounded-lg border border-border/50 bg-muted/20">
                          <div className="flex items-center justify-between p-3">
                            <button
                              onClick={() => setExpandedStepKey(isStepExpanded ? null : stepKey)}
                              className="flex items-center gap-2 flex-1 text-left"
                            >
                              <span className="font-mono text-xs w-6 text-center text-muted-foreground">{step.step_index + 1}</span>
                              <div>
                                <span className="text-sm font-medium">{step.title_ru}</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <code className="text-[10px] text-muted-foreground bg-muted px-1 rounded">{step.selector}</code>
                                  {step.route && <code className="text-[10px] text-hydra-guide bg-hydra-guide/10 px-1 rounded">{step.route}</code>}
                                  {sElements.length > 0 && (
                                    <Badge variant="outline" className="text-[10px] h-4">{sElements.length} el</Badge>
                                  )}
                                </div>
                              </div>
                            </button>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openStepDialog(tour.id, step)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteStep(step.id, step.tour_id, step.step_index)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {isStepExpanded && (
                            <div className="border-t border-border/30 px-3 pb-3 pt-2 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                  {lang === 'ru' ? 'Элементы панели' : 'Panel Elements'}
                                </span>
                                <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => openElementDialog(step.tour_id, step.step_index)}>
                                  <Plus className="h-2.5 w-2.5 mr-1" />
                                  {lang === 'ru' ? 'Элемент' : 'Element'}
                                </Button>
                              </div>
                              {sElements.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">{lang === 'ru' ? 'Нет элементов' : 'No elements'}</p>
                              ) : (
                                <div className="space-y-1">
                                  {sElements.map((el) => (
                                    <div key={el.id} className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/30 border border-border/30">
                                      <div>
                                        <span className="text-xs font-medium">{el.label_ru}</span>
                                        {el.selector && <code className="text-[10px] text-muted-foreground ml-2">{el.selector}</code>}
                                      </div>
                                      <div className="flex items-center gap-0.5">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openElementDialog(el.tour_id, el.step_index, el)}>
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
                          )}
                        </div>
                      );
                    })}

                    {tSteps.length === 0 && (
                      <p className="text-sm text-muted-foreground italic text-center py-4">
                        {lang === 'ru' ? 'Нет шагов — добавьте первый' : 'No steps — add the first one'}
                      </p>
                    )}
                  </div>
                )}
              </HydraCard>
            );
          })}

          {tours.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {lang === 'ru' ? 'Нет экскурсий' : 'No tours'}
            </p>
          )}
        </div>
      </div>

      {/* ─── Tour Dialog ─── */}
      <Dialog open={tourDialog.open} onOpenChange={(o) => !o && setTourDialog({ open: false, tour: null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{tourDialog.tour?.id && tours.find(t => t.id === tourDialog.tour?.id) ? (lang === 'ru' ? 'Редактировать тур' : 'Edit Tour') : (lang === 'ru' ? 'Новый тур' : 'New Tour')}</DialogTitle>
          </DialogHeader>
          {tourDialog.tour && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>ID</Label>
                <Input value={tourDialog.tour.id || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, id: e.target.value } }))} placeholder="my-tour-id" disabled={!!tours.find(t => t.id === tourDialog.tour?.id)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Название (RU)</Label><Input value={tourDialog.tour.title_ru || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, title_ru: e.target.value } }))} /></div>
                <div className="space-y-1"><Label>Title (EN)</Label><Input value={tourDialog.tour.title_en || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, title_en: e.target.value } }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Описание (RU)</Label><Textarea rows={2} value={tourDialog.tour.description_ru || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, description_ru: e.target.value } }))} /></div>
                <div className="space-y-1"><Label>Description (EN)</Label><Textarea rows={2} value={tourDialog.tour.description_en || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, description_en: e.target.value } }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>{lang === 'ru' ? 'Иконка' : 'Icon'}</Label>
                  <Select value={tourDialog.tour.icon || 'Compass'} onValueChange={v => setTourDialog(p => ({ ...p, tour: { ...p.tour!, icon: v } }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ICON_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>{lang === 'ru' ? 'Порядок' : 'Sort'}</Label><Input type="number" value={tourDialog.tour.sort_order ?? 0} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, sort_order: Number(e.target.value) } }))} /></div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={tourDialog.tour.is_active ?? true} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, is_active: e.target.checked } }))} />
                    {lang === 'ru' ? 'Активен' : 'Active'}
                  </label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTourDialog({ open: false, tour: null })}>{lang === 'ru' ? 'Отмена' : 'Cancel'}</Button>
            <Button onClick={saveTour} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{lang === 'ru' ? 'Сохранить' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Step Dialog ─── */}
      <Dialog open={stepDialog.open} onOpenChange={(o) => !o && setStepDialog({ open: false, step: null, tourId: '' })}>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Заголовок (RU) *</Label><Input value={stepDialog.step.title_ru || ''} onChange={e => setStepDialog(p => ({ ...p, step: { ...p.step!, title_ru: e.target.value } }))} /></div>
                <div className="space-y-1"><Label>Title (EN) *</Label><Input value={stepDialog.step.title_en || ''} onChange={e => setStepDialog(p => ({ ...p, step: { ...p.step!, title_en: e.target.value } }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Описание (RU)</Label><Textarea rows={2} value={stepDialog.step.description_ru || ''} onChange={e => setStepDialog(p => ({ ...p, step: { ...p.step!, description_ru: e.target.value } }))} /></div>
                <div className="space-y-1"><Label>Description (EN)</Label><Textarea rows={2} value={stepDialog.step.description_en || ''} onChange={e => setStepDialog(p => ({ ...p, step: { ...p.step!, description_en: e.target.value } }))} /></div>
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
            <Button variant="outline" onClick={() => setStepDialog({ open: false, step: null, tourId: '' })}>{lang === 'ru' ? 'Отмена' : 'Cancel'}</Button>
            <Button onClick={saveStep} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{lang === 'ru' ? 'Сохранить' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Element Dialog ─── */}
      <Dialog open={elementDialog.open} onOpenChange={(o) => !o && setElementDialog({ open: false, element: null, tourId: '', stepIndex: 0 })}>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Название (RU) *</Label><Input value={elementDialog.element.label_ru || ''} onChange={e => setElementDialog(p => ({ ...p, element: { ...p.element!, label_ru: e.target.value } }))} /></div>
                <div className="space-y-1"><Label>Label (EN) *</Label><Input value={elementDialog.element.label_en || ''} onChange={e => setElementDialog(p => ({ ...p, element: { ...p.element!, label_en: e.target.value } }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Описание (RU)</Label><Textarea rows={2} value={elementDialog.element.description_ru || ''} onChange={e => setElementDialog(p => ({ ...p, element: { ...p.element!, description_ru: e.target.value } }))} /></div>
                <div className="space-y-1"><Label>Description (EN)</Label><Textarea rows={2} value={elementDialog.element.description_en || ''} onChange={e => setElementDialog(p => ({ ...p, element: { ...p.element!, description_en: e.target.value } }))} /></div>
              </div>
              <div className="space-y-1"><Label>{lang === 'ru' ? 'Порядок' : 'Sort'}</Label><Input type="number" value={elementDialog.element.sort_order ?? 0} onChange={e => setElementDialog(p => ({ ...p, element: { ...p.element!, sort_order: Number(e.target.value) } }))} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setElementDialog({ open: false, element: null, tourId: '', stepIndex: 0 })}>{lang === 'ru' ? 'Отмена' : 'Cancel'}</Button>
            <Button onClick={saveElement} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{lang === 'ru' ? 'Сохранить' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
