import React, { useState } from 'react';
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
import { Wrench } from 'lucide-react';
import { ROLE_CONFIG, AGENT_ROLES, type AgentRole } from '@/config/roles';
import { cn } from '@/lib/utils';
import RoleDetailsPanel from '@/components/staff/RoleDetailsPanel';

const StaffRoles = () => {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<AgentRole | null>(null);

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <h1 className="text-2xl font-bold">{t('nav.staffRoles')}</h1>
          <p className="text-sm text-muted-foreground">{t('staffRoles.description')}</p>
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
                  {AGENT_ROLES.map((role: AgentRole) => {
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
                        onClick={() => setSelectedRole(role)}
                      >
                        <TableCell>
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
                  })}
                </TableBody>
              </Table>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={65} minSize={50} maxSize={80}>
            <div className="h-full border-l border-border bg-card">
              <RoleDetailsPanel selectedRole={selectedRole} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Layout>
  );
};

export default StaffRoles;
