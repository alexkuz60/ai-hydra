import React, { useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Plus, Lightbulb, ChevronDown, X, Trash2 } from 'lucide-react';
import { 
  type PromptSection, 
  createEmptySection, 
  SECTION_TIPS 
} from '@/lib/promptSectionParser';
import { useLanguage } from '@/contexts/LanguageContext';

interface PromptSectionsEditorProps {
  title: string;
  sections: PromptSection[];
  onTitleChange: (title: string) => void;
  onSectionsChange: (sections: PromptSection[]) => void;
  className?: string;
}

const PromptSectionsEditor: React.FC<PromptSectionsEditorProps> = ({
  title,
  sections,
  onTitleChange,
  onSectionsChange,
  className,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(sections[0]?.key || '');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [tipsOpen, setTipsOpen] = useState(false);

  // Get tips for current section
  const currentSection = sections.find(s => s.key === activeTab);
  const currentTips = currentSection
    ? SECTION_TIPS[currentSection.key] || SECTION_TIPS.custom
    : null;

  const handleSectionContentChange = useCallback((key: string, content: string) => {
    const updated = sections.map(section =>
      section.key === key ? { ...section, content } : section
    );
    onSectionsChange(updated);
  }, [sections, onSectionsChange]);

  const handleAddSection = useCallback(() => {
    if (!newSectionTitle.trim()) return;
    
    // Check for duplicates
    const isDuplicate = sections.some(
      s => s.title.toLowerCase() === newSectionTitle.trim().toLowerCase()
    );
    if (isDuplicate) {
      return; // Could show toast here
    }
    
    const newSection = createEmptySection(newSectionTitle.trim());
    onSectionsChange([...sections, newSection]);
    setActiveTab(newSection.key);
    setNewSectionTitle('');
    setIsAddingSection(false);
  }, [newSectionTitle, sections, onSectionsChange]);

  const handleRemoveSection = useCallback((key: string) => {
    const section = sections.find(s => s.key === key);
    // Only allow removing custom sections
    if (!section?.isCustom) return;
    
    const updated = sections.filter(s => s.key !== key);
    onSectionsChange(updated);
    
    // Switch to first section if current was removed
    if (activeTab === key && updated.length > 0) {
      setActiveTab(updated[0].key);
    }
  }, [sections, onSectionsChange, activeTab]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSection();
    } else if (e.key === 'Escape') {
      setIsAddingSection(false);
      setNewSectionTitle('');
    }
  }, [handleAddSection]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Title editor */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          {t('staffRoles.promptTitle') || 'Заголовок промпта'}
        </label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Эксперт — Универсальный специалист"
          className="font-medium"
        />
      </div>

      {/* Sections editor */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-row gap-4 flex-1 min-h-0"
        orientation="vertical"
      >
        {/* Vertical tabs list */}
        <div className="flex flex-col shrink-0 w-44">
          <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isEmpty = !section.content.trim();
              const isIdentity = section.key === 'identity';
              
              return (
                <div key={section.key} className="relative group">
                  <TabsTrigger
                    value={section.key}
                    className={cn(
                      "w-full justify-start gap-2 px-3 py-2 h-auto text-left",
                      "data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
                      "hover:bg-muted/50 transition-colors rounded-md",
                      isEmpty && !isIdentity && "opacity-60"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-xs truncate flex-1">{section.title}</span>
                    {isIdentity && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                        *
                      </Badge>
                    )}
                    {section.isCustom && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        +
                      </Badge>
                    )}
                  </TabsTrigger>
                  
                  {/* Remove button for custom sections */}
                  {section.isCustom && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "absolute -right-1 top-1/2 -translate-y-1/2 h-5 w-5",
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                        "hover:bg-destructive/10 hover:text-destructive"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSection(section.key);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </TabsList>

          {/* Add section button / input */}
          <div className="mt-2 pt-2 border-t border-border">
            {isAddingSection ? (
              <div className="flex items-center gap-1">
                <Input
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Название секции"
                  className="h-8 text-xs"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    setIsAddingSection(false);
                    setNewSectionTitle('');
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setIsAddingSection(true)}
              >
                <Plus className="h-3 w-3" />
                {t('staffRoles.addSection') || 'Добавить секцию'}
              </Button>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 border-l border-border pl-4 flex flex-col gap-3">
          {sections.map((section) => (
            <TabsContent
              key={section.key}
              value={section.key}
              className="m-0 flex-1 flex flex-col gap-3"
            >
              <Textarea
                value={section.content}
                onChange={(e) => handleSectionContentChange(section.key, e.target.value)}
                placeholder={`Содержимое секции «${section.title}»...`}
                className="flex-1 min-h-[180px] font-mono text-sm resize-none"
              />
            </TabsContent>
          ))}

          {/* Contextual tips */}
          {currentTips && (
            <Collapsible open={tipsOpen} onOpenChange={setTipsOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={cn(
                  "h-3 w-3 transition-transform",
                  !tipsOpen && "-rotate-90"
                )} />
                <Lightbulb className="h-3 w-3" />
                <span>Советы по написанию секции «{currentTips.title}»</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <ul className="space-y-1">
                    {currentTips.tips.map((tip, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default PromptSectionsEditor;
