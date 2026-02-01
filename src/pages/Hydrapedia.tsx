import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { HydrapediaMarkdown } from '@/components/hydrapedia/HydrapediaMarkdown';
import { HydraCard } from '@/components/ui/hydra-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ChevronRight,
  Search,
  FileText
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

interface SearchResult {
  sectionId: string;
  sectionTitle: string;
  matchText: string;
  matchIndex: number;
}

function extractHeadings(markdown: string): TocItem[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: TocItem[] = [];
  let match;
  
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\wа-яё\s-]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    headings.push({ id, text, level });
  }
  
  return headings;
}

function searchContent(query: string, language: 'ru' | 'en'): SearchResult[] {
  if (!query || query.length < 2) return [];
  
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();
  
  for (const section of hydrapediaSections) {
    const content = section.content[language];
    const lowerContent = content.toLowerCase();
    
    let index = 0;
    while ((index = lowerContent.indexOf(lowerQuery, index)) !== -1) {
      // Extract context around match
      const start = Math.max(0, index - 40);
      const end = Math.min(content.length, index + query.length + 40);
      let matchText = content.substring(start, end);
      
      // Clean up markdown
      matchText = matchText
        .replace(/[#*`|]/g, '')
        .replace(/\n/g, ' ')
        .trim();
      
      if (start > 0) matchText = '...' + matchText;
      if (end < content.length) matchText = matchText + '...';
      
      results.push({
        sectionId: section.id,
        sectionTitle: section.titleKey,
        matchText,
        matchIndex: index
      });
      
      index += query.length;
      
      // Limit results per section
      if (results.filter(r => r.sectionId === section.id).length >= 3) break;
    }
  }
  
  return results.slice(0, 15); // Limit total results
}

export default function Hydrapedia() {
  const { t, language } = useLanguage();
  const [activeSection, setActiveSection] = useState(hydrapediaSections[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentSection = hydrapediaSections.find(s => s.id === activeSection);
  const content = currentSection?.content[language] || '';
  
  const headings = useMemo(() => extractHeadings(content), [content]);
  
  const searchResults = useMemo(() => 
    searchContent(searchQuery, language as 'ru' | 'en'), 
    [searchQuery, language]
  );

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileNavOpen(false);
    setActiveHeading(null);
    setSearchQuery('');
    setSearchOpen(false);
    
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
    
    const contentArea = contentRef.current;
    if (!contentArea) return;
    
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

  const handleSearchResultClick = (result: SearchResult) => {
    setActiveSection(result.sectionId);
    setSearchQuery('');
    setSearchOpen(false);
    
    if (contentRef.current) {
      const viewport = contentRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  };

  useEffect(() => {
    setActiveHeading(null);
  }, [activeSection]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // IntersectionObserver for active heading on scroll
  useEffect(() => {
    const contentArea = contentRef.current;
    if (!contentArea || headings.length === 0) return;

    const viewport = contentArea.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    // Small delay to ensure content is rendered
    const timeoutId = setTimeout(() => {
      const headingElements = contentArea.querySelectorAll('h1, h2, h3');
      if (headingElements.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          // Find the first visible heading
          const visibleEntries = entries.filter(entry => entry.isIntersecting);
          
          if (visibleEntries.length > 0) {
            // Get the topmost visible heading
            const topEntry = visibleEntries.reduce((prev, curr) => {
              return prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr;
            });
            
            const headingText = topEntry.target.textContent || '';
            const headingId = headingText
              .toLowerCase()
              .replace(/[^\wа-яё\s-]/gi, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-');
            
            setActiveHeading(headingId);
          }
        },
        {
          root: viewport,
          rootMargin: '-10% 0px -70% 0px',
          threshold: 0
        }
      );

      headingElements.forEach(el => observer.observe(el));

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [headings, activeSection]);

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50">
          <BookOpen className="h-6 w-6 text-primary" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold font-rounded bg-gradient-to-r from-primary to-hydra-expert bg-clip-text text-transparent">
              {t('hydrapedia.title')}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {t('hydrapedia.subtitle')}
            </p>
          </div>
          
          {/* Search button */}
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-2 text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="text-xs">{language === 'ru' ? 'Поиск' : 'Search'}</span>
            <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
          
          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
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

        {/* Search overlay */}
        {searchOpen && (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-20">
            <div className="w-full max-w-lg mx-4 bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-border">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'ru' ? 'Поиск по документации...' : 'Search documentation...'}
                  className="border-0 focus-visible:ring-0 p-0 h-auto text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <ScrollArea className="max-h-80">
                {searchQuery.length >= 2 ? (
                  searchResults.length > 0 ? (
                    <div className="p-2">
                      {searchResults.map((result, index) => (
                        <button
                          key={`${result.sectionId}-${result.matchIndex}-${index}`}
                          onClick={() => handleSearchResultClick(result)}
                          className="w-full text-left p-2 rounded hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 text-xs text-primary mb-1">
                            <FileText className="h-3 w-3" />
                            <span>{t(result.sectionTitle)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {result.matchText}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      {language === 'ru' ? 'Ничего не найдено' : 'No results found'}
                    </div>
                  )
                ) : (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    {language === 'ru' ? 'Введите минимум 2 символа' : 'Enter at least 2 characters'}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}

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
                  <HydrapediaMarkdown content={content} />
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
                
                <nav className="space-y-1">
                  {headings.map((heading, index) => (
                    <button
                      key={`${heading.id}-${index}`}
                      onClick={() => handleHeadingClick(heading.id)}
                      className={cn(
                        "w-full flex items-center gap-1.5 rounded text-left transition-all duration-200",
                        "hover:bg-muted/50 hover:text-foreground",
                        // Depth-based sizing - INCREASED FONT SIZES
                        heading.level === 1 && "px-2 py-2 text-sm font-semibold text-foreground",
                        heading.level === 2 && "pl-4 pr-2 py-1.5 text-sm text-muted-foreground font-medium",
                        heading.level === 3 && "pl-6 pr-2 py-1 text-xs text-muted-foreground",
                        activeHeading === heading.id && "bg-primary/10 text-primary"
                      )}
                    >
                      {heading.level > 1 && (
                        <ChevronRight className={cn(
                          "flex-shrink-0 opacity-60",
                          heading.level === 2 && "h-3.5 w-3.5",
                          heading.level === 3 && "h-3 w-3"
                        )} />
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
