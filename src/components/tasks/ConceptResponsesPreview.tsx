import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Target, Landmark, Maximize2, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ConceptResponses } from '@/hooks/useConceptResponses';
import ReactMarkdown from 'react-markdown';
import { ApprovalSectionEditor, STRATEGY_LABELS, VISION_LABELS } from './ApprovalSectionEditor';
import { parseStrategyMarkdown, computeApprovalDiff, sectionsToJson, sectionsFromJson } from '@/lib/strategySectionParser';
import type { ApprovalSection } from '@/lib/strategySectionParser';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { computeSyncPlan, applySyncPlan } from '@/lib/strategySyncEngine';
import type { SyncPlan } from '@/lib/strategySyncEngine';
import { StrategySyncDialog } from './StrategySyncDialog';

interface CollapsedResponseProps {
  content: string | null;
  contentEn: string | null;
  className?: string;
  onExpand: () => void;
  accentClass: string;
}

function CollapsedResponse({ content, contentEn, className, onExpand, accentClass }: CollapsedResponseProps) {
  const { language } = useLanguage();
  const text = (language === 'en' && contentEn) ? contentEn : content;
  
  if (!text) return null;

  return (
    <div className={cn('relative mt-2 group', className)}>
      <div className="text-sm text-muted-foreground line-clamp-5 whitespace-pre-wrap border-l-2 pl-3 py-1" style={{ borderColor: `hsl(var(--${accentClass}))` }}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-1">{children}</p>,
            h1: ({ children }) => <span className="font-bold">{children}</span>,
            h2: ({ children }) => <span className="font-bold">{children}</span>,
            h3: ({ children }) => <span className="font-semibold">{children}</span>,
            ul: ({ children }) => <span>{children}</span>,
            li: ({ children }) => <span>• {children} </span>,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-6 px-2 text-sm mt-1 gap-1 opacity-70 hover:opacity-100')}
        onClick={onExpand}
      >
        <Maximize2 className="h-3 w-3" />
        {language === 'ru' ? 'Развернуть' : 'Expand'}
      </Button>
    </div>
  );
}

interface ConceptResponsesPreviewProps {
  responses: ConceptResponses;
  defaultTab?: 'visionary' | 'strategist' | 'patent';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId?: string | null;
  includePatent?: boolean;
  onApprovalComplete?: () => void;
}

