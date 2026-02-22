import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { NODE_PALETTE, FlowNodeType, NodePaletteItem } from '@/types/flow';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { NavigatorHeader } from '@/components/layout/NavigatorHeader';
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
  Tags,
  ChevronDown,
  ChevronRight,
  Group
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FLOW_DICT } from './i18n';

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
  Group,
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

const categoryDictKey: Record<string, string> = {
  basic: 'category.basic',
  data: 'category.data',
  integration: 'category.integration',
  logic: 'category.logic',
  ai: 'category.ai',
  structure: 'category.structure',
};

const getCategoryLabel = (category: string, language: string): string => {
  const key = categoryDictKey[category];
  if (!key) return category;
  const entry = FLOW_DICT[key];
  return entry?.[language === 'ru' ? 'ru' : 'en'] ?? category;
};

const categoryOrder = ['basic', 'data', 'integration', 'logic', 'ai', 'structure'];

const STORAGE_KEY = 'flow-sidebar-categories';

const defaultOpenState: Record<string, boolean> = {
  basic: true,
  data: false,
  integration: false,
  logic: false,
  ai: false,
  structure: true,
};

const loadCategoryState = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load category state from localStorage:', e);
  }
  return defaultOpenState;
};

interface FlowSidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: FlowNodeType) => void;
  isMinimized?: boolean;
  onToggle?: () => void;
}

export function FlowSidebar({ onDragStart, isMinimized = false, onToggle }: FlowSidebarProps) {
  const { t, language } = useLanguage();
  
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(loadCategoryState);

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(openCategories));
    } catch (e) {
      console.warn('Failed to save category state to localStorage:', e);
    }
  }, [openCategories]);

  const toggleCategory = useCallback((category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

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
      structure: [],
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
    <div className={cn("flex flex-col border-r border-border hydra-nav-surface", isMinimized ? "w-14" : "w-56")}>
      {onToggle && (
        <NavigatorHeader
          title={t('flowEditor.sidebar.elements')}
          isMinimized={isMinimized}
          onToggle={onToggle}
        />
      )}
      {isMinimized ? (
        <TooltipProvider delayDuration={200}>
          <div className="flex-1 overflow-auto p-1 space-y-1">
            {NODE_PALETTE.map((item) => {
              const Icon = iconMap[item.icon];
              const colorClasses = colorMap[item.color] || 'bg-muted text-muted-foreground';
              return (
                <Tooltip key={item.type}>
                  <TooltipTrigger asChild>
                    <div
                      draggable
                      onDragStart={(e) => onDragStart(e, item.type)}
                      className="flex items-center justify-center p-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-accent/50 transition-colors"
                    >
                      <div className={cn("p-1.5 rounded", colorClasses.split(' ')[0])}>
                        {Icon && <Icon className={cn("h-4 w-4", colorClasses.split(' ')[1])} />}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[200px]">
                    <div className="space-y-1">
                      <span className="font-medium text-sm">{getNodeLabel(item.type)}</span>
                      <p className="text-xs text-muted-foreground">
                        {getCategoryLabel(item.category, language)}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      ) : (
      <>
      {!onToggle && (
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-sm">{t('flowEditor.sidebar.elements')}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t('flowEditor.sidebar.dragHint')}
        </p>
      </div>
      )}
      
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {categoryOrder.map((category) => {
          const nodes = groupedNodes[category];
          if (!nodes || nodes.length === 0) return null;
          
          const isOpen = openCategories[category];
          
          return (
            <Collapsible
              key={category}
              open={isOpen}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors group">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                  {getCategoryLabel(category, language)}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground/70">
                    {nodes.length}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1.5 pt-1.5 pb-2">
                {nodes.map(renderNodeItem)}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
}
