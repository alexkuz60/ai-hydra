import React, { useState, useCallback } from 'react';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Zap, Play, CheckCircle, XCircle, Clock, WifiOff, RefreshCw, Search, Plus, SkipForward, Trash2, ChevronRight } from 'lucide-react';
import { ProxyApiLogo, PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { cn } from '@/lib/utils';
import { type ModelRegistryEntry, STRENGTH_LABELS } from '@/config/modelRegistry';
import type { ProxyApiCatalogModel, TestResult } from './types';
import { STATUS_EXPLANATIONS, detectModelType, MODEL_TYPE_LABELS } from './types';

interface ProxyCatalogSectionProps {
  proxyModels: ModelRegistryEntry[];
  userAddedModels: ProxyApiCatalogModel[];
  filteredCatalogModels: ProxyApiCatalogModel[];
  userModelIds: Set<string>;
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
  onRemoveUserModel: (modelId: string) => void;
  onRefreshCatalog: () => void;
}

export function ProxyCatalogSection({
  proxyModels, userAddedModels, filteredCatalogModels, userModelIds,
  catalogSearch, onCatalogSearchChange,
  catalogLoading, catalogLoaded, proxyCatalogCount,
  testResults, testingModel,
  massTestRunning, massTestProgress,
  onTestModel, onMassTest, onAddUserModel, onRemoveUserModel, onRefreshCatalog,
}: ProxyCatalogSectionProps) {
  const [userListOpen, setUserListOpen] = useState(true);
  const [nativeListOpen, setNativeListOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const totalModels = proxyModels.length + userAddedModels.length;

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBulkAdd = useCallback(() => {
    selectedIds.forEach(id => onAddUserModel(id));
    setSelectedIds(new Set());
  }, [selectedIds, onAddUserModel]);

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
        <div className="relative z-10 flex items-center gap-2 pt-1 px-0.5">
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
          <div className="space-y-2">
            <div className="border rounded-lg bg-card/50 max-h-[240px] overflow-y-auto">
              {filteredCatalogModels.map(model => (
                <label key={model.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/30 last:border-0">
                  <Checkbox
                    checked={selectedIds.has(model.id)}
                    onCheckedChange={() => toggleSelected(model.id)}
                  />
                  <ProxyApiLogo className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-sm truncate flex-1 font-mono">{model.id}</span>
                  <ModelTypeBadge modelId={model.id} />
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{model.owned_by}</Badge>
                </label>
              ))}
            </div>
            {selectedIds.size > 0 && (
              <Button size="sm" onClick={handleBulkAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить ({selectedIds.size})
              </Button>
            )}
          </div>
        )}
        {catalogSearch.trim() && filteredCatalogModels.length === 0 && !catalogLoading && (
          <p className="text-xs text-muted-foreground text-center py-2">Ничего не найдено среди {proxyCatalogCount} моделей</p>
        )}

        {/* User-added models */}
        {userAddedModels.length > 0 && (
          <Collapsible open={userListOpen} onOpenChange={setUserListOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors w-full">
              <ChevronRight className={cn("h-3 w-3 transition-transform", userListOpen && "rotate-90")} />
              Пользовательский список ({userAddedModels.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {userAddedModels.map(model => (
                <UserModelRow
                  key={model.id}
                  model={model}
                  testResult={testResults[model.id]}
                  isTesting={testingModel === model.id}
                  onTest={() => onTestModel(model.id)}
                  onRemove={() => onRemoveUserModel(model.id)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* ProxyAPI native models */}
        <Collapsible open={nativeListOpen} onOpenChange={setNativeListOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors w-full">
            <ChevronRight className={cn("h-3 w-3 transition-transform", nativeListOpen && "rotate-90")} />
            ProxyAPI модели ({proxyModels.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {proxyModels.map(model => (
          <ModelRow
                key={model.id}
                model={model}
                testResult={testResults[model.id]}
                isTesting={testingModel === model.id}
                onTest={() => onTestModel(model.id)}
                onAdd={() => onAddUserModel(model.id)}
                isAdded={userModelIds.has(model.id)}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </AccordionContent>
    </AccordionItem>
  );
}

// ─── Sub-components ────────────────────────────────────

function ModelTypeBadge({ modelId }: { modelId: string }) {
  const type = detectModelType(modelId);
  if (type === 'chat') return null; // Default, no badge needed
  const info = MODEL_TYPE_LABELS[type];
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", info.color)}>
      {info.label}
    </Badge>
  );
}

function UserModelRow({ model, testResult, isTesting, onTest, onRemove }: {
  model: ProxyApiCatalogModel;
  testResult?: TestResult;
  isTesting: boolean;
  onTest: () => void;
  onRemove: () => void;
}) {
  const modelType = detectModelType(model.id);
  const typeInfo = MODEL_TYPE_LABELS[modelType];
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-accent/30 hover:bg-accent/50 transition-colors">
      <ProxyApiLogo className="h-4 w-4 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-mono truncate">{model.id}</p>
          {modelType !== 'chat' && (
            <Badge variant="outline" className={cn("text-[9px] px-1 py-0 flex-shrink-0", typeInfo.color)}>
              {typeInfo.label}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{model.owned_by}</p>
      </div>
      {testResult && <TestStatusIcon testResult={testResult} />}
      <Button size="sm" variant="ghost" className="flex-shrink-0 h-8 w-8 p-0" onClick={onTest} disabled={isTesting} title="Тест модели">
        {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button size="sm" variant="ghost" className="flex-shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={onRemove} title="Удалить из списка">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Shared test status icon with tooltip
function TestStatusIcon({ testResult }: { testResult: TestResult }) {
  const expl = STATUS_EXPLANATIONS[testResult.status];
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help text-xs">
            {testResult.status === 'success' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              : testResult.status === 'skipped' ? <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />
              : testResult.status === 'gone' ? <WifiOff className="h-3.5 w-3.5 text-destructive" />
              : testResult.status === 'timeout' ? <Clock className="h-3.5 w-3.5 text-amber-500" />
              : <XCircle className="h-3.5 w-3.5 text-destructive" />}
            {testResult.status === 'skipped'
              ? <span className="text-muted-foreground truncate max-w-[80px]">N/A</span>
              : <span className={testResult.status === 'success' ? 'text-emerald-400' : testResult.status === 'timeout' ? 'text-amber-500' : 'text-destructive'}>
                  {testResult.latency_ms > 0 ? `${testResult.latency_ms}ms` : testResult.error || testResult.status}
                </span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px]">
          <p className="text-xs">{testResult.message || expl?.description || testResult.error}</p>
          {testResult.model_type && <p className="text-xs text-muted-foreground mt-1">Тип: {MODEL_TYPE_LABELS[testResult.model_type]?.label || testResult.model_type}</p>}
          {testResult.tokens && (testResult.tokens.input > 0 || testResult.tokens.output > 0) && (
            <p className="text-xs text-muted-foreground mt-1">Токены: {testResult.tokens.input}/{testResult.tokens.output}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ModelRow({ model, testResult, isTesting, onTest, onAdd, isAdded }: {
  model: ModelRegistryEntry;
  testResult?: TestResult;
  isTesting: boolean;
  onTest: () => void;
  onAdd: () => void;
  isAdded: boolean;
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

      {testResult && <TestStatusIcon testResult={testResult} />}

      <Button size="sm" variant="ghost" className="flex-shrink-0 h-8 w-8 p-0" onClick={onTest} disabled={isTesting} title="Тест модели">
        {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      </Button>
      {!isAdded && (
        <Button size="sm" variant="ghost" className="flex-shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-primary" onClick={onAdd} title="Добавить в пользовательский список">
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
