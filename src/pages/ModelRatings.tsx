import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Loader2, Briefcase, Crown, BarChart3, ScrollText, UserCheck } from 'lucide-react';
import { ScreeningPanel } from '@/components/ratings/ScreeningPanel';
import { CloudSyncIndicator } from '@/components/ui/CloudSyncIndicator';
import { useCloudSyncStatus } from '@/hooks/useCloudSettings';
import { cn } from '@/lib/utils';
import { useDuelConfig } from '@/hooks/useDuelConfig';
import { useContestConfig } from '@/hooks/useContestConfig';

import TournamentIcon from '@/assets/TournamentIcon';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { useNavigatorResize } from '@/hooks/useNavigatorResize';
import { NavigatorHeader } from '@/components/layout/NavigatorHeader';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ModelPortfolio } from '@/components/ratings/ModelPortfolio';
import { BeautyContest } from '@/components/ratings/BeautyContest';
import { ContestPodium } from '@/components/ratings/ContestPodium';
import { RatingsContent } from '@/components/ratings/RatingsContent';
import { DuelArena } from '@/components/ratings/DuelArena';

type Section = 'portfolio' | 'rules' | 'contest' | 'duel' | 'interview' | 'ratings';

const SECTIONS: { id: Section; icon: React.ComponentType<{ className?: string }>; labelKey: string; descKey: string }[] = [
  { id: 'portfolio', icon: Briefcase, labelKey: 'page.podium.portfolio', descKey: 'page.podium.portfolioDesc' },
  { id: 'rules', icon: ScrollText, labelKey: 'page.podium.rules', descKey: 'page.podium.rulesDesc' },
  { id: 'contest', icon: Crown, labelKey: 'page.podium.contest', descKey: 'page.podium.contestDesc' },
  { id: 'duel', icon: TournamentIcon, labelKey: 'page.podium.duel', descKey: 'page.podium.duelDesc' },
  { id: 'interview', icon: UserCheck, labelKey: 'page.podium.interview', descKey: 'page.podium.interviewDesc' },
  { id: 'ratings', icon: BarChart3, labelKey: 'page.podium.ratings', descKey: 'page.podium.ratingsDesc' },
];

export default function ModelRatings() {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const cloudSynced = useCloudSyncStatus();
  const duelConfig = useDuelConfig();
  const contestConfig = useContestConfig();

  // Derive screening role from contest plan: free prompt → assistant, role-based → roleForEvaluation
  const screeningRole = useMemo(() => {
    const firstRound = contestConfig.rules?.rounds?.[0];
    if (firstRound?.type === 'role' && firstRound.roleForEvaluation) {
      return firstRound.roleForEvaluation;
    }
    return 'assistant';
  }, [contestConfig.rules]);
  const [activeSection, setActiveSection] = useState<Section>(() => {
    const saved = localStorage.getItem('podium-active-section');
    return (saved === 'portfolio' || saved === 'rules' || saved === 'contest' || saved === 'duel' || saved === 'interview' || saved === 'ratings') ? saved : 'ratings';
  });
  const [contestWinners, setContestWinners] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('podium-contest-winners');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [contestSessionId, setContestSessionId] = useState<string | undefined>();
  const handleToggleContestWinner = useCallback((modelId: string) => {
    setContestWinners(prev => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId); else next.add(modelId);
      localStorage.setItem('podium-contest-winners', JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Persist active section
  useEffect(() => {
    localStorage.setItem('podium-active-section', activeSection);
  }, [activeSection]);

  // Listen for navigation events from child components (e.g., DuelPlanEditor "К барьеру!")
  useEffect(() => {
    const handler = (e: Event) => {
      const section = (e as CustomEvent).detail?.section;
      if (section) setActiveSection(section);
    };
    window.addEventListener('podium-navigate', handler);
    return () => window.removeEventListener('podium-navigate', handler);
  }, []);

  const nav = useNavigatorResize({ storageKey: 'model-ratings', defaultMaxSize: 25 });

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideHeader>
      <div className="h-screen flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="text-muted-foreground hover:text-primary" />
            <div>
              <h1 className="text-2xl font-bold">
                {t('page.podium.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('page.podium.subtitle')}
              </p>
            </div>
          </div>
          <CloudSyncIndicator loaded={cloudSynced} />
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel
            ref={nav.panelRef}
            defaultSize={nav.panelSize}
            minSize={4}
            maxSize={40}
            onResize={nav.onPanelResize}
            data-guide="podium-sections"
          >
            <div className="h-full flex flex-col hydra-nav-surface">
              <NavigatorHeader
                title={t('page.podium.sections')}
                isMinimized={nav.isMinimized}
                onToggle={nav.toggle}
              />

              <TooltipProvider delayDuration={300}>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {SECTIONS.map(section => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    const label = t(section.labelKey);
                    const guideAttr = `podium-${section.id}-btn`;

                    if (nav.isMinimized) {
                      return (
                        <Tooltip key={section.id}>
                          <TooltipTrigger asChild>
                            <button
                              data-guide={guideAttr}
                              onClick={() => setActiveSection(section.id)}
                              className={cn(
                                "w-full flex items-center justify-center p-2 rounded-lg transition-colors",
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-muted/30 text-muted-foreground"
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[200px]">
                            <div className="font-medium text-sm">{label}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {t(section.descKey)}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <button
                        key={section.id}
                        data-guide={guideAttr}
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted/30 text-muted-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{label}</div>
                          <div className="text-xs opacity-60 truncate">
                            {t(section.descKey)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={100 - nav.panelSize} minSize={50}>
            <div className="h-full" data-guide="podium-content">
              {activeSection === 'portfolio' && <ModelPortfolio />}
              {activeSection === 'rules' && <ContestPodium duelConfig={duelConfig} />}
              {activeSection === 'contest' && <BeautyContest selectedWinners={contestWinners} onToggleWinner={handleToggleContestWinner} onContestSessionChange={setContestSessionId} />}
              {activeSection === 'duel' && <DuelArena duelConfig={duelConfig} />}
              {activeSection === 'interview' && (
                <ScreeningPanel
                  role={screeningRole}
                  selectedWinners={contestWinners}
                  sourceContestId={contestSessionId}
                />
              )}
              {activeSection === 'ratings' && <RatingsContent />}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Layout>
  );
}
