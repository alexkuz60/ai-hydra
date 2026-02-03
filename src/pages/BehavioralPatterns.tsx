import React, { useState, useMemo } from 'react';
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
import { Target, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { ROLE_CONFIG } from '@/config/roles';
import { TASK_BLUEPRINTS, ROLE_BEHAVIORS } from '@/config/patterns';
import { cn } from '@/lib/utils';
import PatternDetailsPanel from '@/components/patterns/PatternDetailsPanel';
import type { TaskBlueprint, RoleBehavior } from '@/types/patterns';

type SelectedPattern = TaskBlueprint | RoleBehavior | null;

const BehavioralPatterns = () => {
  const { t } = useLanguage();
  const [selectedPattern, setSelectedPattern] = useState<SelectedPattern>(null);
  const [strategicExpanded, setStrategicExpanded] = useState(true);
  const [roleExpanded, setRoleExpanded] = useState(true);

  const selectedId = useMemo(() => {
    if (!selectedPattern) return null;
    return selectedPattern.id;
  }, [selectedPattern]);

  const renderBlueprintRow = (pattern: TaskBlueprint) => {
    const isSelected = selectedId === pattern.id;

    const categoryColors: Record<string, string> = {
      planning: 'text-blue-400',
      creative: 'text-purple-400',
      analysis: 'text-green-400',
      technical: 'text-orange-400',
    };

    return (
      <TableRow
        key={pattern.id}
        className={cn(
          'cursor-pointer transition-colors',
          isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'
        )}
        onClick={() => setSelectedPattern(pattern)}
      >
        <TableCell className="pl-8">
          <div className="w-10 h-10 rounded-lg bg-hydra-arbiter/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-hydra-arbiter" />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            <span className="font-medium">{pattern.name}</span>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs', categoryColors[pattern.category])}>
                {t(`patterns.category.${pattern.category}`)}
              </span>
              <Badge variant="outline" className="text-xs py-0">
                {pattern.stages.length} {t('patterns.stagesCount')}
              </Badge>
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderBehaviorRow = (pattern: RoleBehavior) => {
    const isSelected = selectedId === pattern.id;
    const config = ROLE_CONFIG[pattern.role];
    const IconComponent = config?.icon;

    return (
      <TableRow
        key={pattern.id}
        className={cn(
          'cursor-pointer transition-colors',
          isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'
        )}
        onClick={() => setSelectedPattern(pattern)}
      >
        <TableCell className="pl-8">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              `bg-${config?.color.replace('text-', '')}/10`
            )}
          >
            {IconComponent && <IconComponent className={cn('h-5 w-5', config?.color)} />}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            <span className={cn('font-medium', config?.color)}>
              {t(config?.label || pattern.role)}
            </span>
            <span className="text-xs text-muted-foreground">
              {t(`patterns.tone.${pattern.communication.tone}`)} •{' '}
              {t(`patterns.verbosity.${pattern.communication.verbosity}`)}
            </span>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <h1 className="text-2xl font-bold">{t('nav.behavioralPatterns')}</h1>
          <p className="text-sm text-muted-foreground">{t('patterns.description')}</p>
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">{t('staffRoles.icon')}</TableHead>
                    <TableHead>{t('patterns.pattern')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Strategic Patterns Group */}
                  <TableRow
                    className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setStrategicExpanded(!strategicExpanded)}
                  >
                    <TableCell colSpan={2} className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {strategicExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Target className="h-4 w-4" />
                        {t('patterns.strategicGroup')}
                        <Badge variant="outline" className="ml-auto text-xs">
                          {TASK_BLUEPRINTS.length}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                  {strategicExpanded && TASK_BLUEPRINTS.map(renderBlueprintRow)}

                  {/* Role Patterns Group */}
                  <TableRow
                    className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setRoleExpanded(!roleExpanded)}
                  >
                    <TableCell colSpan={2} className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {roleExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Sparkles className="h-4 w-4" />
                        {t('patterns.roleGroup')}
                        <Badge variant="outline" className="ml-auto text-xs">
                          {ROLE_BEHAVIORS.length}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                  {roleExpanded && ROLE_BEHAVIORS.map(renderBehaviorRow)}
                </TableBody>
              </Table>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={65} minSize={50} maxSize={80}>
            <div className="h-full border-l border-border bg-card">
              <PatternDetailsPanel selectedPattern={selectedPattern} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Layout>
  );
};

export default BehavioralPatterns;
