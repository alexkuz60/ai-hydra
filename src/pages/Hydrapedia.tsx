import React, { useState } from 'react';
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
  X
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

export default function Hydrapedia() {
  const { t, language } = useLanguage();
  const [activeSection, setActiveSection] = useState(hydrapediaSections[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const currentSection = hydrapediaSections.find(s => s.id === activeSection);
  const content = currentSection?.content[language] || '';

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileNavOpen(false);
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
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
            className="ml-auto md:hidden"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar Navigation */}
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

          {/* Mobile overlay */}
          {mobileNavOpen && (
            <div 
              className="absolute inset-0 bg-background/80 z-10 md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
          )}

          {/* Content Area */}
          <main className="flex-1 overflow-hidden">
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
        </div>
      </div>
    </Layout>
  );
}
