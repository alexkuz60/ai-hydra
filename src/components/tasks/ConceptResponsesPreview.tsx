import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Target, Landmark, Maximize2, CheckCircle2, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ConceptResponses } from '@/hooks/useConceptResponses';
import ReactMarkdown from 'react-markdown';
import { ApprovalSectionEditor } from './ApprovalSectionEditor';
import { parseStrategyMarkdown, computeApprovalDiff, sectionsToJson, sectionsFromJson } from '@/lib/strategySectionParser';
import type { ApprovalSection } from '@/lib/strategySectionParser';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

type ViewMode = 'preview' | 'approval';

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
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [approvalSections, setApprovalSections] = useState<ApprovalSection[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Sync when parent changes the default tab
  useEffect(() => {
    if (open) setActiveTab(defaultTab);
  }, [defaultTab, open]);

  // Parse sections when switching to approval mode
  useEffect(() => {
    if (viewMode === 'approval' && open) {
      loadOrParseApprovalSections();
    }
  }, [viewMode, open]);

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
        setApprovalSections(sectionsFromJson(meta.approval_sections));
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

    setApprovalSections([...vSections, ...sSections, ...pSections]);
  }, [planId, responses, language]);

  const getContent = (r: { content: string; content_en: string | null } | null) => {
    if (!r) return null;
    return (language === 'en' && r.content_en) ? r.content_en : r.content;
  };

  const handleSaveApproval = async () => {
    if (!planId || !user?.id) return;
    setSaving(true);
    
    try {
      // Save approval sections to plan metadata
      const { data: plan } = await supabase
        .from('strategic_plans')
        .select('metadata')
        .eq('id', planId)
        .single();

      const existingMeta = (plan?.metadata as Record<string, unknown>) || {};
      const diff = computeApprovalDiff(approvalSections);
      
      const updatedMeta = {
        ...existingMeta,
        approval_sections: sectionsToJson(approvalSections),
        approval_diff: diff,
        approval_updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('strategic_plans')
        .update({ metadata: updatedMeta as any })
        .eq('id', planId);

      if (updateError) throw updateError;

      // Create sessions/aspects from approved top-level sections
      const approvedAspects = approvalSections.filter(
        s => s.depth === 0 && s.status === 'approved'
      );

      if (approvedAspects.length > 0) {
        // Check which aspects already exist
        const { data: existingSessions } = await supabase
          .from('sessions')
          .select('id, title')
          .eq('plan_id', planId)
          .eq('user_id', user.id)
          .is('parent_id', null);

        const existingTitles = new Set((existingSessions || []).map(s => s.title));

        for (let i = 0; i < approvedAspects.length; i++) {
          const aspect = approvedAspects[i];
          if (existingTitles.has(aspect.title)) continue;

          // Create aspect session
          const { data: aspectSession, error: aspectErr } = await supabase
            .from('sessions')
            .insert({
              user_id: user.id,
              plan_id: planId,
              title: aspect.title,
              description: aspect.body || null,
              is_active: true,
              sort_order: (existingSessions?.length || 0) + i,
            })
            .select('id')
            .single();

          if (aspectErr || !aspectSession) continue;

          // Create child task sessions
          const approvedTasks = aspect.children.filter(c => c.status === 'approved');
          for (let j = 0; j < approvedTasks.length; j++) {
            const task = approvedTasks[j];
            await supabase
              .from('sessions')
              .insert({
                user_id: user.id,
                plan_id: planId,
                parent_id: aspectSession.id,
                title: task.title,
                description: task.body || null,
                is_active: true,
                sort_order: j,
              });
          }
        }
      }

      toast.success(language === 'ru' ? 'План утверждён' : 'Plan approved');
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

  const hasAnyResponse = !!(responses.visionary || responses.strategist || responses.patent);
  const approvalDiff = approvalSections.length > 0 ? computeApprovalDiff(approvalSections) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-4rem)] w-full max-h-[calc(100vh-2rem)] h-full flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle>
              {viewMode === 'preview'
                ? (language === 'ru' ? 'Мнения экспертов' : 'Expert Opinions')
                : (language === 'ru' ? 'Утверждение стратегии' : 'Strategy Approval')
              }
            </DialogTitle>
            {hasAnyResponse && planId && viewMode === 'preview' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => setViewMode('approval')}
              >
                <FileEdit className="h-3.5 w-3.5" />
                {language === 'ru' ? 'Режим утверждения' : 'Approval Mode'}
              </Button>
            )}
          </div>
        </DialogHeader>

        {viewMode === 'preview' ? (
          /* ---------- PREVIEW MODE ---------- */
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full justify-start">
              {tabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                  <tab.icon className={cn('h-4 w-4', tab.color)} />
                  <span className="text-sm">{tab.label}</span>
                  {tab.response && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id} className="flex-1 min-h-0">
                <ScrollArea className="flex-1 h-full">
                  {tab.response ? (
                    <div className="prose prose-base dark:prose-invert max-w-none p-4">
                      <ReactMarkdown>{getContent(tab.response) || ''}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      {language === 'ru' ? 'Ответ ещё не получен' : 'No response yet'}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          /* ---------- APPROVAL MODE ---------- */
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
        )}

        {/* Footer with approve button */}
        {viewMode === 'approval' && (
          <DialogFooter className="border-t pt-3 gap-2">
            {approvalDiff && (
              <span className="text-xs text-muted-foreground mr-auto">
                {language === 'ru' 
                  ? `Утверждено: ${approvalDiff.approved}/${approvalDiff.total}`
                  : `Approved: ${approvalDiff.approved}/${approvalDiff.total}`
                }
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('preview')}
            >
              {language === 'ru' ? 'Назад' : 'Back'}
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleSaveApproval}
              disabled={saving || (approvalDiff?.approved === 0)}
            >
              <CheckCircle2 className="h-4 w-4" />
              {saving 
                ? (language === 'ru' ? 'Сохранение...' : 'Saving...')
                : (language === 'ru' ? 'Утвердить план' : 'Approve Plan')
              }
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { CollapsedResponse };
