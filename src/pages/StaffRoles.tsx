import React from 'react';
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
import { ROLE_CONFIG, AGENT_ROLES, type AgentRole } from '@/config/roles';
import { cn } from '@/lib/utils';

const StaffRoles = () => {
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('nav.staffRoles')}</h1>
          <p className="text-muted-foreground">{t('staffRoles.description')}</p>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16">{t('staffRoles.icon')}</TableHead>
                <TableHead>{t('staffRoles.role')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('staffRoles.color')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AGENT_ROLES.map((role: AgentRole) => {
                const config = ROLE_CONFIG[role];
                const IconComponent = config.icon;
                
                return (
                  <TableRow key={role} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        `bg-${config.color.replace('text-', '')}/10`
                      )}>
                        <IconComponent className={cn("h-5 w-5", config.color)} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={cn("font-medium", config.color)}>
                          {t(config.label)}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {role}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {config.color}
                      </code>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default StaffRoles;
