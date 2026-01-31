import React, { useMemo } from 'react';
import { NODE_PALETTE, FlowNodeType, NodePaletteItem } from '@/types/flow';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { 
  ArrowDownToLine, 
  FileText, 
  Brain, 
  GitBranch, 
  Wrench, 
  ArrowUpFromLine,
  GripVertical,
  Shuffle,
  Filter,
  Combine,
  Split,
  Database,
  Globe,
  HardDrive,
  Repeat,
  Clock,
  LayoutList,
  Sparkles,
  MemoryStick,
  Tags
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ArrowDownToLine,
  FileText,
  Brain,
  GitBranch,
  Wrench,
  ArrowUpFromLine,
  Shuffle,
  Filter,
  Combine,
  Split,
  Database,
  Globe,
  HardDrive,
  Repeat,
  Clock,
  LayoutList,
  Sparkles,
  MemoryStick,
  Tags,
};

const colorMap: Record<string, string> = {
  'hydra-info': 'bg-hydra-info/20 text-hydra-info',
  'primary': 'bg-primary/20 text-primary',
  'hydra-success': 'bg-hydra-success/20 text-hydra-success',
  'hydra-warning': 'bg-hydra-warning/20 text-hydra-warning',
  'hydra-expert': 'bg-hydra-expert/20 text-hydra-expert',
  'hydra-glow': 'bg-hydra-glow/20 text-hydra-glow',
  'hydra-analyst': 'bg-hydra-analyst/20 text-hydra-analyst',
  'hydra-advisor': 'bg-hydra-advisor/20 text-hydra-advisor',
  'hydra-archivist': 'bg-hydra-archivist/20 text-hydra-archivist',
  'hydra-webhunter': 'bg-hydra-webhunter/20 text-hydra-webhunter',
  'hydra-moderator': 'bg-hydra-moderator/20 text-hydra-moderator',
  'muted': 'bg-muted text-muted-foreground',
};

const categoryLabels: Record<string, { ru: string; en: string }> = {
  basic: { ru: 'Базовые', en: 'Basic' },
  data: { ru: 'Данные', en: 'Data' },
  integration: { ru: 'Интеграции', en: 'Integrations' },
  logic: { ru: 'Логика', en: 'Logic' },
  ai: { ru: 'AI', en: 'AI' },
};

interface FlowSidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: FlowNodeType) => void;
}

export function FlowSidebar({ onDragStart }: FlowSidebarProps) {
  const { t, language } = useLanguage();

  const getNodeLabel = (type: FlowNodeType): string => {
    const key = `flowEditor.nodes.${type}`;
    return t(key);
  };

  const groupedNodes = useMemo(() => {
    const groups: Record<string, NodePaletteItem[]> = {
      basic: [],
      data: [],
      integration: [],
      logic: [],
      ai: [],
    };
    
    NODE_PALETTE.forEach((item) => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    });
    
    return groups;
  }, []);

  const renderNodeItem = (item: NodePaletteItem) => {
    const Icon = iconMap[item.icon];
    const colorClasses = colorMap[item.color] || 'bg-muted text-muted-foreground';
    
    return (
      <div
        key={item.type}
        draggable
        onDragStart={(e) => onDragStart(e, item.type)}
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg border cursor-grab transition-all",
          "bg-background hover:bg-accent/50 border-border",
          "active:cursor-grabbing active:scale-95"
        )}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground/50" />
        <div className={cn("p-1.5 rounded", colorClasses.split(' ')[0])}>
          {Icon && <Icon className={cn("h-4 w-4", colorClasses.split(' ')[1])} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{getNodeLabel(item.type)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-56 bg-card border-r border-border flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-sm">{t('flowEditor.sidebar.elements')}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t('flowEditor.sidebar.dragHint')}
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-2 space-y-3">
        {Object.entries(groupedNodes).map(([category, nodes], index) => (
          nodes.length > 0 && (
            <div key={category}>
              {index > 0 && <Separator className="mb-3" />}
              <div className="mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[category]?.[language] || category}
                </span>
              </div>
              <div className="space-y-1.5">
                {nodes.map(renderNodeItem)}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
