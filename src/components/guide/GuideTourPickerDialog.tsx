import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Compass, Users, UserCog, BookOpen, Crown, GitBranch, Library } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GUIDE_TOURS, type GuideTour } from '@/config/guideTours';

const ICON_MAP: Record<string, React.ElementType> = {
  Compass,
  Users,
  UserCog,
  BookOpen,
  Crown,
  GitBranch,
  Library,
};

interface GuideTourPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTour: (tour: GuideTour) => void;
}

export function GuideTourPickerDialog({ open, onOpenChange, onSelectTour }: GuideTourPickerDialogProps) {
  const { language } = useLanguage();
  const lang = language as 'ru' | 'en';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
        <div className="space-y-2 pt-2">
          {GUIDE_TOURS.map((tour) => {
            const Icon = ICON_MAP[tour.icon] || Compass;
            return (
              <button
                key={tour.id}
                onClick={() => {
                  onSelectTour(tour);
                  onOpenChange(false);
                }}
                className="w-full flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 hover:border-hydra-guide/30 transition-all text-left group"
              >
                <div className="mt-0.5 p-1.5 rounded-md bg-hydra-guide/10 group-hover:bg-hydra-guide/20 transition-colors">
                  <Icon className="h-4 w-4 text-hydra-guide" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{tour.title[lang]}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{tour.description[lang]}</div>
                  <div className="text-xs text-muted-foreground/60 mt-1 font-mono">
                    {tour.steps.length} {lang === 'ru' ? 'шагов' : 'steps'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
