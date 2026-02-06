import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { PromptSection } from '@/lib/promptSectionParser';

interface PromptSectionsViewerProps {
  title: string;
  sections: PromptSection[];
  className?: string;
}

const PromptSectionsViewer: React.FC<PromptSectionsViewerProps> = ({
  title,
  sections,
  className,
}) => {
  const [activeTab, setActiveTab] = useState(sections[0]?.key || '');

  if (sections.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground italic", className)}>
        Промпт не содержит структурированных секций
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Title display */}
      {title && (
        <div className="mb-3 pb-2 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
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
          {sections.map((section) => {
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
                <span className="text-xs truncate flex-1">{section.title}</span>
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
        <div className="flex-1 min-w-0 border-l border-border pl-4">
          {sections.map((section) => (
            <TabsContent
              key={section.key}
              value={section.key}
              className="m-0 h-full"
            >
              <ScrollArea className="h-[200px]">
                {section.content.trim() ? (
                  <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground/90">
                    {section.content}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Секция пуста
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