export function ConceptResponsesPreview({ 
  responses, defaultTab = 'visionary', open, onOpenChange,
  planId, includePatent = true, onApprovalComplete,
}: ConceptResponsesPreviewProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [approvalSections, setApprovalSections] = useState<ApprovalSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [syncPlan, setSyncPlan] = useState<SyncPlan | null>(null);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [applyingSync, setApplyingSync] = useState(false);
  
  // Track initial state for dirty detection
  const initialSectionsRef = useRef<string>('');
  
  const isDirty = () => {
    if (approvalSections.length === 0) return false;
    return JSON.stringify(sectionsToJson(approvalSections)) !== initialSectionsRef.current;
  };

  // Sync when parent changes the default tab
  useEffect(() => {
    if (open) setActiveTab(defaultTab);
  }, [defaultTab, open]);

  // Parse sections when dialog opens
  useEffect(() => {
    if (open) {
      loadOrParseApprovalSections();
    }
  }, [open]);

  const loadOrParseApprovalSections = useCallback(async () => {
    if (!planId) return;
    
    // Try to load existing approval data from plan metadata
    try {
      const { data } = await supabase
        .from('strategic_plans')
        .select('metadata')
        .eq('id', planId)
        .single();
      
      const meta = data?.metadata as Record<string, unknown> | null;
      if (meta?.approval_sections) {
        const loaded = sectionsFromJson(meta.approval_sections);
        setApprovalSections(loaded);
        initialSectionsRef.current = JSON.stringify(meta.approval_sections);
        return;
      }
    } catch { /* fall through to parsing */ }

    // Parse from current responses
    const getContent = (r: { content: string; content_en: string | null } | null) => {
      if (!r) return '';
      return (language === 'en' && r.content_en) ? r.content_en : r.content;
    };

    const vSections = parseStrategyMarkdown(getContent(responses.visionary), 'visionary');
    const sSections = parseStrategyMarkdown(getContent(responses.strategist), 'strategist');
    const pSections = parseStrategyMarkdown(getContent(responses.patent), 'patent');

    const all = [...vSections, ...sSections, ...pSections];
    setApprovalSections(all);
    initialSectionsRef.current = JSON.stringify(sectionsToJson(all));
  }, [planId, responses, language]);

  const handleClose = (openState: boolean) => {
    if (!openState && isDirty()) {
      setShowUnsavedDialog(true);
      return;
    }
    onOpenChange(openState);
  };

  const handleDiscardAndClose = () => {
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  // For strategist: compute sync plan first, show confirmation dialog
  const handleStrategistApproval = async () => {
    if (!planId || !user?.id) return;
    setSaving(true);
    try {
      const tabSections = approvalSections.filter(s => s.source === 'strategist');
      const plan = await computeSyncPlan(planId, user.id, tabSections);
      setSyncPlan(plan);
      setShowSyncDialog(true);
    } catch (err: any) {
      console.error('Sync plan error:', err);
      toast.error(err.message || 'Failed to compute sync plan');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSync = async () => {
    if (!planId || !user?.id || !syncPlan) return;
    setApplyingSync(true);
    try {
      // 1. Save approval metadata first
      await saveApprovalMetadata('strategist');
      
      // 2. Apply sync plan
      const result = await applySyncPlan(planId, user.id, syncPlan);
      if (!result.success) throw new Error(result.error);

      // 3. Save section→session mapping in plan metadata
      const { data: plan } = await supabase
        .from('strategic_plans')
        .select('metadata')
        .eq('id', planId)
        .single();
      const meta = (plan?.metadata as Record<string, unknown>) || {};
      await supabase
        .from('strategic_plans')
        .update({
          metadata: {
            ...meta,
            last_sync_at: new Date().toISOString(),
            sync_stats: syncPlan.stats,
          } as any,
        })
        .eq('id', planId);

      initialSectionsRef.current = JSON.stringify(sectionsToJson(approvalSections));
      toast.success(language === 'ru' ? 'Стратегия принята и структура СПРЗ обновлена' : 'Strategy accepted and SPSP structure updated');
      setShowSyncDialog(false);
      setSyncPlan(null);
      onApprovalComplete?.();
    } catch (err: any) {
      console.error('Sync apply error:', err);
      toast.error(err.message || 'Failed to apply sync');
    } finally {
      setApplyingSync(false);
    }
  };

  const saveApprovalMetadata = async (tabSource: 'visionary' | 'strategist' | 'patent') => {
    if (!planId) return;
    const tabSections = approvalSections.filter(s => s.source === tabSource);
    const { data: plan } = await supabase
      .from('strategic_plans')
      .select('metadata')
      .eq('id', planId)
      .single();

    const existingMeta = (plan?.metadata as Record<string, unknown>) || {};
    const allSectionsJson = sectionsToJson(approvalSections);
    const tabDiff = computeApprovalDiff(tabSections);
    const metaKey = `approval_${tabSource}`;

    const updatedMeta = {
      ...existingMeta,
      approval_sections: allSectionsJson,
      [metaKey]: { diff: tabDiff, updated_at: new Date().toISOString() },
    };

    const { error } = await supabase
      .from('strategic_plans')
      .update({ metadata: updatedMeta as any })
      .eq('id', planId);
    if (error) throw error;
  };

  const handleSaveTab = async (tabSource: 'visionary' | 'strategist' | 'patent') => {
    if (!planId || !user?.id) return;

    // For strategist: use sync flow with confirmation dialog
    if (tabSource === 'strategist') {
      await handleStrategistApproval();
      return;
    }

    setSaving(true);
    try {
      await saveApprovalMetadata(tabSource);
      initialSectionsRef.current = JSON.stringify(sectionsToJson(approvalSections));

      const labels = {
        visionary: { ru: 'Видение принято', en: 'Vision accepted' },
        strategist: { ru: 'Стратегия принята', en: 'Strategy accepted' },
        patent: { ru: 'Патентный анализ принят', en: 'Patent analysis accepted' },
      };
      toast.success(language === 'ru' ? labels[tabSource].ru : labels[tabSource].en);
      onApprovalComplete?.();
    } catch (err: any) {
      console.error('Approval save error:', err);
      toast.error(err.message || 'Failed to save approval');
    } finally {
      setSaving(false);
    }
  };

  const allTabs = [
    { id: 'visionary' as const, label: t('concept.visionary.title'), icon: Eye, color: 'text-hydra-visionary', response: responses.visionary },
    { id: 'strategist' as const, label: t('concept.strategist.title'), icon: Target, color: 'text-hydra-strategist', response: responses.strategist },
    { id: 'patent' as const, label: t('concept.patentSearch.title'), icon: Landmark, color: 'text-hydra-patent', response: responses.patent },
  ];
  const tabs = includePatent ? allTabs : allTabs.filter(t => t.id !== 'patent');

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[calc(100vw-4rem)] w-full max-h-[calc(100vh-2rem)] h-full flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {language === 'ru' ? 'Утверждение стратегии' : 'Strategy Approval'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full justify-start">
              {tabs.map(tab => {
                const sectionCount = approvalSections.filter(s => s.source === tab.id).length;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                    <tab.icon className={cn('h-4 w-4', tab.color)} />
                    <span className="text-sm">{tab.label}</span>
                    {sectionCount > 0 && <span className="text-xs text-muted-foreground">({sectionCount})</span>}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {tabs.map(tab => {
              const tabSections = approvalSections.filter(s => s.source === tab.id);
              return (
                <TabsContent key={tab.id} value={tab.id} className="flex-1 min-h-0">
                  {tabSections.length > 0 ? (
                    <div className="p-4 flex-1 h-full">
                      <ApprovalSectionEditor
                        sections={tabSections}
                        onSectionsChange={(updated) => {
                          setApprovalSections(prev => {
                            const others = prev.filter(s => s.source !== tab.id);
                            return [...others, ...updated];
                          });
                        }}
                        showAddButtons={
                          tab.id === 'strategist' ? STRATEGY_LABELS
                          : tab.id === 'visionary' ? VISION_LABELS
                          : false
                        }
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      {language === 'ru' ? 'Ответ ещё не получен' : 'No response yet'}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>

          {/* Footer with per-tab approve buttons */}
          {(() => {
            const tabSections = approvalSections.filter(s => s.source === activeTab);
            const tabDiff = tabSections.length > 0 ? computeApprovalDiff(tabSections) : null;
            
            const buttonLabels: Record<string, { ru: string; en: string; icon: React.ReactNode }> = {
              visionary: { ru: 'Принять видение', en: 'Accept Vision', icon: <Sparkles className="h-4 w-4" /> },
              strategist: { ru: 'Принять стратегию', en: 'Accept Strategy', icon: <CheckCircle2 className="h-4 w-4" /> },
              patent: { ru: 'Принять патентный анализ', en: 'Accept Patent', icon: <CheckCircle2 className="h-4 w-4" /> },
            };
            const label = buttonLabels[activeTab] || buttonLabels.strategist;

            return (
              <DialogFooter className="border-t pt-3 gap-2">
                {tabDiff && (
                  <span className="text-xs text-muted-foreground mr-auto">
                    {language === 'ru'
                      ? `Утверждено: ${tabDiff.approved}/${tabDiff.total}`
                      : `Approved: ${tabDiff.approved}/${tabDiff.total}`
                    }
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClose(false)}
                >
                  {language === 'ru' ? 'Назад' : 'Back'}
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleSaveTab(activeTab)}
                  disabled={saving || !tabDiff || (tabDiff.approved === 0 && tabDiff.rejected === 0 && tabDiff.rework === 0 && tabDiff.edited === 0 && tabDiff.renamed === 0)}
                >
                  {label.icon}
                  {saving
                    ? (language === 'ru' ? 'Сохранение...' : 'Saving...')
                    : (language === 'ru' ? label.ru : label.en)
                  }
                </Button>
              </DialogFooter>
            );
          })()}
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={handleDiscardAndClose}
        onCancel={() => setShowUnsavedDialog(false)}
      />

      <StrategySyncDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
        syncPlan={syncPlan}
        onConfirm={handleConfirmSync}
        applying={applyingSync}
      />
    </>
  );
}

export { CollapsedResponse };
