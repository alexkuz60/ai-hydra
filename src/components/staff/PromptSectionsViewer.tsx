import React, { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { parsePromptSections } from '@/lib/promptSectionParser';
import type { PromptSection } from '@/lib/promptSectionParser';
import { usePromptContentTranslation } from '@/hooks/usePromptContentTranslation';

interface PromptSectionsViewerProps {
  title: string;
  sections: PromptSection[];
  className?: string;
  /** Role key for caching translations */
  roleKey?: string;
  /** Full prompt text (needed for translation) */
  fullPromptText?: string;
  /** Pre-existing EN translation from DB */
  contentEn?: string | null;
}

/** Map standard section keys to EN titles */
const SECTION_TITLES_EN: Record<string, string> = {
  identity: 'Identity',
  competencies: 'Competencies',
  methodology: 'Methodology',
  format: 'Response Format',
  teamwork: 'Collaboration',
  limitations: 'Limitations',
  supervisor: 'Supervisor Wishes',
};

const PromptSectionsViewer: React.FC<PromptSectionsViewerProps> = ({
  title,
  sections,
  className,
  roleKey,
  fullPromptText,
  contentEn,
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState(sections[0]?.key || '');
  const lang = (language === 'ru' || language === 'en') ? language : 'ru';

  // Translation of the full prompt
  const { translatedContent, isTranslating, showTranslated } = usePromptContentTranslation(
    fullPromptText || '',
    roleKey || 'unknown',
    contentEn
  );

  // Parse translated content into sections
  const displaySections = useMemo(() => {
    if (showTranslated && translatedContent) {
      const parsed = parsePromptSections(translatedContent);
      if (parsed.sections.length > 0) return parsed.sections;
    }
    return sections;
  }, [showTranslated, translatedContent, sections]);

  const displayTitle = useMemo(() => {
    if (showTranslated && translatedContent) {
      const parsed = parsePromptSections(translatedContent);
      if (parsed.title) return parsed.title;
    }
    return title;
  }, [showTranslated, translatedContent, title]);

  /** Get localized section title */
  const getSectionTitle = (section: PromptSection) => {
    if (lang === 'en' && !section.isCustom && SECTION_TITLES_EN[section.key]) {
      return SECTION_TITLES_EN[section.key];
    }
    return section.title;
  };

  if (sections.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground italic", className)}>
        {lang === 'ru' ? 'Промпт не содержит структурированных секций' : 'The prompt has no structured sections'}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Title display */}
      {displayTitle && (
        <div className="mb-3 pb-2 border-b border-border flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">{displayTitle}</h4>
          {isTranslating && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-row gap-4 flex-1 min-h-0"
        orientation="vertical"
      >
        {/* Vertical tabs list */}
        <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-1 shrink-0 w-40">
          {displaySections.map((section) => {
            const Icon = section.icon;
            const isEmpty = !section.content.trim();
            
            return (
              <TabsTrigger
                key={section.key}
                value={section.key}
                className={cn(
                  "w-full justify-start gap-2 px-3 py-2 h-auto text-left",
                  "data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
                  "hover:bg-muted/50 transition-colors rounded-md",
                  isEmpty && "opacity-50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-xs truncate flex-1">{getSectionTitle(section)}</span>
                {isEmpty && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                    —
                  </Badge>
                )}
                {section.isCustom && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    +
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Content area */}
        <div className="flex-1 min-w-0 border-l border-border pl-4 flex flex-col">
          {displaySections.map((section) => (
            <TabsContent
              key={section.key}
              value={section.key}
              className="m-0 flex-1 flex flex-col data-[state=inactive]:hidden"
            >
              <ScrollArea className="flex-1">
                {section.content.trim() ? (
                  <MarkdownRenderer 
                    content={section.content} 
                    className="text-sm pr-4"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {lang === 'ru' ? 'Секция пуста' : 'Section is empty'}
                  </p>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

export default PromptSectionsViewer;
