import React, { useState, useMemo, useCallback } from 'react';
import {
  BookOpen, Database, Layers, Trash2, Loader2,
  Copy, Wrench, BarChart2, ScanSearch, Clock,
  CheckCircle2, AlertTriangle, Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROLE_CONFIG } from '@/config/roles';
import type { useHydraMemoryStats } from '@/hooks/useHydraMemoryStats';
import { StatCard, KNOWLEDGE_CATEGORY_LABELS } from './shared';

interface KnowledgeEntryRaw {
  id: string;
  content: string;
  source_title: string | null;
  source_url: string | null;
  category: string;
  version: string | null;
  chunk_index: number;
  embedding: unknown;
}

export function KnowledgeTab({ stats, loading }: { stats: ReturnType<typeof useHydraMemoryStats>; loading: boolean }) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [similarGroups, setSimilarGroups] = useState<KnowledgeEntryRaw[][]>([]);
  const [outdatedGroups, setOutdatedGroups] = useState<KnowledgeEntryRaw[][]>([]);
  const [qualityStats, setQualityStats] = useState<{ avgWords: number; noEmbedding: number; total: number } | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [scanDone, setScanDone] = useState(false);
  const [generatingEmbeddings, setGeneratingEmbeddings] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState<{ done: number; total: number } | null>(null);
  // Keep raw rows for embedding generation
  const [rawRows, setRawRows] = useState<KnowledgeEntryRaw[]>([]);

  const roleGroups = stats.knowledge.reduce<Record<string, { category: string; count: number }[]>>((acc, k) => {
    if (!acc[k.role]) acc[k.role] = [];
    acc[k.role].push({ category: k.category, count: k.count });
    return acc;
  }, {});

  const runScan = useCallback(async () => {
    if (!user?.id) return;
    setScanning(true);
    setScanDone(false);
    try {
      const { data, error } = await supabase
        .from('role_knowledge')
        .select('id, content, source_title, source_url, category, version, chunk_index, embedding')
        .eq('user_id', user.id);
      if (error) throw error;
      const rows = (data || []) as KnowledgeEntryRaw[];
      setRawRows(rows);

      const wordCounts = rows.map(r => r.content.trim().split(/\s+/).length);
      const avgWords = rows.length ? wordCounts.reduce((a, b) => a + b, 0) / rows.length : 0;
      const noEmbedding = rows.filter(r => !r.embedding).length;
      setQualityStats({ avgWords: Math.round(avgWords), noEmbedding, total: rows.length });

      const contentMap = new Map<string, KnowledgeEntryRaw[]>();
      rows.forEach(r => {
        const key = r.content.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 200);
        const arr = contentMap.get(key) || [];
        arr.push(r);
        contentMap.set(key, arr);
      });
      setSimilarGroups(Array.from(contentMap.values()).filter(g => g.length > 1));

      const sourceMap = new Map<string, KnowledgeEntryRaw[]>();
      rows.forEach(r => {
        if (r.source_url) {
          const key = r.source_url;
          const arr = sourceMap.get(key) || [];
          arr.push(r);
          sourceMap.set(key, arr);
        }
      });
      const outdated: KnowledgeEntryRaw[][] = [];
      sourceMap.forEach(group => {
        const withVersion = group.filter(r => r.version);
        if (withVersion.length < 2) return;
        const sorted = [...withVersion].sort((a, b) => (b.version || '').localeCompare(a.version || ''));
        const latestVersion = sorted[0].version;
        const old = group.filter(r => r.version && r.version !== latestVersion);
        if (old.length > 0) outdated.push(old);
      });
      setOutdatedGroups(outdated);
      setScanDone(true);
    } catch (e) {
      console.error('[KnowledgeTab] scan error', e);
      toast.error(t('memory.hub.scanError'));
    } finally {
      setScanning(false);
    }
  }, [user?.id, t]);

  const deleteEntries = useCallback(async (ids: string[]) => {
    if (!user?.id || ids.length === 0) return;
    setDeletingIds(prev => { const s = new Set(prev); ids.forEach(id => s.add(id)); return s; });
    try {
      const { error } = await supabase
        .from('role_knowledge')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success(`${t('memory.hub.deleteSuccess')} ${ids.length} ${t('memory.hub.deleteRecords')}`);
      await runScan();
      stats.refresh();
    } catch {
      toast.error(t('memory.hub.deleteError'));
    } finally {
      setDeletingIds(new Set());
    }
  }, [user?.id, runScan, stats, t]);

  const allSimilarToDelete = useMemo(() =>
    similarGroups.flatMap(g => g.slice(1).map(r => r.id)), [similarGroups]);
  const allOutdatedToDelete = useMemo(() =>
    outdatedGroups.flatMap(g => g.map(r => r.id)), [outdatedGroups]);

  const generateEmbeddings = useCallback(async () => {
    if (!user?.id) return;
    const noEmbRows = rawRows.filter(r => !r.embedding);
    if (noEmbRows.length === 0) return;

    setGeneratingEmbeddings(true);
    setEmbeddingProgress({ done: 0, total: noEmbRows.length });
    const BATCH = 10;
    let done = 0;

    try {
      for (let i = 0; i < noEmbRows.length; i += BATCH) {
        const batch = noEmbRows.slice(i, i + BATCH);
        const texts = batch.map(r => r.content);

        const resp = await supabase.functions.invoke('generate-embeddings', {
          body: { texts },
        });

        if (resp.error) {
          console.error('[KnowledgeTab] Embedding batch error:', resp.error);
          continue;
        }

        const embeddings = resp.data?.embeddings as (number[] | null)[];
        if (!embeddings) continue;

        // Save embeddings to DB
        for (let j = 0; j < batch.length; j++) {
          if (embeddings[j]) {
            await supabase
              .from('role_knowledge')
              .update({ embedding: JSON.stringify(embeddings[j]) } as any)
              .eq('id', batch[j].id)
              .eq('user_id', user.id);
          }
        }

        done += batch.length;
        setEmbeddingProgress({ done, total: noEmbRows.length });
      }

      toast.success(`${t('memory.hub.embeddingsGenerated')}: ${done}/${noEmbRows.length}`);
      await runScan();
      stats.refresh();
    } catch (e) {
      console.error('[KnowledgeTab] embedding error', e);
      toast.error(t('memory.hub.embeddingsError'));
    } finally {
      setGeneratingEmbeddings(false);
      setEmbeddingProgress(null);
    }
  }, [user?.id, rawRows, runScan, stats, t]);

  const isRu = language === 'ru';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />) : (
          <>
            <StatCard label={t('memory.hub.knowledgeChunks')} value={stats.totalKnowledge} icon={BookOpen} accent />
            <StatCard label={t('memory.hub.rolesWithKnowledge')} value={Object.keys(roleGroups).length} icon={Database} />
            <StatCard label={t('memory.hub.categories')} value={new Set(stats.knowledge.map(k => k.category)).size} icon={Layers} />
          </>
        )}
      </div>

      {/* Deduplication Tools Panel */}
      <Card className="border-[hsl(var(--hydra-memory)/0.25)] bg-[hsl(var(--hydra-memory)/0.03)]">
        <button
          onClick={() => { setToolsOpen(o => !o); if (!toolsOpen && !scanDone) runScan(); }}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-[hsl(var(--hydra-memory))]" />
            <span className="text-base font-medium">{t('memory.hub.cleanupTools')}</span>
            {scanDone && (similarGroups.length > 0 || outdatedGroups.length > 0) && (
              <Badge variant="outline" className="text-sm text-amber-400 border-amber-500/40">
                {similarGroups.length + outdatedGroups.length} {t('memory.hub.problems')}
              </Badge>
            )}
          </div>
          <span className={`text-muted-foreground transition-transform text-sm ${toolsOpen ? 'rotate-90' : ''}`}>›</span>
        </button>

        <AnimatePresence>
          {toolsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t('memory.hub.cleanupToolsDesc')}</p>
                  <Button size="sm" variant="outline" onClick={runScan} disabled={scanning} className="h-8 gap-1.5">
                    {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                    {scanning ? t('memory.hub.scanning') : t('memory.hub.scan')}
                  </Button>
                </div>

                {scanDone && qualityStats && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                      <BarChart2 className="h-5 w-5 mx-auto mb-1 text-[hsl(var(--hydra-memory))]" />
                      <p className="text-xl font-bold">{qualityStats.avgWords}</p>
                      <p className="text-xs text-muted-foreground">{t('memory.hub.avgWordsChunk')}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                      <Copy className="h-5 w-5 mx-auto mb-1 text-amber-400" />
                      <p className="text-xl font-bold text-amber-400">{similarGroups.length}</p>
                      <p className="text-xs text-muted-foreground">{t('memory.hub.similarGroups')}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-orange-400" />
                      <p className="text-xl font-bold text-orange-400">{allOutdatedToDelete.length}</p>
                      <p className="text-xs text-muted-foreground">{t('memory.hub.outdated')}</p>
                    </div>
                  </div>
                )}

                {scanDone && qualityStats && qualityStats.noEmbedding > 0 && (
                  <div className="flex items-center justify-between gap-2 text-sm text-amber-500 bg-amber-500/10 rounded-lg px-3 py-2 border border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>
                        {qualityStats.noEmbedding} {t('memory.hub.noEmbeddingWarning')}
                        {embeddingProgress && ` (${embeddingProgress.done}/${embeddingProgress.total})`}
                      </span>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      className="h-7 text-xs border-hydra-expert/40 text-hydra-expert hover:bg-hydra-expert/10 shrink-0"
                      disabled={generatingEmbeddings}
                      onClick={generateEmbeddings}
                    >
                      {generatingEmbeddings ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                      {generatingEmbeddings ? t('memory.hub.generatingEmbeddings') : t('memory.hub.generateEmbeddings')}
                    </Button>
                  </div>
                )}

                {scanDone && similarGroups.length === 0 && outdatedGroups.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 rounded-lg px-3 py-2 border border-green-500/20">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{t('memory.hub.cleanResult')}</span>
                  </div>
                )}

                {scanDone && similarGroups.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-amber-400 flex items-center gap-1.5">
                        <Copy className="h-4 w-4" />
                        {t('memory.hub.similarChunks')} ({similarGroups.length} {t('memory.hub.groups')}, {allSimilarToDelete.length} {t('memory.hub.duplicates')})
                      </p>
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                        disabled={deletingIds.size > 0}
                        onClick={() => deleteEntries(allSimilarToDelete)}
                      >
                        {deletingIds.size > 0 ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                        {t('memory.hub.deleteAllDuplicates')}
                      </Button>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {similarGroups.map((group, gi) => (
                        <div key={gi} className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-amber-400 font-medium">{group.length} {t('memory.hub.copies')}</span>
                            <Button
                              size="sm" variant="ghost"
                              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                              disabled={deletingIds.size > 0}
                              onClick={() => deleteEntries(group.slice(1).map(r => r.id))}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              {t('memory.hub.delete')} {group.length - 1}
                            </Button>
                          </div>
                          <p className="text-muted-foreground line-clamp-1">{group[0].content.slice(0, 120)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scanDone && outdatedGroups.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-orange-400 flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {t('memory.hub.outdatedVersions')} ({allOutdatedToDelete.length} {t('memory.hub.chunks')})
                      </p>
                       <Button
                         size="sm" variant="outline"
                         className="h-7 text-xs border-hydra-webhunter/40 text-hydra-webhunter hover:bg-hydra-webhunter/10"
                        disabled={deletingIds.size > 0}
                        onClick={() => deleteEntries(allOutdatedToDelete)}
                      >
                        {deletingIds.size > 0 ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                        {t('memory.hub.deleteOutdated')}
                      </Button>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {outdatedGroups.map((group, gi) => (
                         <div key={gi} className="rounded border border-hydra-webhunter/20 bg-hydra-webhunter/5 px-3 py-2 text-sm">
                           <div className="flex items-center justify-between">
                             <span className="text-muted-foreground truncate">{group[0].source_url}</span>
                             <span className="text-hydra-webhunter ml-2 shrink-0">{group.map(r => r.version).join(', ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {!loading && stats.totalKnowledge === 0 && (
        <div className="text-center py-12 text-muted-foreground text-base">{t('memory.hub.empty')}</div>
      )}
      <div className="space-y-3">
        {Object.entries(roleGroups).map(([role, categories]) => {
          const rc = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
          const roleLabel = rc ? t(rc.label) : role;
          return (
          <Card key={role}>
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-base">{roleLabel}</CardTitle></CardHeader>
            <CardContent className="pb-3 px-4 flex flex-wrap gap-2">
              {categories.map(({ category, count }) => {
                const catLabel = KNOWLEDGE_CATEGORY_LABELS[category]?.[isRu ? 'ru' : 'en'] ?? category;
                return (
                  <Badge key={category} variant="outline" className="text-sm gap-1.5">
                    {catLabel} <span className="font-bold text-hydra-memory">{count}</span>
                  </Badge>
                );
              })}
            </CardContent>
          </Card>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to="/staff-roles">{t('memory.hub.goToStaff')}</Link>
        </Button>
      </div>
    </div>
  );
}
