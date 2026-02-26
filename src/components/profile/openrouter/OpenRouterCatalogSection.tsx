import React, { useState, useCallback } from 'react';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Zap, Play, CheckCircle, XCircle, Clock, WifiOff, RefreshCw, Search, Plus, Trash2, ChevronRight, Globe } from 'lucide-react';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { cn } from '@/lib/utils';
import type { ModelOption } from '@/hooks/useAvailableModels';
import type { TestResult, ProxyApiCatalogModel } from '../proxyapi/types';
import { getStatusExpl } from '../proxyapi/types';

interface OpenRouterCatalogSectionProps {
  registryModels: ModelOption[];
  userAddedModels: ProxyApiCatalogModel[];
  filteredCatalogModels: { id: string; name: string }[];
  userModelIds: Set<string>;
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
  onRemoveUserModel: (modelId: string) => void;
  onRefreshCatalog: () => void;
  language: string;
}

export function OpenRouterCatalogSection({
  registryModels, userAddedModels, filteredCatalogModels, userModelIds,
  catalogSearch, onCatalogSearchChange,
  catalogLoading, catalogLoaded, catalogCount,
  testResults, testingModel,
  massTestRunning, massTestProgress,
  onTestModel, onMassTest, onAddUserModel, onRemoveUserModel, onRefreshCatalog,
  language,
}: OpenRouterCatalogSectionProps) {
  const isRu = language === 'ru';
  const lang = isRu ? 'ru' : 'en';
  const [userListOpen, setUserListOpen] = useState(true);
  const [nativeListOpen, setNativeListOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const totalModels = registryModels.length + userAddedModels.length;

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
          <span className="font-semibold">{isRu ? 'Каталог моделей' : 'Model Catalog'}</span>
          <Badge variant="secondary" className="ml-2">
            {totalModels}
            {catalogLoaded && <span className="text-muted-foreground ml-1">/ {catalogCount} {isRu ? 'в каталоге' : 'in catalog'}</span>}
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
              placeholder={catalogLoading
                ? (isRu ? 'Загрузка каталога...' : 'Loading catalog...')
                : (isRu ? `Поиск среди ${catalogCount} моделей OpenRouter...` : `Search ${catalogCount} OpenRouter models...`)}
              className="pl-9 focus-visible:ring-offset-0"
              disabled={catalogLoading}
            />
            {catalogLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <Button variant="outline" size="icon" onClick={onRefreshCatalog} disabled={catalogLoading} title={isRu ? 'Обновить каталог' : 'Refresh catalog'}>
            <RefreshCw className={cn("h-4 w-4", catalogLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Search results */}
        {filteredCatalogModels.length > 0 && (
          <div className="space-y-2">
            <div className="border rounded-lg bg-card/50 max-h-[240px] overflow-y-auto">
              {filteredCatalogModels.map(model => (
                <label key={model.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/30 last:border-0">
                  <Checkbox checked={selectedIds.has(model.id)} onCheckedChange={() => toggleSelected(model.id)} />
                  <Globe className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  <span className="text-sm truncate flex-1 font-mono">{model.id}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">{model.name}</span>
                </label>
              ))}
            </div>
            {selectedIds.size > 0 && (
              <Button size="sm" onClick={handleBulkAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                {isRu ? 'Добавить' : 'Add'} ({selectedIds.size})
              </Button>
            )}
          </div>
        )}
        {catalogSearch.trim() && filteredCatalogModels.length === 0 && !catalogLoading && (
          <p className="text-xs text-muted-foreground text-center py-2">
            {isRu ? `Ничего не найдено среди ${catalogCount} моделей` : `No results among ${catalogCount} models`}
          </p>
        )}

        {/* User-added models */}
        {userAddedModels.length > 0 && (
          <Collapsible open={userListOpen} onOpenChange={setUserListOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors w-full">
              <ChevronRight className={cn("h-3 w-3 transition-transform", userListOpen && "rotate-90")} />
              {isRu ? 'Пользовательский список' : 'User list'} ({userAddedModels.length})
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
                  lang={lang}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Mass test */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onMassTest} disabled={massTestRunning || totalModels === 0} className="gap-2">
            {massTestRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {massTestRunning
              ? (isRu ? `Тестирование ${massTestProgress.done}/${massTestProgress.total}...` : `Testing ${massTestProgress.done}/${massTestProgress.total}...`)
              : (isRu ? `Тест всех моделей (${totalModels})` : `Test all models (${totalModels})`)}
          </Button>
          {massTestRunning && (
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${massTestProgress.total ? (massTestProgress.done / massTestProgress.total) * 100 : 0}%` }} />
            </div>
          )}
        </div>

        {/* Registry models */}
        <Collapsible open={nativeListOpen} onOpenChange={setNativeListOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors w-full">
            <ChevronRight className={cn("h-3 w-3 transition-transform", nativeListOpen && "rotate-90")} />
            {isRu ? 'Модели OpenRouter' : 'OpenRouter models'} ({registryModels.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {registryModels.map(model => (
              <RegistryModelRow
                key={model.id}
                model={model}
                testResult={testResults[model.id]}
                isTesting={testingModel === model.id}
                onTest={() => onTestModel(model.id)}
                onAdd={() => onAddUserModel(model.id)}
                isAdded={userModelIds.has(model.id)}
                lang={lang}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </AccordionContent>
    </AccordionItem>
  );
}

// ─── Sub-components ────────────────────────────────────

function TestStatusIcon({ testResult, lang }: { testResult: TestResult; lang: 'ru' | 'en' }) {
  const expl = getStatusExpl(testResult.status, lang);
  const isRu = lang === 'ru';
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help text-xs">
            {testResult.status === 'success' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              : testResult.status === 'gone' ? <WifiOff className="h-3.5 w-3.5 text-destructive" />
              : testResult.status === 'timeout' ? <Clock className="h-3.5 w-3.5 text-amber-500" />
              : <XCircle className="h-3.5 w-3.5 text-destructive" />}
            <span className={testResult.status === 'success' ? 'text-emerald-400' : testResult.status === 'timeout' ? 'text-amber-500' : 'text-destructive'}>
              {testResult.latency_ms > 0 ? `${testResult.latency_ms}ms` : testResult.error || testResult.status}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px]">
          <p className="text-xs">{testResult.message || expl?.description || testResult.error}</p>
          {testResult.tokens && (testResult.tokens.input > 0 || testResult.tokens.output > 0) && (
            <p className="text-xs text-muted-foreground mt-1">{isRu ? 'Токены' : 'Tokens'}: {testResult.tokens.input}/{testResult.tokens.output}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function UserModelRow({ model, testResult, isTesting, onTest, onRemove, lang }: {
  model: ProxyApiCatalogModel;
  testResult?: TestResult;
  isTesting: boolean;
  onTest: () => void;
  onRemove: () => void;
  lang: 'ru' | 'en';
}) {
  const isRu = lang === 'ru';
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-accent/30 hover:bg-accent/50 transition-colors">
      <Globe className="h-4 w-4 flex-shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-mono truncate">{model.id}</p>
        <p className="text-xs text-muted-foreground">{model.owned_by}</p>
      </div>
      {testResult && <TestStatusIcon testResult={testResult} lang={lang} />}
      <Button size="sm" variant="ghost" className="flex-shrink-0 h-8 w-8 p-0" onClick={onTest} disabled={isTesting} title={isRu ? 'Тест модели' : 'Test model'}>
        {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button size="sm" variant="ghost" className="flex-shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={onRemove} title={isRu ? 'Удалить из списка' : 'Remove from list'}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function RegistryModelRow({ model, testResult, isTesting, onTest, onAdd, isAdded, lang }: {
  model: ModelOption;
  testResult?: TestResult;
  isTesting: boolean;
  onTest: () => void;
  onAdd: () => void;
  isAdded: boolean;
  lang: 'ru' | 'en';
}) {
  const isRu = lang === 'ru';
  const isFree = model.id.includes(':free');
  const providerKey = model.id.includes('openai/') ? 'openai'
    : model.id.includes('anthropic/') ? 'anthropic'
    : model.id.includes('google/') ? 'gemini'
    : model.id.includes('deepseek/') ? 'deepseek'
    : model.id.includes('meta-llama/') ? 'groq'
    : model.provider;

  const Logo = PROVIDER_LOGOS[providerKey];
  const color = PROVIDER_COLORS[providerKey];

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {Logo && <Logo className={cn("h-4 w-4 flex-shrink-0", color)} />}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium truncate">{model.name}</p>
            <Badge variant={isFree ? 'secondary' : 'outline'} className="text-[10px] px-1 py-0 h-4 flex-shrink-0">
              {isFree ? 'free' : '💎 paid'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono truncate">{model.id}</p>
        </div>
      </div>

      {testResult && <TestStatusIcon testResult={testResult} lang={lang} />}

      <Button size="sm" variant="ghost" className="flex-shrink-0 h-8 w-8 p-0" onClick={onTest} disabled={isTesting} title={isRu ? 'Тест модели' : 'Test model'}>
        {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      </Button>
      {!isAdded && (
        <Button size="sm" variant="ghost" className="flex-shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-primary" onClick={onAdd} title={isRu ? 'Добавить в список' : 'Add to list'}>
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
