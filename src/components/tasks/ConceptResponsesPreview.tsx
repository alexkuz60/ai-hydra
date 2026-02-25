import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Target, Landmark, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ConceptResponses } from '@/hooks/useConceptResponses';
import ReactMarkdown from 'react-markdown';

interface CollapsedResponseProps {
  content: string | null;
  contentEn: string | null;
  className?: string;
  onExpand: () => void;
  accentClass: string;
}

function CollapsedResponse({ content, contentEn, className, onExpand, accentClass }: CollapsedResponseProps) {
  const { language } = useLanguage();
  const text = (language === 'en' && contentEn) ? contentEn : content;
  
  if (!text) return null;

  return (
    <div className={cn('relative mt-2 group', className)}>
      <div className="text-xs text-muted-foreground line-clamp-5 whitespace-pre-wrap border-l-2 pl-3 py-1" style={{ borderColor: `hsl(var(--${accentClass}))` }}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-1">{children}</p>,
            h1: ({ children }) => <span className="font-bold">{children}</span>,
            h2: ({ children }) => <span className="font-bold">{children}</span>,
            h3: ({ children }) => <span className="font-semibold">{children}</span>,
            ul: ({ children }) => <span>{children}</span>,
            li: ({ children }) => <span>• {children} </span>,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-6 px-2 text-xs mt-1 gap-1 opacity-70 hover:opacity-100')}
        onClick={onExpand}
      >
        <Maximize2 className="h-3 w-3" />
        {language === 'ru' ? 'Развернуть' : 'Expand'}
      </Button>
    </div>
  );
}

interface ConceptResponsesPreviewProps {
  responses: ConceptResponses;
  defaultTab?: 'visionary' | 'strategist' | 'patent';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConceptResponsesPreview({ responses, defaultTab = 'visionary', open, onOpenChange }: ConceptResponsesPreviewProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Sync when parent changes the default tab
  React.useEffect(() => {
    if (open) setActiveTab(defaultTab);
  }, [defaultTab, open]);

  const getContent = (r: { content: string; content_en: string | null } | null) => {
    if (!r) return null;
    return (language === 'en' && r.content_en) ? r.content_en : r.content;
  };

  const tabs = [
    { id: 'visionary' as const, label: t('concept.visionary.title'), icon: Eye, color: 'text-hydra-visionary', response: responses.visionary },
    { id: 'strategist' as const, label: t('concept.strategist.title'), icon: Target, color: 'text-hydra-strategist', response: responses.strategist },
    { id: 'patent' as const, label: t('concept.patentSearch.title'), icon: Landmark, color: 'text-hydra-patent', response: responses.patent },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{language === 'ru' ? 'Мнения экспертов' : 'Expert Opinions'}</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start">
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                <tab.icon className={cn('h-3.5 w-3.5', tab.color)} />
                <span className="text-xs">{tab.label}</span>
                {tab.response && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="flex-1 min-h-0">
              <ScrollArea className="h-[55vh]">
                {tab.response ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none p-4">
                    <ReactMarkdown>{getContent(tab.response) || ''}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                    {language === 'ru' ? 'Ответ ещё не получен' : 'No response yet'}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export { CollapsedResponse };
