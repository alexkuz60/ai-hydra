import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Layout } from '@/components/layout/Layout';
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
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Compass,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  Search,
  Map,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigatorResize } from '@/hooks/useNavigatorResize';
import { NavigatorHeader } from '@/components/layout/NavigatorHeader';
import { GuideTourDetailPanel } from '@/components/guide/GuideTourDetailPanel';

/* ─── Types ─── */
export interface DbTour {
  id: string;
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface DbStep {
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

export interface DbElement {
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

/* ─── Icon map for tour list ─── */
const ICON_OPTIONS = ['Compass', 'Users', 'UserCog', 'BookOpen', 'Crown', 'GitBranch', 'Library', 'Wrench', 'Target', 'CheckSquare'];

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

  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Tour create/edit dialog
  const [tourDialog, setTourDialog] = useState<{ open: boolean; tour: Partial<DbTour> | null }>({ open: false, tour: null });
  const [saving, setSaving] = useState(false);

  // Navigator resize
  const nav = useNavigatorResize({ storageKey: 'guide-editor', defaultMaxSize: 30 });

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

  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['guide-tours-data'] });
  }, [queryClient]);

  const selectedTour = useMemo(() => tours.find(t => t.id === selectedTourId) ?? null, [tours, selectedTourId]);
  const tourSteps = useMemo(() => steps.filter(s => s.tour_id === selectedTourId).sort((a, b) => a.step_index - b.step_index), [steps, selectedTourId]);
  const tourElements = useMemo(() => elements.filter(e => e.tour_id === selectedTourId), [elements, selectedTourId]);

  const filteredTours = useMemo(() => {
    if (!searchQuery) return tours;
    const q = searchQuery.toLowerCase();
    return tours.filter(t =>
      t.title_ru.toLowerCase().includes(q) ||
      t.title_en.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    );
  }, [tours, searchQuery]);

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
      toast.error(lang === 'ru' ? 'Заполните ID, название RU и EN' : 'Fill ID, title RU and EN');
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
        setSelectedTourId(t.id!);
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
      await supabase.from('guide_panel_elements').delete().eq('tour_id', id);
      await supabase.from('guide_tour_steps').delete().eq('tour_id', id);
      const { error } = await supabase.from('guide_tours').delete().eq('id', id);
      if (error) throw error;
      if (selectedTourId === id) setSelectedTourId(null);
      toast.success(lang === 'ru' ? 'Тур удалён' : 'Tour deleted');
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
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Compass className="h-6 w-6 text-hydra-guide" />
              {lang === 'ru' ? 'Редактор экскурсий' : 'Tour Editor'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === 'ru' ? 'Управление турами, шагами и элементами панели' : 'Manage tours, steps and panel elements'}
            </p>
          </div>
          <Button onClick={() => openTourDialog()} className="hydra-glow-sm">
            <Plus className="h-4 w-4 mr-2" />
            {lang === 'ru' ? 'Новый тур' : 'New Tour'}
          </Button>
        </div>

        {/* Main content — Master-Detail */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left panel — Tour list */}
          <ResizablePanel
            ref={nav.panelRef}
            defaultSize={nav.panelSize}
            minSize={4}
            maxSize={60}
            onResize={nav.onPanelResize}
          >
            <div className="h-full flex flex-col hydra-nav-surface">
              <NavigatorHeader
                title={lang === 'ru' ? 'Экскурсии' : 'Tours'}
                isMinimized={nav.isMinimized}
                onToggle={nav.toggle}
              />

              {nav.isMinimized ? (
                <TooltipProvider delayDuration={200}>
                  <div className="flex-1 overflow-auto p-1 space-y-1">
                    {filteredTours.map((tour) => (
                      <Tooltip key={tour.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "relative flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                              selectedTourId === tour.id ? "bg-hydra-guide/15" : "hover:bg-muted/30",
                              !tour.is_active && "opacity-50"
                            )}
                            onClick={() => setSelectedTourId(tour.id)}
                          >
                            <Compass className={cn("h-5 w-5", selectedTourId === tour.id ? "text-hydra-guide" : "text-muted-foreground")} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[220px]">
                          <div className="space-y-1">
                            <span className="font-medium text-sm">{tour[`title_${lang}`]}</span>
                            <p className="text-xs text-muted-foreground line-clamp-2">{tour[`description_${lang}`]}</p>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[10px]">{steps.filter(s => s.tour_id === tour.id).length} {lang === 'ru' ? 'шагов' : 'steps'}</Badge>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* Search */}
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={lang === 'ru' ? 'Поиск тура…' : 'Search tour…'}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Tour list */}
                  <div className="flex-1 overflow-auto hydra-scrollbar">
                    {filteredTours.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground p-8">
                        <div className="text-center">
                          <Compass className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p>{lang === 'ru' ? 'Нет экскурсий' : 'No tours'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {filteredTours.map((tour) => {
                          const stepCount = steps.filter(s => s.tour_id === tour.id).length;
                          const isSelected = selectedTourId === tour.id;
                          return (
                            <div
                              key={tour.id}
                              className={cn(
                                "px-3 py-2.5 cursor-pointer transition-colors group",
                                isSelected ? "bg-hydra-guide/10" : "hover:bg-muted/30",
                                !tour.is_active && "opacity-60"
                              )}
                              onClick={() => setSelectedTourId(tour.id)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <Compass className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-hydra-guide" : "text-muted-foreground")} />
                                    <span className={cn("text-sm font-medium truncate", isSelected && "text-hydra-guide")}>
                                      {tour[`title_${lang}`]}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 pl-5">
                                    {tour[`description_${lang}`]}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Badge variant="outline" className="text-[10px] h-5">{stepCount}</Badge>
                                  {!tour.is_active && <EyeOff className="h-3 w-3 text-muted-foreground" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 border-t text-xs text-muted-foreground text-center">
                    {tours.length} {lang === 'ru' ? 'экскурсий' : 'tours'}
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right panel — Detail */}
          <ResizablePanel defaultSize={100 - nav.panelSize} minSize={40}>
            {selectedTour ? (
              <GuideTourDetailPanel
                tour={selectedTour}
                steps={tourSteps}
                elements={tourElements}
                lang={lang}
                onEditTour={() => openTourDialog(selectedTour)}
                onDeleteTour={() => deleteTour(selectedTour.id)}
                onRefresh={async () => { await fetchAll(); invalidateCache(); }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <Map className="h-16 w-16 mx-auto opacity-20" />
                  <p className="text-lg font-medium">{lang === 'ru' ? 'Выберите экскурсию' : 'Select a tour'}</p>
                  <p className="text-sm">{lang === 'ru' ? 'Или создайте новую' : 'Or create a new one'}</p>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* ─── Tour Dialog ─── */}
      <Dialog open={tourDialog.open} onOpenChange={(o) => !o && setTourDialog({ open: false, tour: null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {tourDialog.tour?.id && tours.find(t => t.id === tourDialog.tour?.id)
                ? (lang === 'ru' ? 'Редактировать тур' : 'Edit Tour')
                : (lang === 'ru' ? 'Новый тур' : 'New Tour')
              }
            </DialogTitle>
          </DialogHeader>
          {tourDialog.tour && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>ID</Label>
                <Input
                  value={tourDialog.tour.id || ''}
                  onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, id: e.target.value } }))}
                  placeholder="my-tour-id"
                  disabled={!!tours.find(t => t.id === tourDialog.tour?.id)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Название (RU)</Label>
                  <Input value={tourDialog.tour.title_ru || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, title_ru: e.target.value } }))} />
                </div>
                <div className="space-y-1">
                  <Label>Title (EN)</Label>
                  <Input value={tourDialog.tour.title_en || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, title_en: e.target.value } }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Описание (RU)</Label>
                  <Textarea rows={2} value={tourDialog.tour.description_ru || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, description_ru: e.target.value } }))} />
                </div>
                <div className="space-y-1">
                  <Label>Description (EN)</Label>
                  <Textarea rows={2} value={tourDialog.tour.description_en || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, description_en: e.target.value } }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>{lang === 'ru' ? 'Иконка' : 'Icon'}</Label>
                  <Select value={tourDialog.tour.icon || 'Compass'} onValueChange={v => setTourDialog(p => ({ ...p, tour: { ...p.tour!, icon: v } }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ICON_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{lang === 'ru' ? 'Порядок' : 'Sort'}</Label>
                  <Input type="number" value={tourDialog.tour.sort_order ?? 0} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, sort_order: Number(e.target.value) } }))} />
                </div>
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
            <Button onClick={saveTour} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {lang === 'ru' ? 'Сохранить' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
