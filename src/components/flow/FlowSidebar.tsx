import React from 'react';
import { NODE_PALETTE, FlowNodeType } from '@/types/flow';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { 
  ArrowDownToLine, 
  FileText, 
  Brain, 
  GitBranch, 
  Wrench, 
  ArrowUpFromLine,
  GripVertical
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ArrowDownToLine,
  FileText,
  Brain,
  GitBranch,
  Wrench,
  ArrowUpFromLine,
};

const colorMap: Record<string, string> = {
  'hydra-info': 'bg-hydra-info/20 text-hydra-info',
  'primary': 'bg-primary/20 text-primary',
  'hydra-success': 'bg-hydra-success/20 text-hydra-success',
  'hydra-warning': 'bg-hydra-warning/20 text-hydra-warning',
  'hydra-expert': 'bg-hydra-expert/20 text-hydra-expert',
  'hydra-glow': 'bg-hydra-glow/20 text-hydra-glow',
};

interface FlowSidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: FlowNodeType) => void;
}

export function FlowSidebar({ onDragStart }: FlowSidebarProps) {
  const { t } = useLanguage();

  const getNodeLabel = (type: FlowNodeType): string => {
    const key = `flowEditor.nodes.${type}`;
    return t(key);
  };

  return (
    <div className="w-56 bg-card border-r border-border flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-sm">{t('flowEditor.sidebar.elements')}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t('flowEditor.sidebar.dragHint')}
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-2 space-y-1.5">
        {NODE_PALETTE.map((item) => {
          const Icon = iconMap[item.icon];
          const colorClasses = colorMap[item.color] || 'bg-muted text-muted-foreground';
          
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-lg border cursor-grab transition-all",
                "bg-background hover:bg-accent/50 border-border",
                "active:cursor-grabbing active:scale-95"
              )}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
              <div className={cn("p-1.5 rounded", colorClasses.split(' ')[0])}>
                {Icon && <Icon className={cn("h-4 w-4", colorClasses.split(' ')[1])} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{getNodeLabel(item.type)}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {item.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
