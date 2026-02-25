import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TrendingUp, Search, Loader2, ExternalLink, ChevronDown, ChevronRight, Globe, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SearchResult {
  url: string;
  title: string;
  description: string;
  markdown?: string;
}

interface ConceptTrendResearchProps {
  planTitle: string;
  planGoal: string;
  className?: string;
}

export function ConceptTrendResearch({ planTitle, planGoal, className }: ConceptTrendResearchProps) {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const generateQuery = () => {
    // Use only the plan title (trimmed), not the full goal text — keeps query short and effective
    const title = (planTitle || '').replace(/^ПСРЗ\s*«|»$/g, '').trim();
    const suffix = language === 'ru' ? ' тренды рынок 2025' : ' trends market 2025';
    setQuery((title + suffix).substring(0, 120).trim());
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setHasSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-search', {
        body: {
          query: query.trim(),
          options: {
            limit: 8,
            lang: language === 'ru' ? 'ru' : 'en',
            tbs: 'qdr:y',
          },
        },
      });

      if (error) throw error;
      if (!data?.success && data?.error) throw new Error(data.error);

      const items: SearchResult[] = (data?.data || []).map((r: any) => ({
        url: r.url || '',
        title: r.title || r.url || '',
        description: r.description || '',
        markdown: r.markdown || '',
      }));

      setResults(items);
      if (items.length === 0) {
        toast.info(t('trends.noResults'));
      }
    } catch (err: any) {
      console.error('Trend search error:', err);
      toast.error(err.message || t('trends.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-orange-500" />
        {t('trends.title')}
      </h3>
      <p className="text-xs text-muted-foreground/70">
        {t('trends.description')}
      </p>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('trends.placeholder')}
            className="pr-10 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {!query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={generateQuery}
              title={t('trends.autoQuery')}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </Button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          size="sm"
          className="gap-2 shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {t('trends.search')}
        </Button>
      </div>

      {results.length > 0 && (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {results.map((result, idx) => (
              <Collapsible
                key={idx}
                open={expandedIdx === idx}
                onOpenChange={(open) => setExpandedIdx(open ? idx : null)}
              >
                <div className="rounded-lg border bg-card/50 overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full text-left p-3 hover:bg-muted/30 transition-colors flex items-start gap-2">
                      {expandedIdx === idx ? (
                        <ChevronDown className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                          <span className="text-sm font-medium truncate">{result.title}</span>
                        </div>
                        {result.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 pt-1 border-t space-y-2">
                      {result.markdown && (
                        <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto bg-muted/20 rounded p-2">
                          {result.markdown.substring(0, 1500)}
                          {result.markdown.length > 1500 && '...'}
                        </div>
                      )}
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {result.url.length > 60 ? result.url.substring(0, 60) + '...' : result.url}
                      </a>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      )}

      {hasSearched && results.length === 0 && !loading && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          {t('trends.noResults')}
        </div>
      )}
    </section>
  );
}
