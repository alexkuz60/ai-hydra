import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Loader2, Briefcase, Crown, BarChart3, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { useEffect } from 'react';

type Section = 'portfolio' | 'rules' | 'contest' | 'ratings';

const SECTIONS: { id: Section; icon: React.ComponentType<{ className?: string }>; labelRu: string; labelEn: string; descRu: string; descEn: string }[] = [
  { id: 'portfolio', icon: Briefcase, labelRu: 'Портфолио ИИ-моделей', labelEn: 'AI Model Portfolio', descRu: 'Каталог всех доступных моделей', descEn: 'Catalog of all available models' },
  { id: 'rules', icon: ScrollText, labelRu: 'Правила конкурса', labelEn: 'Contest Rules', descRu: 'Настройка туров и критериев', descEn: 'Rounds and criteria setup' },
  { id: 'contest', icon: Crown, labelRu: 'Конкурс интеллект-красоты', labelEn: 'Intelligence Contest', descRu: 'Соревнования между моделями', descEn: 'AI model competitions' },
  { id: 'ratings', icon: BarChart3, labelRu: 'Рейтинги ИИ-моделей', labelEn: 'AI Model Ratings', descRu: 'Статистика и оценки', descEn: 'Stats and evaluations' },
];

export default function ModelRatings() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>(() => {
    const saved = localStorage.getItem('podium-active-section');
    return (saved === 'portfolio' || saved === 'rules' || saved === 'contest' || saved === 'ratings') ? saved : 'ratings';
  });

  // Persist active section
  useEffect(() => {
    localStorage.setItem('podium-active-section', activeSection);
  }, [activeSection]);

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
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <h1 className="text-2xl font-bold">
            {language === 'ru' ? 'Подиум ИИ-моделей' : 'AI Model Podium'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === 'ru' ? 'Портфолио, конкурсы и рейтинги' : 'Portfolio, contests & ratings'}
          </p>
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel
            ref={nav.panelRef}
            defaultSize={nav.panelSize}
            minSize={4}
            maxSize={40}
            onResize={nav.onPanelResize}
          >
            <div className="h-full flex flex-col hydra-nav-surface">
              <NavigatorHeader
                title={language === 'ru' ? 'Разделы' : 'Sections'}
                isMinimized={nav.isMinimized}
                onToggle={nav.toggle}
              />

              <TooltipProvider delayDuration={300}>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {SECTIONS.map(section => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    const label = language === 'ru' ? section.labelRu : section.labelEn;

                    if (nav.isMinimized) {
                      return (
                        <Tooltip key={section.id}>
                          <TooltipTrigger asChild>
                            <button
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
                              {language === 'ru' ? section.descRu : section.descEn}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <button
                        key={section.id}
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
                            {language === 'ru' ? section.descRu : section.descEn}
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
            <div className="h-full">
              {activeSection === 'portfolio' && <ModelPortfolio />}
              {activeSection === 'rules' && <ContestPodium />}
              {activeSection === 'contest' && <BeautyContest />}
              {activeSection === 'ratings' && <RatingsContent />}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Layout>
  );
}
