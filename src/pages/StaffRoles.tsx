import React, { useState, useMemo, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Table, TableBody, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ResizablePanelGroup, ResizablePanel, ResizableHandle,
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Users, Settings, Sparkles, Loader2, ShieldAlert, RefreshCw } from 'lucide-react';
import { CloudSyncIndicator } from '@/components/ui/CloudSyncIndicator';
import { useCloudSyncStatus } from '@/hooks/useCloudSettings';
import { ROLE_CONFIG, AGENT_ROLES, type AgentRole } from '@/config/roles';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { cn } from '@/lib/utils';
import RoleDetailsPanel from '@/components/staff/RoleDetailsPanel';
import { InterviewPanel } from '@/components/staff/InterviewPanel';
import { RecertificationPanel } from '@/components/staff/RecertificationPanel';
import { StaffRoleRow } from '@/components/staff/StaffRoleRow';
import { StaffGroupHeader } from '@/components/staff/StaffGroupHeader';
import { useStaffSeedActions } from '@/hooks/useStaffSeedActions';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useNavigatorResize } from '@/hooks/useNavigatorResize';
import { NavigatorHeader } from '@/components/layout/NavigatorHeader';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const StaffRoles = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const cloudSynced = useCloudSyncStatus();
  const isRu = language === 'ru';

  const [interviewRoleInit] = useState<AgentRole | null>(() => {
    try {
      const stored = localStorage.getItem('hydra-interview-panel-role');
      return stored ? (stored as AgentRole) : null;
    } catch { return null; }
  });
  const [selectedRole, setSelectedRole] = useState<AgentRole | null>(() => {
    try {
      const stored = localStorage.getItem('hydra-staff-selected-role');
      return stored ? (stored as AgentRole) : interviewRoleInit;
    } catch { return interviewRoleInit; }
  });
  const [expertsExpanded, setExpertsExpanded] = useState(true);
  const [technicalExpanded, setTechnicalExpanded] = useState(true);
  const [otkExpanded, setOtkExpanded] = useState(true);
  const [interviewRole, setInterviewRole] = useState<AgentRole | null>(interviewRoleInit);
  const [recertRole, setRecertRole] = useState<AgentRole | null>(null);

  const [interviewPanelSize, setInterviewPanelSize] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('hydra-interview-panel-size');
      return stored ? parseFloat(stored) : 30;
    } catch { return 30; }
  });

  // Persist selected role
  React.useEffect(() => {
    try {
      if (selectedRole) localStorage.setItem('hydra-staff-selected-role', selectedRole);
      else localStorage.removeItem('hydra-staff-selected-role');
    } catch { /* ignore */ }
  }, [selectedRole]);

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

  // Fetch active role assignments (certified roles)
  const { data: activeAssignments } = useQuery({
    queryKey: ['role-assignments-active', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      const { data } = await supabase
        .from('role_assignment_history')
        .select('role, model_id, assigned_at')
        .eq('user_id', user.id)
        .is('removed_at', null);
      const map: Record<string, { model_id: string; assigned_at: string }> = {};
      data?.forEach((r) => { map[r.role] = { model_id: r.model_id, assigned_at: r.assigned_at }; });
      return map;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  // Group roles
  const { expertRoles, technicalRoles, otkRoles } = useMemo(() => {
    const experts: AgentRole[] = [];
    const technical: AgentRole[] = [];
    const otk: AgentRole[] = [];
    AGENT_ROLES.forEach((role) => {
      const config = ROLE_CONFIG[role];
      if (config.isSystemOnly) otk.push(role);
      else if (config.isTechnicalStaff) technical.push(role);
      else experts.push(role);
    });
    return { expertRoles: experts, technicalRoles: technical, otkRoles: otk };
  }, []);

  // Seed actions
  const allSeedableRoles = useMemo(
    () => [...expertRoles, ...technicalRoles, ...otkRoles],
    [expertRoles, technicalRoles, otkRoles]
  );
  const { isBulkSeeding, isForceSyncing, handleBulkSeed, handleForceSeed } = useStaffSeedActions({
    technicalRoles: allSeedableRoles,
    language,
  });

  const handleOpenInterview = useCallback((role: AgentRole) => {
    setRecertRole(null);
    setInterviewRole(role);
  }, []);

  const handleOpenRecert = useCallback((role: AgentRole) => {
    setInterviewRole(null);
    setRecertRole(role);
  }, []);

  // Sync interview panel with selected role
  React.useEffect(() => {
    if (interviewRole && selectedRole && interviewRole !== selectedRole) {
      setInterviewRole(selectedRole);
    }
  }, [selectedRole]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCloseInterview = useCallback(() => setInterviewRole(null), []);
  const handleCloseRecert = useCallback(() => setRecertRole(null), []);

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
              variant="outline" size="sm" className="gap-1.5"
              onClick={handleBulkSeed}
              disabled={isBulkSeeding || isForceSyncing}
              data-guide="staff-seed-button"
            >
              {isBulkSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {t('staffRoles.seedAll')}
            </Button>
            {isAdmin && (
              <Button
                variant="outline" size="sm"
                className="gap-1.5 text-hydra-warning border-hydra-warning/30 hover:bg-hydra-warning/10"
                onClick={handleForceSeed}
                disabled={isBulkSeeding || isForceSyncing}
              >
                {isForceSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {t('staffRoles.forceRefresh')}
              </Button>
            )}
          </div>
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel
            ref={nav.panelRef}
            defaultSize={nav.panelSize}
            minSize={4} maxSize={50}
            onResize={nav.onPanelResize}
            data-guide="staff-list"
          >
            <div className="h-full flex flex-col hydra-nav-surface">
              <NavigatorHeader title={t('nav.staffRoles')} isMinimized={nav.isMinimized} onToggle={nav.toggle} />
              <div className="flex-1 overflow-auto">
                {nav.isMinimized ? (
                  <TooltipProvider delayDuration={200}>
                    <div className="p-1 space-y-1">
                      {[...expertRoles, ...technicalRoles, ...otkRoles].map((role) => {
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
                  <TooltipProvider delayDuration={300}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-16">{t('staffRoles.icon')}</TableHead>
                        <TableHead>{t('staffRoles.role')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <StaffGroupHeader expanded={expertsExpanded} onToggle={() => setExpertsExpanded(!expertsExpanded)} icon={<Users className="h-4 w-4" />} label={t('staffRoles.expertsGroup')} count={expertRoles.length} guideId="staff-experts-group" />
                      {expertsExpanded && expertRoles.map(role => (
                        <StaffRoleRow
                          key={role} role={role} isSelected={selectedRole === role}
                          hasUnsavedChanges={unsavedChanges.hasUnsavedChanges}
                          assignment={activeAssignments?.[role]} language={language}
                          onSelect={handleRoleSelect} onRecertify={handleOpenRecert} t={t}
                        />
                      ))}

                      <StaffGroupHeader expanded={technicalExpanded} onToggle={() => setTechnicalExpanded(!technicalExpanded)} icon={<Settings className="h-4 w-4" />} label={t('staffRoles.technicalGroup')} count={technicalRoles.length + otkRoles.length} guideId="staff-technical-group" />
                      {technicalExpanded && technicalRoles.map(role => (
                        <StaffRoleRow
                          key={role} role={role} isSelected={selectedRole === role}
                          hasUnsavedChanges={unsavedChanges.hasUnsavedChanges}
                          assignment={activeAssignments?.[role]} language={language}
                          onSelect={handleRoleSelect} onRecertify={handleOpenRecert} t={t}
                        />
                      ))}

                      {technicalExpanded && <StaffGroupHeader expanded={otkExpanded} onToggle={() => setOtkExpanded(!otkExpanded)} icon={<ShieldAlert className="h-4 w-4" />} label={t('staffRoles.otkGroup')} count={otkRoles.length} guideId="staff-otk-group" nested />}
                      {technicalExpanded && otkExpanded && otkRoles.map(role => (
                        <StaffRoleRow
                          key={role} role={role} isSelected={selectedRole === role}
                          hasUnsavedChanges={unsavedChanges.hasUnsavedChanges}
                          assignment={activeAssignments?.[role]} language={language}
                          onSelect={handleRoleSelect} onRecertify={handleOpenRecert} t={t}
                        />
                      ))}
                    </TableBody>
                  </Table>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={Math.max(30, (interviewRole || recertRole) ? (100 - nav.panelSize - Math.max(interviewPanelSize, 15)) : (100 - nav.panelSize))}
            minSize={30}
          >
            <div className="h-full border-l border-border bg-card" data-guide="role-details">
              <RoleDetailsPanel
                selectedRole={selectedRole}
                onHasUnsavedChanges={handleHasUnsavedChanges}
                onOpenInterview={handleOpenInterview}
                onOpenRecert={handleOpenRecert}
              />
            </div>
          </ResizablePanel>

          {/* Interview / Recert Panel */}
          <ResizableHandle withHandle className={cn(!interviewRole && !recertRole && "hidden")} />
          <ResizablePanel
            defaultSize={(interviewRole || recertRole) ? Math.max(interviewPanelSize, 15) : 0}
            minSize={(interviewRole || recertRole) ? 15 : 0}
            maxSize={(interviewRole || recertRole) ? 50 : 0}
            onResize={(size) => { if (size > 0) setInterviewPanelSize(size); }}
            className={cn(!interviewRole && !recertRole && "hidden")}
          >
            <div className="h-full border-l border-border">
              {interviewRole && <InterviewPanel role={interviewRole} onClose={handleCloseInterview} />}
              {recertRole && <RecertificationPanel role={recertRole} onClose={handleCloseRecert} />}
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
