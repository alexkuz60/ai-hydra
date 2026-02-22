import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit, Sparkles, GitMerge, Wrench, GitBranch, Trophy,
  Users, Network, Trash2, AlertTriangle, ExternalLink, Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { useHydraMemoryStats } from '@/hooks/useHydraMemoryStats';
import { useMemoryI18n } from './i18n';

interface ArsenalAction {
  label: string;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

interface ArsenalLayer {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: 'violet' | 'amber' | 'blue' | 'cyan' | 'emerald' | 'teal';
  href: string;
  total: number;
  items: { label: string; value: number }[];
  actions: ArsenalAction[];
}

type LayerColor = 'violet' | 'amber' | 'blue' | 'cyan' | 'emerald' | 'teal';

const LAYER_STYLES: Record<LayerColor, { text: string; bg: string; border: string; glow: string }> = {
  violet: { text: 'text-hydra-expert', bg: 'bg-hydra-expert/10', border: 'border-hydra-expert/25', glow: 'shadow-hydra-expert/10' },
  amber: { text: 'text-hydra-arbiter', bg: 'bg-hydra-arbiter/10', border: 'border-hydra-arbiter/25', glow: 'shadow-hydra-arbiter/10' },
  blue: { text: 'text-hydra-info', bg: 'bg-hydra-info/10', border: 'border-hydra-info/25', glow: 'shadow-hydra-info/10' },
  emerald: { text: 'text-hydra-success', bg: 'bg-hydra-success/10', border: 'border-hydra-success/25', glow: 'shadow-hydra-success/10' },
  teal: { text: 'text-hydra-memory', bg: 'bg-hydra-memory/10', border: 'border-hydra-memory/25', glow: 'shadow-hydra-memory/10' },
  cyan: { text: 'text-hydra-cyan', bg: 'bg-hydra-cyan/10', border: 'border-hydra-cyan/25', glow: 'shadow-hydra-cyan/10' },
};

export function CognitiveArsenalTab({ stats }: { stats: ReturnType<typeof useHydraMemoryStats> }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const tm = useMemoryI18n();

  const [counts, setCounts] = useState({
    prompts: { total: 0, system: 0, custom: 0 },
    blueprints: { total: 0, system: 0, custom: 0 },
    behaviors: { total: 0, system: 0, custom: 0 },
    tools: { total: 0, prompt: 0, http: 0 },
    flows: { total: 0 },
    interviews: { total: 0, completed: 0 },
    contests: { total: 0, completed: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const [promptsRes, blueprintsRes, behaviorsRes, toolsRes, flowsRes, interviewsRes, contestsRes] = await Promise.all([
          supabase.from('prompt_library').select('is_default').eq('user_id', user.id),
          supabase.from('task_blueprints').select('is_system'),
          supabase.from('role_behaviors').select('is_system'),
          supabase.rpc('get_custom_tools_safe'),
          supabase.from('flow_diagrams').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('interview_sessions').select('status').eq('user_id', user.id),
          supabase.from('contest_sessions').select('status').eq('user_id', user.id),
        ]);

        const prompts = (promptsRes.data || []) as { is_default: boolean }[];
        const blueprints = (blueprintsRes.data || []) as { is_system: boolean }[];
        const behaviors = (behaviorsRes.data || []) as { is_system: boolean }[];
        const tools = (toolsRes.data || []) as { tool_type?: string }[];
        const interviews = (interviewsRes.data || []) as { status: string }[];
        const contests = (contestsRes.data || []) as { status: string }[];

        setCounts({
          prompts: { total: prompts.length, system: prompts.filter(p => p.is_default).length, custom: prompts.filter(p => !p.is_default).length },
          blueprints: { total: blueprints.length, system: blueprints.filter(b => b.is_system).length, custom: blueprints.filter(b => !b.is_system).length },
          behaviors: { total: behaviors.length, system: behaviors.filter(b => b.is_system).length, custom: behaviors.filter(b => !b.is_system).length },
          tools: { total: tools.length, prompt: tools.filter(t => t.tool_type === 'prompt' || !t.tool_type).length, http: tools.filter(t => t.tool_type === 'http_api').length },
          flows: { total: flowsRes.count || 0 },
          interviews: { total: interviews.length, completed: interviews.filter(i => i.status === 'completed').length },
          contests: { total: contests.length, completed: contests.filter(c => c.status === 'completed').length },
        });
      } catch (e) {
        console.error('[CognitiveArsenalTab]', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.id]);

  const grandTotal =
    counts.prompts.total + counts.blueprints.total + counts.behaviors.total +
    counts.tools.total + counts.flows.total + counts.interviews.total + counts.contests.total +
    stats.totalRoleMemory + stats.totalKnowledge + stats.sessionMemory.total;

  const [confirmClearMemory, setConfirmClearMemory] = useState(false);

  const handleClearSessionMemory = useCallback(async () => {
    if (!confirmClearMemory) { setConfirmClearMemory(true); return; }
    try {
      if (!user?.id) return;
      const { error } = await supabase.from('session_memory').delete().eq('user_id', user.id);
      if (error) throw error;
      toast.success(tm('sessionCleared'));
      stats.refresh();
    } catch {
      toast.error(tm('sessionClearError'));
    } finally {
      setConfirmClearMemory(false);
    }
  }, [confirmClearMemory, user?.id, isRu, stats]);

  const layers: ArsenalLayer[] = [
    {
      id: 'instincts',
      label: tm('layer.instincts'),
      description: tm('layer.instinctsDesc'),
      icon: Sparkles, color: 'violet', href: '/role-library',
      total: counts.prompts.total,
      items: [
        { label: tm('item.system'), value: counts.prompts.system },
        { label: tm('item.custom'), value: counts.prompts.custom },
      ],
      actions: [{ label: tm('action.createPrompt'), icon: Sparkles, href: '/role-library' }],
    },
    {
      id: 'patterns',
      label: tm('layer.patterns'),
      description: tm('layer.patternsDesc'),
      icon: GitMerge, color: 'amber', href: '/behavioral-patterns',
      total: counts.blueprints.total + counts.behaviors.total,
      items: [
        { label: tm('item.blueprints'), value: counts.blueprints.total },
        { label: tm('item.behaviors'), value: counts.behaviors.total },
      ],
      actions: [{ label: tm('action.createBlueprint'), icon: GitMerge, href: '/behavioral-patterns' }],
    },
    {
      id: 'tools',
      label: tm('layer.tools'),
      description: tm('layer.toolsDesc'),
      icon: Wrench, color: 'blue', href: '/tools-library',
      total: counts.tools.total,
      items: [
        { label: tm('item.promptStamps'), value: counts.tools.prompt },
        { label: tm('item.httpApi'), value: counts.tools.http },
      ],
      actions: [{ label: tm('action.createTool'), icon: Wrench, href: '/tools-library' }],
    },
    {
      id: 'flows',
      label: tm('layer.flows'),
      description: tm('layer.flowsDesc'),
      icon: GitBranch, color: 'cyan', href: '/flow-editor',
      total: counts.flows.total,
      items: [{ label: tm('item.flowDiagrams'), value: counts.flows.total }],
      actions: [{ label: tm('action.newFlow'), icon: Network, href: '/flow-editor' }],
    },
    {
      id: 'achievements',
      label: tm('layer.achievements'),
      description: tm('layer.achievementsDesc'),
      icon: Trophy, color: 'emerald', href: '/staff-roles',
      total: counts.interviews.total + counts.contests.total,
      items: [
        { label: tm('item.interviews'), value: counts.interviews.total },
        { label: tm('item.contests'), value: counts.contests.total },
      ],
      actions: [
        { label: tm('action.interview'), icon: Users, href: '/staff-roles' },
        { label: tm('action.contest'), icon: Trophy, href: '/model-ratings' },
      ],
    },
    {
      id: 'memory',
      label: tm('layer.memory'),
      description: tm('layer.memoryDesc'),
      icon: BrainCircuit, color: 'teal', href: '/hydra-memory',
      total: stats.totalRoleMemory + stats.totalKnowledge + stats.sessionMemory.total,
      items: [
        { label: tm('item.roleMemory'), value: stats.totalRoleMemory },
        { label: tm('item.knowledge'), value: stats.totalKnowledge },
        { label: tm('item.sessionMemory'), value: stats.sessionMemory.total },
      ],
      actions: [
        {
          label: confirmClearMemory ? tm('action.confirm') : tm('action.clearSessions'),
          icon: confirmClearMemory ? AlertTriangle : Trash2,
          onClick: handleClearSessionMemory,
          variant: confirmClearMemory ? 'destructive' : 'outline',
        },
      ],
    },
  ];

  const isDataLoading = loading || stats.loading;

  return (
    <div className="space-y-6">
      {/* Grand total banner */}
      <Card className="border-[hsl(var(--hydra-memory)/0.4)] bg-gradient-to-r from-[hsl(var(--hydra-memory)/0.08)] via-[hsl(var(--hydra-memory)/0.04)] to-transparent overflow-hidden">
        <CardContent className="p-5 flex items-center gap-5">
          <div className="rounded-xl p-3.5 bg-[hsl(var(--hydra-memory)/0.15)] border border-[hsl(var(--hydra-memory)/0.35)] shrink-0">
            <BrainCircuit className="h-8 w-8 text-[hsl(var(--hydra-memory))]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">
              {tm('arsenal.title')}
            </p>
            {isDataLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <p className="text-4xl font-bold leading-none">
                {grandTotal}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {tm('arsenal.objects')}
                </span>
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mt-1.5 hidden sm:block">
              {tm('arsenal.summary')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Layer cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const s = LAYER_STYLES[layer.color];
          return (
            <motion.div key={layer.id} whileHover={{ scale: 1.012, y: -2 }} transition={{ duration: 0.15 }}>
              <Card className={cn(
                `border ${s.bg} ${s.border} hover:shadow-lg ${s.glow} transition-all h-full flex flex-col`
              )}>
                <CardContent className="p-4 space-y-3 flex flex-col flex-1">
                  {/* Header */}
                  <Link to={layer.href} className="flex items-start justify-between gap-2 group/link">
                    <div className="flex items-center gap-2.5">
                      <div className={`rounded-lg p-2 ${s.bg} border ${s.border} shrink-0`}>
                        <Icon className={`h-4 w-4 ${s.text}`} />
                      </div>
                      <div>
                        {layer.id === 'memory' ? (
                          <TooltipProvider delayDuration={300}>
                             <Tooltip>
                              <TooltipTrigger asChild>
                                <p className={`text-sm font-semibold ${s.text} cursor-help`}>{layer.label}</p>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs p-3 space-y-2">
                                <p className="text-xs font-semibold text-foreground mb-1">
                                  {tm('tooltip.memoryTitle')}
                                </p>
                                <div className="space-y-1.5 text-xs">
                                  <div>
                                    <span className="font-medium text-foreground">{tm('tooltip.roleExpTitle')}</span>
                                    <p className="text-muted-foreground">{tm('tooltip.roleExpDesc')}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-foreground">{tm('tooltip.ragTitle')}</span>
                                    <p className="text-muted-foreground">{tm('tooltip.ragDesc')}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-foreground">{tm('tooltip.sessionTitle')}</span>
                                    <p className="text-muted-foreground">{tm('tooltip.sessionDesc')}</p>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <p className={`text-sm font-semibold ${s.text}`}>{layer.label}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground leading-tight">{layer.description}</p>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/30 group-hover/link:text-muted-foreground/60 transition-colors shrink-0 mt-0.5" />
                  </Link>

                  {/* Big number */}
                  {isDataLoading ? (
                    <Skeleton className="h-9 w-20" />
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-3xl font-bold tabular-nums ${s.text}`}>{layer.total}</span>
                      <span className="text-xs text-muted-foreground">{tm('arsenal.objects')}</span>
                    </div>
                  )}

                  {/* Sub-items */}
                  <div className="space-y-1 pt-0.5 border-t border-border/50">
                    {layer.items.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-muted-foreground">{item.label}</span>
                        {isDataLoading ? (
                          <Skeleton className="h-4 w-8" />
                        ) : (
                          <span className="font-medium tabular-nums">{item.value}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Quick actions */}
                  <div className="flex flex-wrap gap-1.5 pt-2 mt-auto border-t border-border/30">
                    {layer.actions.map((action) => {
                      const ActionIcon = action.icon;
                      if (action.href) {
                        return (
                          <Link key={action.label} to={action.href}>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5">
                              <ActionIcon className="h-3 w-3" />
                              {action.label}
                            </Button>
                          </Link>
                        );
                      }
                      return (
                        <Button
                          key={action.label}
                          variant={action.variant || 'outline'}
                          size="sm"
                          className={cn('h-7 text-[11px] gap-1.5', action.variant === 'destructive' && 'animate-pulse')}
                          onClick={(e) => { e.stopPropagation(); action.onClick?.(); }}
                        >
                          <ActionIcon className="h-3 w-3" />
                          {action.label}
                        </Button>
                      );
                    })}
                    {confirmClearMemory && layer.id === 'memory' && (
                      <Button
                        variant="ghost" size="sm" className="h-7 text-[11px]"
                        onClick={() => setConfirmClearMemory(false)}
                      >
                        {tm('chron.cancel')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
