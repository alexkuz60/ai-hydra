import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContestTaskSelector } from './ContestTaskSelector';
import { ContestRulesEditor } from './ContestRulesEditor';
import { ContestSummary } from './ContestSummary';

export function ContestPodium() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <ContestTaskSelector />
        <ContestRulesEditor />
        <ContestSummary />
      </div>
    </ScrollArea>
  );
}
