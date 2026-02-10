import React from 'react';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Zap, Play, CheckCircle, XCircle, Clock, WifiOff, RefreshCw, Search, Plus } from 'lucide-react';
import { ProxyApiLogo, PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { cn } from '@/lib/utils';
import { type ModelRegistryEntry, STRENGTH_LABELS } from '@/config/modelRegistry';
import type { ProxyApiCatalogModel, TestResult } from './types';
import { STATUS_EXPLANATIONS } from './types';

interface ProxyCatalogSectionProps {
  proxyModels: ModelRegistryEntry[];
  userAddedModels: ProxyApiCatalogModel[];
  filteredCatalogModels: ProxyApiCatalogModel[];
  catalogSearch: string;
  onCatalogSearchChange: (value: string) => void;
  catalogLoading: boolean;
  catalogLoaded: boolean;
  proxyCatalogCount: number;
  testResults: Record<string, TestResult>;
  testingModel: string | null;
  massTestRunning: boolean;
  massTestProgress: { done: number; total: number };
  onTestModel: (modelId: string) => void;
  onMassTest: () => void;
  onAddUserModel: (modelId: string) => void;
  onRefreshCatalog: () => void;
}

export function ProxyCatalogSection({
  proxyModels, userAddedModels, filteredCatalogModels,
  catalogSearch, onCatalogSearchChange,
  catalogLoading, catalogLoaded, proxyCatalogCount,
  testResults, testingModel,
  massTestRunning, massTestProgress,
  onTestModel, onMassTest, onAddUserModel, onRefreshCatalog,
}: ProxyCatalogSectionProps) {
  const totalModels = proxyModels.length + userAddedModels.length;

  return (
    <AccordionItem value="catalog" className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-semibold">Каталог моделей</span>
          <Badge variant="secondary" className="ml-2">
            {totalModels}
            {catalogLoaded && <span className="text-muted-foreground ml-1">/ {proxyCatalogCount} в каталоге</span>}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 space-y-3">
        {/* Search */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={catalogSearch}
              onChange={e => onCatalogSearchChange(e.target.value)}
              placeholder={catalogLoading ? 'Загрузка каталога...' : `Поиск среди ${proxyCatalogCount} моделей ProxyAPI...`}
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

        {/* Search results */}
        {filteredCatalogModels.length > 0 && (
          <div className="border rounded-lg bg-card/50 max-h-[240px] overflow-y-auto">
            {filteredCatalogModels.map(model => (
              <div key={model.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/30 last:border-0" onClick={() => onAddUserModel(model.id)}>
                <ProxyApiLogo className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-sm truncate flex-1 font-mono">{model.id}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{model.owned_by}</Badge>
                <Plus className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
        {catalogSearch.trim() && filteredCatalogModels.length === 0 && !catalogLoading && (
          <p className="text-xs text-muted-foreground text-center py-2">Ничего не найдено среди {proxyCatalogCount} моделей</p>
        )}

        {/* User-added models */}
        {userAddedModels.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Пользовательский список ({userAddedModels.length})</p>
            {userAddedModels.map(model => (
              <UserModelRow
                key={model.id}
                model={model}
                testResult={testResults[model.id]}
                isTesting={testingModel === model.id}
                onTest={() => onTestModel(model.id)}
              />
            ))}
          </div>
        )}

        {/* ProxyAPI native models */}
        <div className="space-y-1">
          {userAddedModels.length > 0 && <p className="text-xs text-muted-foreground font-medium">ProxyAPI модели</p>}
          {proxyModels.map(model => (
            <ModelRow
              key={model.id}
              model={model}
              testResult={testResults[model.id]}
              isTesting={testingModel === model.id}
              onTest={() => onTestModel(model.id)}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ─── Sub-components ────────────────────────────────────

function UserModelRow({ model, testResult, isTesting, onTest }: {
  model: ProxyApiCatalogModel;
  testResult?: TestResult;
  isTesting: boolean;
  onTest: () => void;
}) {
  const expl = testResult ? STATUS_EXPLANATIONS[testResult.status] : null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
      <ProxyApiLogo className="h-4 w-4 flex-shrink-0" />
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

function ModelRow({ model, testResult, isTesting, onTest }: {
  model: ModelRegistryEntry;
  testResult?: TestResult;
  isTesting: boolean;
  onTest: () => void;
}) {
  const isDeprecated = model.displayName.includes('⚠️');
  const creatorProvider = model.creator.includes('OpenAI') ? 'openai'
    : model.creator.includes('Anthropic') ? 'anthropic'
    : model.creator.includes('Google') ? 'gemini'
    : model.creator.includes('DeepSeek') ? 'deepseek'
    : model.provider;

  const Logo = PROVIDER_LOGOS[creatorProvider];
  const color = PROVIDER_COLORS[creatorProvider];
  const pricing = typeof model.pricing === 'object' ? `${model.pricing.input}/${model.pricing.output}` : model.pricing;
  const testStatusExpl = testResult ? STATUS_EXPLANATIONS[testResult.status] : null;

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors", isDeprecated && "opacity-60")}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {Logo && <Logo className={cn("h-4 w-4 flex-shrink-0", color)} />}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{model.displayName}</p>
          <p className="text-xs text-muted-foreground">{pricing}</p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-1 flex-shrink-0">
        {model.strengths.slice(0, 3).map(s => (
          <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">
            {STRENGTH_LABELS[s]?.ru || s}
          </Badge>
        ))}
      </div>

      {testResult && (
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-2 flex-shrink-0 text-xs">
            {testResult.status === 'success' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{testResult.latency_ms}ms</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  <p className="text-xs">{testStatusExpl?.description}</p>
                  {testResult.tokens && <p className="text-xs text-muted-foreground mt-1">Токены: {testResult.tokens.input}/{testResult.tokens.output}</p>}
                </TooltipContent>
              </Tooltip>
            ) : testResult.status === 'gone' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <WifiOff className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-destructive">410 Gone</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <p className="text-xs">{testStatusExpl?.description}</p>
                </TooltipContent>
              </Tooltip>
            ) : testResult.status === 'timeout' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-amber-500">Таймаут</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <p className="text-xs">{testStatusExpl?.description}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-destructive truncate max-w-[100px]">{testResult.error}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px]">
                  <p className="text-xs font-medium mb-1">Ошибка</p>
                  <p className="text-xs text-muted-foreground">{testStatusExpl?.description}</p>
                  {testResult.error && <p className="text-xs text-destructive mt-1">{testResult.error}</p>}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      )}

      <Button size="sm" variant="ghost" className="flex-shrink-0 h-8 w-8 p-0" onClick={onTest} disabled={isTesting} title="Тест модели">
        {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  );
}
