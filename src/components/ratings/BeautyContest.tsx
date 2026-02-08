import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContestCandidates } from '@/components/ratings/ContestCandidates';
import { ContestPodium } from './ContestPodium';
import { Crown, Users, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function BeautyContest() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [podiumCount, setPodiumCount] = useState(() => {
    try {
      const stored = localStorage.getItem('hydra-contest-models');
      if (stored) return Object.keys(JSON.parse(stored)).length;
    } catch {}
    return 0;
  });

  useEffect(() => {
    const handler = () => {
      try {
        const stored = localStorage.getItem('hydra-contest-models');
        setPodiumCount(stored ? Object.keys(JSON.parse(stored)).length : 0);
      } catch {}
    };
    window.addEventListener('storage', handler);
    const interval = setInterval(handler, 1000);
    return () => { window.removeEventListener('storage', handler); clearInterval(interval); };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue={localStorage.getItem('contest-active-tab') || 'candidates'} onValueChange={(v) => localStorage.setItem('contest-active-tab', v)} className="flex-1 flex flex-col">
        <div className="px-4 pt-3">
          <TabsList className="w-full">
            <TabsTrigger value="candidates" className="flex-1 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {isRu ? 'Отборочные кандидаты' : 'Qualifying Candidates'}
              {podiumCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
                  <Crown className="h-2.5 w-2.5 mr-0.5" />{podiumCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="arena" className="flex-1 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              {isRu ? 'Подиум конкурса' : 'Contest Podium'}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="candidates" className="flex-1 mt-0 h-0 min-h-0">
          <ContestCandidates />
        </TabsContent>

        <TabsContent value="arena" className="flex-1 mt-0 h-0 min-h-0">
          <ContestPodium />
        </TabsContent>
      </Tabs>
    </div>
  );
}
