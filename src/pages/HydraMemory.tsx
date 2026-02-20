import React, { useState, useCallback } from 'react';
import { BrainCircuit, Database, Layers, BookOpen, HardDrive, GitBranch, TrendingUp, ScrollText, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHydraMemoryStats } from '@/hooks/useHydraMemoryStats';
import { useUserRoles } from '@/hooks/useUserRoles';
import {
  SessionMemoryTab,
  RoleMemoryTab,
  KnowledgeTab,
  RagDashboardTab,
  StorageTab,
  CognitiveArsenalTab,
  DualGraphsTab,
  ChroniclesTab,
} from '@/components/memory';

const HYDRA_MEMORY_TAB_KEY = 'hydra-memory-active-tab';
const VALID_TABS = ['arsenal', 'session', 'role', 'knowledge', 'graphs', 'storage', 'rag', 'chronicles'];

export default function HydraMemory() {
  const { t, language } = useLanguage();
  const stats = useHydraMemoryStats();
  const { isSupervisor } = useUserRoles();

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(HYDRA_MEMORY_TAB_KEY);
      if (saved && VALID_TABS.includes(saved)) return saved;
    } catch {}
    return 'arsenal';
  });

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    try { localStorage.setItem(HYDRA_MEMORY_TAB_KEY, tab); } catch {}
  }, []);

  return (
    <Layout>
      <div className="flex flex-col gap-6 p-6 lg:p-8 w-full h-full min-h-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2.5 bg-hydra-memory/12 border border-hydra-memory/30">
              <BrainCircuit className="h-6 w-6 text-hydra-memory" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('memory.hub.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('memory.hub.subtitle')}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={stats.refresh} className="shrink-0" title={t('memory.hub.refreshLabel')}>
            <RefreshCw className={`h-4 w-4 ${stats.loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start flex-wrap gap-1 h-auto">
            <TabsTrigger value="arsenal" className="gap-2">
              <BrainCircuit className="h-3.5 w-3.5" />
              {language === 'ru' ? 'Арсенал' : 'Arsenal'}
            </TabsTrigger>
            <TabsTrigger value="session" className="gap-2">
              <Database className="h-3.5 w-3.5" />
              {t('memory.hub.session')}
              <Badge variant="secondary" className="ml-1 text-xs">{stats.sessionMemory.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="role" className="gap-2">
              <Layers className="h-3.5 w-3.5" />
              {t('memory.hub.roleMemory')}
              <Badge variant="secondary" className="ml-1 text-xs">{stats.totalRoleMemory}</Badge>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              {t('memory.hub.knowledge')}
              <Badge variant="secondary" className="ml-1 text-xs">{stats.totalKnowledge}</Badge>
            </TabsTrigger>
            <TabsTrigger value="graphs" className="gap-2">
              <GitBranch className="h-3.5 w-3.5" />
              {language === 'ru' ? 'Графы памяти и связей' : 'Memory & Connections Graphs'}
            </TabsTrigger>
            <TabsTrigger value="storage" className="gap-2">
              <HardDrive className="h-3.5 w-3.5" />
              {t('memory.hub.storage')}
            </TabsTrigger>
            <TabsTrigger value="rag" className="gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              {t('memory.hub.ragDashboard')}
            </TabsTrigger>
            <TabsTrigger value="chronicles" className="gap-2 text-hydra-arbiter data-[state=active]:text-hydra-arbiter">
              <ScrollText className="h-3.5 w-3.5" />
              {language === 'ru' ? 'Хроники Эволюции' : 'Evolution Chronicles'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arsenal" className="mt-6">
            <CognitiveArsenalTab stats={stats} />
          </TabsContent>
          <TabsContent value="session" className="mt-6">
            <SessionMemoryTab stats={stats} loading={stats.loading} />
          </TabsContent>
          <TabsContent value="role" className="mt-6">
            <RoleMemoryTab stats={stats} loading={stats.loading} onRefresh={stats.refresh} />
          </TabsContent>
          <TabsContent value="knowledge" className="mt-6">
            <KnowledgeTab stats={stats} loading={stats.loading} />
          </TabsContent>
          <TabsContent value="graphs" className="mt-4">
            <DualGraphsTab stats={stats} />
          </TabsContent>
          <TabsContent value="storage" className="mt-6">
            <StorageTab />
          </TabsContent>
          <TabsContent value="rag" className="mt-6">
            <RagDashboardTab />
          </TabsContent>
          <TabsContent value="chronicles" className="mt-6">
            <ChroniclesTab language={language} isSupervisor={isSupervisor} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
