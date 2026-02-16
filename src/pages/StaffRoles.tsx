import React, { useState, useMemo, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ResizablePanelGroup, ResizablePanel, ResizableHandle,
} from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, Users, Settings, ChevronDown, ChevronRight, Sparkles, Loader2, Cpu, ClipboardCheck } from 'lucide-react';
import { CloudSyncIndicator } from '@/components/ui/CloudSyncIndicator';
import { useCloudSyncStatus } from '@/hooks/useCloudSettings';
import { ROLE_CONFIG, AGENT_ROLES, type AgentRole } from '@/config/roles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import RoleDetailsPanel from '@/components/staff/RoleDetailsPanel';
import { InterviewPanel } from '@/components/staff/InterviewPanel';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useNavigatorResize } from '@/hooks/useNavigatorResize';
import { NavigatorHeader } from '@/components/layout/NavigatorHeader';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { getTechRoleDefaultModel } from '@/hooks/useTechRoleDefaults';
import { getModelShortName } from '@/components/warroom/permodel/types';

const StaffRoles = () => {
  const { t, language } = useLanguage();
  const cloudSynced = useCloudSyncStatus();
  const [selectedRole, setSelectedRole] = useState<AgentRole | null>(null);
  const [expertsExpanded, setExpertsExpanded] = useState(true);
  const [technicalExpanded, setTechnicalExpanded] = useState(true);
  const [isBulkSeeding, setIsBulkSeeding] = useState(false);
  const [interviewRole, setInterviewRole] = useState<AgentRole | null>(() => {
    try {
      const stored = localStorage.getItem('hydra-interview-panel-role');
      return stored ? (stored as AgentRole) : null;
    } catch { return null; }
  });

  const [interviewPanelSize, setInterviewPanelSize] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('hydra-interview-panel-size');
      return stored ? parseFloat(stored) : 30;
    } catch { return 30; }
  });

  // Persist interview panel state
  React.useEffect(() => {
    try {
      if (interviewRole) localStorage.setItem('hydra-interview-panel-role', interviewRole);
      else localStorage.removeItem('hydra-interview-panel-role');
    } catch { /* ignore */ }
  }, [interviewRole]);

  React.useEffect(() => {
    try { localStorage.setItem('hydra-interview-panel-size', String(interviewPanelSize)); } catch { /* ignore */ }
  }, [interviewPanelSize]);

  const unsavedChanges = useUnsavedChanges();
  const nav = useNavigatorResize({ storageKey: 'staff-roles', defaultMaxSize: 35 });

  const handleOpenInterview = useCallback((role: AgentRole) => {
    setInterviewRole(role);
  }, []);

  // Sync interview panel with selected role
  React.useEffect(() => {
    if (interviewRole && selectedRole && interviewRole !== selectedRole) {
      setInterviewRole(selectedRole);
    }
  }, [selectedRole]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCloseInterview = useCallback(() => {
    setInterviewRole(null);
  }, []);

  // Группируем роли на экспертов и технический персонал
  const { expertRoles, technicalRoles } = useMemo(() => {
    const experts: AgentRole[] = [];
    const technical: AgentRole[] = [];
    AGENT_ROLES.forEach((role) => {
      if (ROLE_CONFIG[role].isTechnicalStaff) {
        technical.push(role);
      } else {
        experts.push(role);
      }
    });
    return { expertRoles: experts, technicalRoles: technical };
  }, []);

  const handleRoleSelect = useCallback((role: AgentRole) => {
    if (role === selectedRole) return;
    if (unsavedChanges.hasUnsavedChanges) {
      unsavedChanges.withConfirmation(() => setSelectedRole(role));
    } else {
      setSelectedRole(role);
    }
  }, [selectedRole, unsavedChanges]);

  const handleHasUnsavedChanges = useCallback((hasChanges: boolean) => {
    unsavedChanges.setHasUnsavedChanges(hasChanges);
  }, [unsavedChanges]);

  const handleBulkSeed = useCallback(async () => {
    setIsBulkSeeding(true);
    let totalSeeded = 0;
    let rolesProcessed = 0;
    let skipped = 0;

    try {
      for (const role of technicalRoles) {
        const { data, error } = await supabase.functions.invoke('seed-role-knowledge', {
          body: { role, include_system_prompt: true, force: false },
        });
        if (error) { console.error(`[BulkSeed] Error for ${role}:`, error); continue; }
        if (data?.skipped) { skipped++; }
        else if (data?.seeded > 0) { totalSeeded += data.seeded; rolesProcessed++; }
      }

      if (totalSeeded > 0) {
        toast.success(
          language === 'ru'
            ? `Загружено ${totalSeeded} фрагментов для ${rolesProcessed} ролей${skipped > 0 ? ` (${skipped} пропущено)` : ''}`
            : `Loaded ${totalSeeded} chunks for ${rolesProcessed} roles${skipped > 0 ? ` (${skipped} skipped)` : ''}`
        );
      } else if (skipped === technicalRoles.length) {
        toast.info(
          language === 'ru'
            ? 'Все техроли уже имеют знания. Используйте пересидинг на вкладке роли.'
            : 'All tech roles already have knowledge. Use re-seed in role tab.'
        );
      } else {
        toast.info(language === 'ru' ? 'Нет новых знаний для загрузки' : 'No new knowledge to load');
      }
    } catch (error) {
      console.error('[BulkSeed] Error:', error);
      toast.error(language === 'ru' ? 'Ошибка массовой загрузки' : 'Bulk seed failed');
    } finally {
      setIsBulkSeeding(false);
    }
  }, [language, technicalRoles]);

  const renderRoleRow = useCallback((role: AgentRole) => {
    const config = ROLE_CONFIG[role];
    const IconComponent = config.icon;
    const isSelected = selectedRole === role;
    const defaultModel = config.isTechnicalStaff ? getTechRoleDefaultModel(role) : null;

    return (
      <TableRow
        key={role}
        className={cn(
          "cursor-pointer transition-colors",
          isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/30"
        )}
        onClick={() => handleRoleSelect(role)}
      >
        <TableCell className="pl-8">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", `bg-${config.color.replace('text-', '')}/10`)}>
            <IconComponent className={cn("h-5 w-5", config.color)} />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={cn("font-medium", config.color)}>{t(config.label)}</span>
              {isSelected && unsavedChanges.hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-hydra-warning animate-pulse-glow shrink-0" title="Unsaved changes" />
              )}
              {config.isTechnicalStaff && (
                <Badge variant="secondary" className="gap-1 text-xs py-0">
                  <Wrench className="h-3 w-3" />
                </Badge>
              )}
              {defaultModel && (
                <Badge variant="outline" className="gap-1 text-[10px] py-0 font-mono text-muted-foreground">
                  <Cpu className="h-2.5 w-2.5" />
                  {getModelShortName(defaultModel)}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-mono">{role}</span>
          </div>
        </TableCell>
      </TableRow>
    );
  }, [selectedRole, unsavedChanges.hasUnsavedChanges, handleRoleSelect, t]);

  const renderGroupHeader = useCallback((
    expanded: boolean,
    onToggle: () => void,
    icon: React.ReactNode,
    label: string,
    count: number,
    guideId: string,
  ) => (
    <TableRow
      className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
      onClick={onToggle}
      data-guide={guideId}
    >
      <TableCell colSpan={2} className="py-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {icon}
          {label}
          <Badge variant="outline" className="ml-auto text-xs">{count}</Badge>
        </div>
      </TableCell>
    </TableRow>
  ), []);

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="px-4 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('nav.staffRoles')}</h1>
            <p className="text-sm text-muted-foreground">{t('staffRoles.description')}</p>
          </div>
          <div className="flex items-center gap-2">
            <CloudSyncIndicator loaded={cloudSynced} />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleBulkSeed}
              disabled={isBulkSeeding}
              data-guide="staff-seed-button"
            >
              {isBulkSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {language === 'ru' ? 'Обучить всех техников' : 'Seed All Tech Roles'}
            </Button>
          </div>
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel
            ref={nav.panelRef}
            defaultSize={nav.panelSize}
            minSize={4}
            maxSize={50}
            onResize={nav.onPanelResize}
            data-guide="staff-list"
          >
            <div className="h-full flex flex-col hydra-nav-surface">
              <NavigatorHeader
                title={t('nav.staffRoles')}
                isMinimized={nav.isMinimized}
                onToggle={nav.toggle}
              />
              <div className="flex-1 overflow-auto">
                {nav.isMinimized ? (
                  <TooltipProvider delayDuration={200}>
                    <div className="p-1 space-y-1">
                      {[...expertRoles, ...technicalRoles].map((role) => {
                        const config = ROLE_CONFIG[role];
                        const IconComponent = config.icon;
                        const isSelected = selectedRole === role;
                        return (
                          <Tooltip key={role}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "relative flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                                  isSelected ? "bg-primary/10" : "hover:bg-muted/30"
                                )}
                                onClick={() => handleRoleSelect(role)}
                              >
                                <IconComponent className={cn("h-5 w-5", config.color)} />
                                {isSelected && unsavedChanges.hasUnsavedChanges && (
                                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-hydra-warning animate-pulse-glow" />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[200px]">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <IconComponent className={cn("h-4 w-4", config.color)} />
                                  <span className="font-medium text-sm">{t(config.label)}</span>
                                </div>
                                <ul className="text-xs text-muted-foreground space-y-0.5">
                                  <li>• {config.isTechnicalStaff ? t('staffRoles.technicalGroup') : t('staffRoles.expertsGroup')}</li>
                                  <li>• {role}</li>
                                </ul>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </TooltipProvider>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-16">{t('staffRoles.icon')}</TableHead>
                        <TableHead>{t('staffRoles.role')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {renderGroupHeader(expertsExpanded, () => setExpertsExpanded(!expertsExpanded), <Users className="h-4 w-4" />, t('staffRoles.expertsGroup'), expertRoles.length, 'staff-experts-group')}
                      {expertsExpanded && expertRoles.map(renderRoleRow)}

                      {renderGroupHeader(technicalExpanded, () => setTechnicalExpanded(!technicalExpanded), <Settings className="h-4 w-4" />, t('staffRoles.technicalGroup'), technicalRoles.length, 'staff-technical-group')}
                      {technicalExpanded && technicalRoles.map(renderRoleRow)}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={interviewRole ? (100 - nav.panelSize - interviewPanelSize) : (100 - nav.panelSize)}
            minSize={30}
          >
            <div className="h-full border-l border-border bg-card" data-guide="role-details">
              <RoleDetailsPanel
                selectedRole={selectedRole}
                onHasUnsavedChanges={handleHasUnsavedChanges}
                onOpenInterview={handleOpenInterview}
              />
            </div>
          </ResizablePanel>

          {/* Interview Panel — always mounted to prevent remounting details panel */}
          <ResizableHandle withHandle className={cn(!interviewRole && "hidden")} />
          <ResizablePanel
            defaultSize={interviewRole ? interviewPanelSize : 0}
            minSize={interviewRole ? 15 : 0}
            maxSize={interviewRole ? 50 : 0}
            onResize={(size) => { if (size > 0) setInterviewPanelSize(size); }}
            className={cn(!interviewRole && "hidden")}
          >
            <div className="h-full border-l border-border">
              {interviewRole && (
                <InterviewPanel role={interviewRole} onClose={handleCloseInterview} />
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        <UnsavedChangesDialog
          open={unsavedChanges.showConfirmDialog}
          onConfirm={unsavedChanges.confirmAndProceed}
          onCancel={unsavedChanges.cancelNavigation}
        />
      </div>
    </Layout>
  );
};

export default StaffRoles;
