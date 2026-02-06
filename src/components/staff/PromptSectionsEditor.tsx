import React, { useState, useCallback, useRef } from 'react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Plus, Lightbulb, ChevronDown, X, Trash2, Sparkles, Languages, Loader2, Undo2 } from 'lucide-react';
import { 
  type PromptSection, 
  createEmptySection, 
  SECTION_TIPS 
} from '@/lib/promptSectionParser';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getDictionariesForSection,
  getDictionaryLabel,
  PROMPT_DICTIONARIES,
  type PromptDictionaryKey,
} from '@/config/promptDictionaries';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PromptSectionsEditorProps {
  title: string;
  sections: PromptSection[];
  onTitleChange: (title: string) => void;
  onSectionsChange: (sections: PromptSection[]) => void;
  onLanguageSwitch?: (fromLang: 'ru' | 'en', toLang: 'ru' | 'en') => void;
  onRestoreOriginal?: (fromLang: 'ru' | 'en', toLang: 'ru' | 'en') => void;
  className?: string;
}

const PromptSectionsEditor: React.FC<PromptSectionsEditorProps> = ({
  title,
  sections,
  onTitleChange,
  onSectionsChange,
  onLanguageSwitch,
  onRestoreOriginal,
  className,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState(sections[0]?.key || '');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [tipsOpen, setTipsOpen] = useState(false);
  const [snippetsOpen, setSnippetsOpen] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [originalContent, setOriginalContent] = useState<{
    title: string;
    sections: PromptSection[];
  } | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const lang = (language === 'ru' || language === 'en') ? language : 'ru';

  // Detect if content is primarily Russian
  const isRussianContent = useCallback(() => {
    const allContent = title + ' ' + sections.map(s => s.content).join(' ');
    return /[а-яА-ЯёЁ]/.test(allContent);
  }, [title, sections]);

  // Restore original content
  const handleRestoreOriginal = useCallback(() => {
    if (!originalContent) return;
    
    const currentIsRussian = isRussianContent();
    
    onTitleChange(originalContent.title);
    onSectionsChange(originalContent.sections);
    setOriginalContent(null);
    
    // Notify parent to reverse language name change
    const currentLang: 'ru' | 'en' = currentIsRussian ? 'ru' : 'en';
    const originalLang: 'ru' | 'en' = currentIsRussian ? 'en' : 'ru';
    onRestoreOriginal?.(currentLang, originalLang);
    
    toast.success(t('staffRoles.originalRestored'));
  }, [originalContent, isRussianContent, onTitleChange, onSectionsChange, onRestoreOriginal, t]);

  // Translate entire prompt (title + all sections)
  const handleTranslateAll = useCallback(async () => {
    const isRussian = isRussianContent();
    const targetLang = isRussian ? 'English' : 'Russian';
    
    // Save original before translating
    setOriginalContent({
      title,
      sections: sections.map(s => ({ ...s })),
    });
    
    setIsTranslating(true);
    try {
      // Translate title
      const titleResult = await supabase.functions.invoke('translate-text', {
        body: { text: title, targetLang },
      });
      
      if (titleResult.error) throw titleResult.error;
      
      // Translate all non-empty sections in parallel
      const sectionsToTranslate = sections.filter(s => s.content.trim());
      const translationPromises = sectionsToTranslate.map(section =>
        supabase.functions.invoke('translate-text', {
          body: { text: section.content, targetLang },
        })
      );
      
      const results = await Promise.all(translationPromises);
      
      // Check for errors
      const hasErrors = results.some(r => r.error);
      if (hasErrors) throw new Error('Some translations failed');
      
      // Update title
      if (titleResult.data?.translation) {
        onTitleChange(titleResult.data.translation);
      }
      
      // Update sections
      const updatedSections = sections.map(section => {
        const idx = sectionsToTranslate.findIndex(s => s.key === section.key);
        if (idx >= 0 && results[idx].data?.translation) {
          return { ...section, content: results[idx].data.translation };
        }
        return section;
      });
      
      onSectionsChange(updatedSections);
      
      // Notify parent about language switch
      const fromLang: 'ru' | 'en' = isRussian ? 'ru' : 'en';
      const toLang: 'ru' | 'en' = isRussian ? 'en' : 'ru';
      onLanguageSwitch?.(fromLang, toLang);
      
      toast.success(t('staffRoles.translatedSuccess'));
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(t('staffRoles.translationError'));
      // Clear saved original on error
      setOriginalContent(null);
    } finally {
      setIsTranslating(false);
    }
  }, [title, sections, isRussianContent, onTitleChange, onSectionsChange, onLanguageSwitch, t]);

  // Get tips for current section
  const currentSection = sections.find(s => s.key === activeTab);
  const currentTips = currentSection
    ? SECTION_TIPS[currentSection.key] || SECTION_TIPS.custom
    : null;
  
  // Get dictionaries for current section
  const currentDictionaries = currentSection
    ? getDictionariesForSection(currentSection.key)
    : [];

  // Insert snippet into current section's textarea
  const handleInsertSnippet = useCallback((text: string) => {
    const textarea = textareaRefs.current[activeTab];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = currentSection?.content || '';
    
    // Insert at cursor or append with newline
    const prefix = start > 0 && currentContent[start - 1] !== '\n' ? '\n' : '';
    const suffix = end < currentContent.length && currentContent[end] !== '\n' ? '' : '';
    const newContent = currentContent.slice(0, start) + prefix + text + suffix + currentContent.slice(end);
    
    handleSectionContentChange(activeTab, newContent);
    
    // Focus back and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + text.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [activeTab, currentSection?.content]);

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
      {/* Title editor with translate button */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t('staffRoles.promptTitle')}
            </label>
            {originalContent && (
              <Badge variant="secondary" className="text-xs">
                {isRussianContent() ? t('staffRoles.originalRu') : t('staffRoles.originalEn')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {originalContent && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRestoreOriginal}
                      className="gap-1.5 h-7 text-xs text-warning hover:text-warning/80 hover:bg-warning/10"
                    >
                      <Undo2 className="h-3 w-3" />
                      {t('staffRoles.restoreOriginal')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p className="text-xs">
                      {t('staffRoles.restoreOriginalHint')}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTranslateAll}
                    disabled={isTranslating}
                    className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isTranslating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Languages className="h-3 w-3" />
                    )}
                    {isRussianContent()
                      ? t('staffRoles.translateToEnglish')
                      : t('staffRoles.translateToRussian')
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">
                    {t('staffRoles.translateAllSections')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
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
          <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-0.5 items-stretch">
            {sections.map((section) => {
              const Icon = section.icon;
              const isEmpty = !section.content.trim();
              const isIdentity = section.key === 'identity';
              
              return (
                <div key={section.key} className="relative group">
                  <TabsTrigger
                    value={section.key}
                    className={cn(
                      "w-full justify-start gap-2 pl-2 pr-3 py-1.5 h-auto text-left",
                      "data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
                      "hover:bg-muted/50 transition-colors rounded-md",
                      isEmpty && !isIdentity && "opacity-60"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs truncate flex-1 text-left">{section.title}</span>
                    {isIdentity && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4 ml-auto">
                        *
                      </Badge>
                    )}
                    {section.isCustom && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 ml-auto">
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
                  placeholder={t('staffRoles.sectionName')}
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
                {t('staffRoles.addSection')}
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
                ref={(el) => { textareaRefs.current[section.key] = el; }}
                value={section.content}
                onChange={(e) => handleSectionContentChange(section.key, e.target.value)}
                placeholder={`Содержимое секции «${section.title}»...`}
                className="flex-1 min-h-[180px] font-mono text-sm resize-none"
              />
            </TabsContent>
          ))}

          {/* Quick snippets from dictionaries */}
          {currentDictionaries.length > 0 && (
            <Collapsible open={snippetsOpen} onOpenChange={setSnippetsOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={cn(
                  "h-3 w-3 transition-transform",
                  !snippetsOpen && "-rotate-90"
                )} />
                <Sparkles className="h-3 w-3" />
                <span>{t('staffRoles.quickSnippets')}</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-3">
                  <TooltipProvider delayDuration={200}>
                    {currentDictionaries.map((dictKey) => {
                      const dict = PROMPT_DICTIONARIES[dictKey];
                      const entries = dict.entries.slice(0, 8); // Show first 8 items
                      
                      return (
                        <div key={dictKey} className="space-y-1.5">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            {getDictionaryLabel(dictKey, lang)}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {entries.map((entry) => (
                              <Tooltip key={entry.key}>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs font-normal hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                                    onClick={() => handleInsertSnippet(entry.label[lang])}
                                  >
                                    {entry.label[lang]}
                                  </Button>
                                </TooltipTrigger>
                                {entry.description && (
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-xs">{entry.description[lang]}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </TooltipProvider>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Contextual tips */}
          {currentTips && (
            <Collapsible open={tipsOpen} onOpenChange={setTipsOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={cn(
                  "h-3 w-3 transition-transform",
                  !tipsOpen && "-rotate-90"
                )} />
                <Lightbulb className="h-3 w-3" />
                <span>{t('staffRoles.sectionTips')} «{currentTips.title}»</span>
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
