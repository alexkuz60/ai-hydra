import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ClipboardList, Users, ListOrdered, Workflow } from 'lucide-react';
import { SummaryItem } from './ContestSummaryItem';

const MODE_LABELS: Record<string, { ru: string; en: string }> = {
  contest: { ru: 'Конкурс', en: 'Contest' },
  interview: { ru: 'Собеседование', en: 'Interview' },
};

const PIPELINE_LABELS: Record<string, { ru: string; en: string }> = {
  none: { ru: 'Не нужен', en: 'Not needed' },
};

interface ContestConfigProps {
  modelCount: number;
  roundCount: number;
  taskTitle: string;
  mode: string;
  pipeline: string;
}

export function ContestSummaryConfig({
  modelCount,
  roundCount,
  taskTitle,
  mode,
  pipeline,
}: ContestConfigProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const label = (map: Record<string, { ru: string; en: string }>, key: string) =>
    map[key] ? (isRu ? map[key].ru : map[key].en) : key;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      <SummaryItem
        icon={<ClipboardList className="h-3.5 w-3.5" />}
        label={isRu ? 'Режим' : 'Mode'}
        value={label(MODE_LABELS, mode)}
      />
      <SummaryItem
        icon={<Users className="h-3.5 w-3.5" />}
        label={isRu ? 'Участников' : 'Participants'}
        value={String(modelCount)}
      />
      <SummaryItem
        icon={<ListOrdered className="h-3.5 w-3.5" />}
        label={isRu ? 'Туров' : 'Rounds'}
        value={String(roundCount)}
      />
      <SummaryItem
        icon={<ClipboardList className="h-3.5 w-3.5" />}
        label={isRu ? 'Задача' : 'Task'}
        value={taskTitle || (isRu ? 'Не выбрана' : 'Not selected')}
      />
      <SummaryItem
        icon={<Workflow className="h-3.5 w-3.5" />}
        label={isRu ? 'Пайплайн' : 'Pipeline'}
        value={label(PIPELINE_LABELS, pipeline)}
      />
    </div>
  );
}
