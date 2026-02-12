import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Swords } from 'lucide-react';
import { ContestTaskSelector } from './ContestTaskSelector';
import { ContestRulesEditor } from './ContestRulesEditor';
import { ContestPipelineSelector } from './ContestPipelineSelector';
import { ContestArbitration } from './ContestArbitration';
import { ContestSummary } from './ContestSummary';
import { DuelPlanEditor } from './DuelPlanEditor';
import { useDuelConfig } from '@/hooks/useDuelConfig';
import { getRatingsText } from './i18n';

export function ContestPodium() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const duelConfig = useDuelConfig();

  return (
    <div className="h-full flex flex-col">
      <Tabs
        defaultValue={localStorage.getItem('contest-podium-tab') || 'contest'}
        onValueChange={v => localStorage.setItem('contest-podium-tab', v)}
        className="h-full flex flex-col"
      >
        <div className="px-4 pt-3 pb-0 border-b border-border/30">
          <TabsList className="h-9">
            <TabsTrigger value="contest" className="gap-1.5 text-xs px-4">
              <Crown className="h-3.5 w-3.5" />
              {getRatingsText('tabContest', isRu)}
            </TabsTrigger>
            <TabsTrigger value="duel" className="gap-1.5 text-xs px-4">
              <Swords className="h-3.5 w-3.5" />
              {getRatingsText('tabDuel', isRu)}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="contest" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <ContestTaskSelector />
              <ContestRulesEditor />
              <ContestPipelineSelector />
              <ContestArbitration />
              <ContestSummary />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="duel" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <DuelPlanEditor config={duelConfig} isRu={isRu} />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
