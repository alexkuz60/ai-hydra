import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardContent } from '@/components/ui/hydra-card';
import { Crown } from 'lucide-react';

export function BeautyContest() {
  const { language } = useLanguage();

  return (
    <div className="h-full flex items-center justify-center p-4">
      <HydraCard variant="default" className="max-w-md w-full">
        <HydraCardContent className="py-16 text-center">
          <Crown className="h-12 w-12 text-hydra-amber mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-semibold mb-2">
            {language === 'ru' ? 'Конкурс интеллект-красоты' : 'Intelligence Beauty Contest'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === 'ru' 
              ? 'Раздел в разработке. Здесь появится система соревнований между ИИ-моделями.'
              : 'Section under development. AI model competition system coming soon.'}
          </p>
        </HydraCardContent>
      </HydraCard>
    </div>
  );
}
