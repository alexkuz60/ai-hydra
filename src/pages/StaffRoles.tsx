import React, { useState, useMemo, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, Users, Settings, ChevronDown, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { ROLE_CONFIG, AGENT_ROLES, type AgentRole } from '@/config/roles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import RoleDetailsPanel from '@/components/staff/RoleDetailsPanel';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';

const TECHNICAL_ROLES: AgentRole[] = ['archivist', 'analyst', 'promptengineer', 'flowregulator', 'toolsmith', 'webhunter'];

const StaffRoles = () => {
  const { t, language } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<AgentRole | null>(null);
  const [expertsExpanded, setExpertsExpanded] = useState(true);
  const [technicalExpanded, setTechnicalExpanded] = useState(true);
  const [isBulkSeeding, setIsBulkSeeding] = useState(false);
  
  // Track unsaved changes from RoleDetailsPanel
  const unsavedChanges = useUnsavedChanges();
  
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
      for (const role of TECHNICAL_ROLES) {
        const { data, error } = await supabase.functions.invoke('seed-role-knowledge', {
          body: { role, include_system_prompt: true, force: false },
        });

        if (error) {
          console.error(`[BulkSeed] Error for ${role}:`, error);
          continue;
        }

        if (data?.skipped) {
          skipped++;
        } else if (data?.seeded > 0) {
          totalSeeded += data.seeded;
          rolesProcessed++;
        }
      }

      if (totalSeeded > 0) {
        toast.success(
          language === 'ru'
            ? `Загружено ${totalSeeded} фрагментов для ${rolesProcessed} ролей${skipped > 0 ? ` (${skipped} пропущено)` : ''}`
            : `Loaded ${totalSeeded} chunks for ${rolesProcessed} roles${skipped > 0 ? ` (${skipped} skipped)` : ''}`
        );
      } else if (skipped === TECHNICAL_ROLES.length) {
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
  }, [language]);

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

  const renderRoleRow = (role: AgentRole) => {
    const config = ROLE_CONFIG[role];
    const IconComponent = config.icon;
    const isSelected = selectedRole === role;
    
    return (
      <TableRow 
        key={role} 
        className={cn(
          "cursor-pointer transition-colors",
          isSelected 
            ? "bg-primary/10 hover:bg-primary/15" 
            : "hover:bg-muted/30"
        )}
        onClick={() => handleRoleSelect(role)}
      >
        <TableCell className="pl-8">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            `bg-${config.color.replace('text-', '')}/10`
          )}>
            <IconComponent className={cn("h-5 w-5", config.color)} />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={cn("font-medium", config.color)}>
                {t(config.label)}
              </span>
              {config.isTechnicalStaff && (
                <Badge variant="secondary" className="gap-1 text-xs py-0">
                  <Wrench className="h-3 w-3" />
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {role}
            </span>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="px-4 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('nav.staffRoles')}</h1>
            <p className="text-sm text-muted-foreground">{t('staffRoles.description')}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleBulkSeed}
            disabled={isBulkSeeding}
          >
            {isBulkSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {language === 'ru' ? 'Обучить всех техников' : 'Seed All Tech Roles'}
          </Button>
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">{t('staffRoles.icon')}</TableHead>
                    <TableHead>{t('staffRoles.role')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Группа экспертов */}
                  <TableRow 
                    className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setExpertsExpanded(!expertsExpanded)}
                  >
                    <TableCell colSpan={2} className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {expertsExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Users className="h-4 w-4" />
                        {t('staffRoles.expertsGroup')}
                        <Badge variant="outline" className="ml-auto text-xs">
                          {expertRoles.length}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expertsExpanded && expertRoles.map(renderRoleRow)}
                  
                  {/* Группа технического персонала */}
                  <TableRow 
                    className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setTechnicalExpanded(!technicalExpanded)}
                  >
                    <TableCell colSpan={2} className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {technicalExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Settings className="h-4 w-4" />
                        {t('staffRoles.technicalGroup')}
                        <Badge variant="outline" className="ml-auto text-xs">
                          {technicalRoles.length}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                  {technicalExpanded && technicalRoles.map(renderRoleRow)}
                </TableBody>
              </Table>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={65} minSize={50} maxSize={80}>
            <div className="h-full border-l border-border bg-card">
              <RoleDetailsPanel 
                selectedRole={selectedRole} 
                onHasUnsavedChanges={handleHasUnsavedChanges}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        
        {/* Unsaved changes confirmation dialog */}
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