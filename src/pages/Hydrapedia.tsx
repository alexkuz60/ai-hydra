import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { HydraCard } from '@/components/ui/hydra-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hydrapediaSections } from '@/content/hydrapedia';
import {
  Lightbulb,
  Rocket,
  Users,
  Shield,
  Library,
  Wrench,
  GitBranch,
  BarChart3,
  Star,
  BookOpen,
  Menu,
  X,
  List,
  ChevronRight
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Lightbulb,
  Rocket,
  Users,
  Shield,
  Library,
  Wrench,
  GitBranch,
  BarChart3,
  Star,
};

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function extractHeadings(markdown: string): TocItem[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: TocItem[] = [];
  let match;
  
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    // Create URL-friendly ID
    const id = text
      .toLowerCase()
      .replace(/[^\wа-яё\s-]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    headings.push({ id, text, level });
  }
  
  return headings;
}

export default function Hydrapedia() {
  const { t, language } = useLanguage();
  const [activeSection, setActiveSection] = useState(hydrapediaSections[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentSection = hydrapediaSections.find(s => s.id === activeSection);
  const content = currentSection?.content[language] || '';
  
  // Extract headings from current content
  const headings = useMemo(() => extractHeadings(content), [content]);

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileNavOpen(false);
    setActiveHeading(null);
    // Scroll to top of content
    if (contentRef.current) {
      const viewport = contentRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  };

  const handleHeadingClick = (headingId: string) => {
    setActiveHeading(headingId);
    setTocOpen(false);
    
    // Find the heading element in the rendered content
    const contentArea = contentRef.current;
    if (!contentArea) return;
    
    // Look for headings by text content
    const headingElements = contentArea.querySelectorAll('h1, h2, h3');
    for (const el of headingElements) {
      const elId = el.textContent
        ?.toLowerCase()
        .replace(/[^\wа-яё\s-]/gi, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      if (elId === headingId) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
    }
  };

  // Reset active heading when section changes
  useEffect(() => {
    setActiveHeading(null);
  }, [activeSection]);

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50">
          <BookOpen className="h-6 w-6 text-primary" />
          <div className="flex-1">
            <h1 className="text-xl font-bold font-rounded bg-gradient-to-r from-primary to-hydra-expert bg-clip-text text-transparent">
              {t('hydrapedia.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('hydrapedia.subtitle')}
            </p>
          </div>
          
          {/* Mobile nav toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          {/* Mobile ToC toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setTocOpen(!tocOpen)}
          >
            <List className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Sidebar Navigation */}
          <aside 
            className={cn(
              "w-64 border-r border-border bg-card/30 flex-shrink-0",
              "absolute md:relative inset-0 z-20 md:z-auto",
              "transition-transform duration-200 md:translate-x-0",
              mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}
          >
            <ScrollArea className="h-full">
              <nav className="p-3 space-y-1">
                {hydrapediaSections.map((section) => {
                  const Icon = iconMap[section.icon] || Lightbulb;
                  const isActive = activeSection === section.id;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-200",
                        "hover:bg-muted/50",
                        isActive && "bg-primary/10 text-primary border border-primary/20"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive && "text-primary"
                      )} />
                      <span className={cn(
                        "truncate",
                        isActive && "font-medium"
                      )}>
                        {t(section.titleKey)}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </ScrollArea>
          </aside>

          {/* Mobile overlay for left nav */}
          {mobileNavOpen && (
            <div 
              className="absolute inset-0 bg-background/80 z-10 md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
          )}

          {/* Content Area */}
          <main className="flex-1 overflow-hidden" ref={contentRef}>
            <ScrollArea className="h-full">
              <div className="max-w-4xl mx-auto p-6">
                <HydraCard variant="glass" className="p-6">
                  <MarkdownRenderer 
                    content={content} 
                    className="prose-sm md:prose"
                  />
                </HydraCard>
              </div>
            </ScrollArea>
          </main>

          {/* Right Sidebar - Table of Contents */}
          <aside 
            className={cn(
              "w-56 border-l border-border bg-card/20 flex-shrink-0",
              "absolute lg:relative right-0 inset-y-0 z-20 lg:z-auto",
              "transition-transform duration-200 lg:translate-x-0",
              tocOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
            )}
          >
            <ScrollArea className="h-full">
              <div className="p-3">
                <div className="flex items-center gap-2 px-2 py-1.5 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <List className="h-3.5 w-3.5" />
                  <span>{language === 'ru' ? 'Содержание' : 'Contents'}</span>
                </div>
                
                <nav className="space-y-0.5">
                  {headings.map((heading, index) => (
                    <button
                      key={`${heading.id}-${index}`}
                      onClick={() => handleHeadingClick(heading.id)}
                      className={cn(
                        "w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left text-xs transition-all duration-200",
                        "hover:bg-muted/50 hover:text-foreground",
                        heading.level === 1 && "font-medium text-foreground",
                        heading.level === 2 && "pl-4 text-muted-foreground",
                        heading.level === 3 && "pl-6 text-muted-foreground/80",
                        activeHeading === heading.id && "bg-primary/10 text-primary"
                      )}
                    >
                      {heading.level > 1 && (
                        <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-50" />
                      )}
                      <span className="truncate">{heading.text}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </ScrollArea>
          </aside>

          {/* Mobile overlay for ToC */}
          {tocOpen && (
            <div 
              className="absolute inset-0 bg-background/80 z-10 lg:hidden"
              onClick={() => setTocOpen(false)}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
