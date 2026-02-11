import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContestTaskSelector } from './ContestTaskSelector';
import { ContestRulesEditor } from './ContestRulesEditor';
import { ContestPipelineSelector } from './ContestPipelineSelector';
import { ContestArbitration } from './ContestArbitration';
import { ContestSummary } from './ContestSummary';

export function ContestPodium() {

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <ContestTaskSelector />
        <ContestRulesEditor />
        <ContestPipelineSelector />
        <ContestArbitration />
        <ContestSummary />
      </div>
    </ScrollArea>
  );
}
