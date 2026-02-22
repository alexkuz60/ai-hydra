import React from 'react';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Zap, Play, CheckCircle, XCircle, Clock, WifiOff, RefreshCw, Search, Plus, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProxyApiCatalogModel, TestResult } from '../proxyapi/types';
import { STATUS_EXPLANATIONS } from '../proxyapi/types';

interface DotPointCatalogSectionProps {
  userAddedModels: ProxyApiCatalogModel[];
  filteredCatalogModels: ProxyApiCatalogModel[];
  catalogSearch: string;
  onCatalogSearchChange: (value: string) => void;
  catalogLoading: boolean;
  catalogLoaded: boolean;
  catalogCount: number;
  testResults: Record<string, TestResult>;
  testingModel: string | null;
  massTestRunning: boolean;
  massTestProgress: { done: number; total: number };
  onTestModel: (modelId: string) => void;
  onMassTest: () => void;
  onAddUserModel: (modelId: string) => void;
  onRefreshCatalog: () => void;
}

export function DotPointCatalogSection({
  userAddedModels, filteredCatalogModels,
  catalogSearch, onCatalogSearchChange,
  catalogLoading, catalogLoaded, catalogCount,
  testResults, testingModel,
  massTestRunning, massTestProgress,
  onTestModel, onMassTest, onAddUserModel, onRefreshCatalog,
}: DotPointCatalogSectionProps) {
  const totalModels = userAddedModels.length;

  return (
    <AccordionItem value="catalog" className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-semibold">Каталог моделей</span>
          <Badge variant="secondary" className="ml-2">
            {totalModels}
            {catalogLoaded && <span className="text-muted-foreground ml-1">/ {catalogCount} в каталоге</span>}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 space-y-3">
        {/* Search */}
        <div className="relative z-10 flex items-center gap-2 pt-1 px-0.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={catalogSearch}
              onChange={e => onCatalogSearchChange(e.target.value)}
              placeholder={catalogLoading ? 'Загрузка каталога...' : `Поиск среди ${catalogCount} моделей DotPoint...`}
              className="pl-9 focus-visible:ring-offset-0"
              disabled={catalogLoading}
            />
            {catalogLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <Button variant="outline" size="icon" onClick={onRefreshCatalog} disabled={catalogLoading} title="Обновить каталог">
            <RefreshCw className={cn("h-4 w-4", catalogLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Mass test */}
        {totalModels > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onMassTest} disabled={massTestRunning || totalModels === 0} className="gap-2">
              {massTestRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {massTestRunning
                ? `Тестирование ${massTestProgress.done}/${massTestProgress.total}...`
                : `Тест всех моделей (${totalModels})`}
            </Button>
            {massTestRunning && (
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${massTestProgress.total ? (massTestProgress.done / massTestProgress.total) * 100 : 0}%` }} />
              </div>
            )}
          </div>
        )}

        {/* Search results */}
        {filteredCatalogModels.length > 0 && (
          <div className="border rounded-lg bg-card/50 max-h-[240px] overflow-y-auto">
            {filteredCatalogModels.map(model => (
              <div key={model.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/30 last:border-0" onClick={() => onAddUserModel(model.id)}>
                <Network className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <span className="text-sm truncate flex-1 font-mono">{model.id}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{model.owned_by}</Badge>
                <Plus className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
        {catalogSearch.trim() && filteredCatalogModels.length === 0 && !catalogLoading && (
          <p className="text-xs text-muted-foreground text-center py-2">Ничего не найдено среди {catalogCount} моделей</p>
        )}

        {/* User-added models */}
        {userAddedModels.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Добавленные модели ({userAddedModels.length})</p>
            {userAddedModels.map(model => (
              <DotPointModelRow
                key={model.id}
                model={model}
                testResult={testResults[model.id]}
                isTesting={testingModel === model.id}
                onTest={() => onTestModel(model.id)}
              />
            ))}
          </div>
        )}

        {totalModels === 0 && !catalogSearch.trim() && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Найдите модели в каталоге и добавьте их для тестирования
          </p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function DotPointModelRow({ model, testResult, isTesting, onTest }: {
  model: ProxyApiCatalogModel;
  testResult?: TestResult;
  isTesting: boolean;
  onTest: () => void;
}) {
  const expl = testResult ? STATUS_EXPLANATIONS[testResult.status] : null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
      <Network className="h-4 w-4 flex-shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-mono truncate">{model.id}</p>
        <p className="text-xs text-muted-foreground">{model.owned_by}</p>
      </div>
      {testResult && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-help text-xs">
                {testResult.status === 'success' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  : testResult.status === 'gone' ? <WifiOff className="h-3.5 w-3.5 text-destructive" />
                  : testResult.status === 'timeout' ? <Clock className="h-3.5 w-3.5 text-amber-500" />
                  : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                <span>{testResult.latency_ms}ms</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[250px]">
              <p className="text-xs">{expl?.description || testResult.error}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <Button size="sm" variant="ghost" className="flex-shrink-0 h-8 w-8 p-0" onClick={onTest} disabled={isTesting} title="Тест модели">
        {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  );
}
