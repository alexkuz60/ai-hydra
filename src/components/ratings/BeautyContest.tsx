import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContestCandidates } from '@/components/ratings/ContestCandidates';
import { HydraCard, HydraCardContent } from '@/components/ui/hydra-card';
import { Crown, Users, Swords } from 'lucide-react';

export function BeautyContest() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue={localStorage.getItem('contest-active-tab') || 'candidates'} onValueChange={(v) => localStorage.setItem('contest-active-tab', v)} className="flex-1 flex flex-col">
        <div className="px-4 pt-3">
          <TabsList className="w-full">
            <TabsTrigger value="candidates" className="flex-1 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {isRu ? 'Отборочные кандидаты' : 'Qualifying Candidates'}
            </TabsTrigger>
            <TabsTrigger value="arena" className="flex-1 flex items-center gap-1.5">
              <Swords className="h-3.5 w-3.5" />
              {isRu ? 'Арена' : 'Arena'}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="candidates" className="flex-1 mt-0">
          <ContestCandidates />
        </TabsContent>

        <TabsContent value="arena" className="flex-1 mt-0">
          <div className="h-full flex items-center justify-center p-4">
            <HydraCard variant="default" className="max-w-md w-full">
              <HydraCardContent className="py-16 text-center">
                <Crown className="h-12 w-12 text-hydra-amber mx-auto mb-4 opacity-50" />
                <h2 className="text-lg font-semibold mb-2">
                  {isRu ? 'Арена соревнований' : 'Competition Arena'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRu
                    ? 'Раздел в разработке. Здесь появится система A/B-тестирования моделей.'
                    : 'Section under development. A/B model testing system coming soon.'}
                </p>
              </HydraCardContent>
            </HydraCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
