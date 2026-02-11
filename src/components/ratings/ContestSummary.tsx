import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { Play, Trophy, Users, ListOrdered, ClipboardList } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export function ContestSummary() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [modelCount, setModelCount] = useState(0);
  const [roundCount, setRoundCount] = useState(1);
  const [taskTitle, setTaskTitle] = useState('');

  // Sync state from localStorage
  useEffect(() => {
    const sync = () => {
      try {
        const models = localStorage.getItem('hydra-contest-models');
        setModelCount(models ? Object.keys(JSON.parse(models)).length : 0);
      } catch {}
      try {
        const rules = localStorage.getItem('hydra-contest-rules');
        if (rules) setRoundCount(JSON.parse(rules).roundCount || 1);
      } catch {}
      try {
        const taskId = localStorage.getItem('hydra-contest-task-id');
        setTaskTitle(taskId ? (isRu ? 'Выбрана' : 'Selected') : '');
      } catch {}
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [isRu]);

  return (
    <HydraCard variant="default" glow className="border-border/50">
      <HydraCardHeader>
        <div className="flex items-center gap-2 text-hydra-amber">
          <Trophy className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">
            {isRu ? 'Шаг 5' : 'Step 5'}
          </span>
        </div>
        <HydraCardTitle>
          {isRu ? 'Предпросмотр и запуск' : 'Preview & Launch'}
        </HydraCardTitle>
      </HydraCardHeader>

      <HydraCardContent>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{isRu ? 'Участников:' : 'Participants:'}</span>
            <span className="font-semibold text-foreground">{modelCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ListOrdered className="h-3.5 w-3.5" />
            <span>{isRu ? 'Туров:' : 'Rounds:'}</span>
            <span className="font-semibold text-foreground">{roundCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClipboardList className="h-3.5 w-3.5" />
            <span>{isRu ? 'Задача:' : 'Task:'}</span>
            <span className="font-semibold text-foreground">
              {taskTitle || (isRu ? 'Не выбрана' : 'Not selected')}
            </span>
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button disabled className="w-full gap-2 hydra-glow-sm" size="lg">
                  <Play className="h-4 w-4" />
                  {isRu ? 'Начать конкурс' : 'Start Contest'}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {isRu
                  ? 'Функция запуска будет доступна позже'
                  : 'Launch feature will be available later'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </HydraCardContent>
    </HydraCard>
  );
}
