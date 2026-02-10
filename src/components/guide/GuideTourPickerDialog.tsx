import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Compass, Users, UserCog, BookOpen, Crown, GitBranch, Library, Wrench, Target, CheckSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GUIDE_TOURS, type GuideTour } from '@/config/guideTours';
import { AnimatePresence, motion } from 'framer-motion';

const ICON_MAP: Record<string, React.ElementType> = {
  Compass, Users, UserCog, BookOpen, Crown, GitBranch, Library, Wrench, Target, CheckSquare,
};

interface GuideTourPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTour: (tour: GuideTour) => void;
}

export function GuideTourPickerDialog({ open, onOpenChange, onSelectTour }: GuideTourPickerDialogProps) {
  const { language } = useLanguage();
  const lang = language as 'ru' | 'en';
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-hydra-guide" />
            {lang === 'ru' ? 'Экскурсия по Hydra' : 'Hydra Tour'}
          </DialogTitle>
          <DialogDescription>
            {lang === 'ru'
              ? 'Выберите маршрут для интерактивной экскурсии'
              : 'Choose a route for an interactive tour'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          {GUIDE_TOURS.map((tour) => {
            const Icon = ICON_MAP[tour.icon] || Compass;
            const isExpanded = expandedId === tour.id;
            return (
              <div key={tour.id} className="flex flex-col rounded-lg border border-border hover:border-hydra-guide/30 transition-all group">
                {/* Tour header row */}
                <div className="flex items-start gap-3 p-3">
                  <button
                    onClick={() => {
                      onSelectTour(tour);
                      onOpenChange(false);
                    }}
                    className="flex items-start gap-3 flex-1 text-left"
                  >
                    <div className="mt-0.5 p-1.5 rounded-md bg-hydra-guide/10 group-hover:bg-hydra-guide/20 transition-colors">
                      <Icon className="h-4 w-4 text-hydra-guide" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{tour.title[lang]}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{tour.description[lang]}</div>
                    </div>
                  </button>
                  {/* Steps toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : tour.id)}
                    className="shrink-0 mt-0.5 p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-hydra-guide transition-colors"
                    title={lang === 'ru' ? 'Шаги маршрута' : 'Tour steps'}
                  >
                    <span className="flex items-center gap-1 text-[10px] font-mono">
                      {tour.steps.length}
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                </div>

                {/* Collapsible steps */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-3 pb-2 pt-1.5 space-y-0.5">
                        {tour.steps.map((step, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              onSelectTour(tour);
                              onOpenChange(false);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-left text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                          >
                            <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono border border-current/30">
                              {i + 1}
                            </span>
                            <span className="truncate">{step.title[lang]}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
