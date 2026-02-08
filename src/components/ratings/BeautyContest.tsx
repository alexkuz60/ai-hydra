import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Crown, MessageSquare, Scale, Trophy } from 'lucide-react';

export function BeautyContest() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const upcoming = [
    { icon: MessageSquare, labelRu: 'Чат-арена конкурса', labelEn: 'Contest Chat Arena', descRu: 'Модели отвечают на задания в реальном времени', descEn: 'Models respond to tasks in real time' },
    { icon: Scale, labelRu: 'Панель жюри', labelEn: 'Jury Panel', descRu: 'Оценка ответов по критериям Арбитра', descEn: 'Response evaluation using Arbiter criteria' },
    { icon: Trophy, labelRu: 'Результаты и выбывание', labelEn: 'Results & Elimination', descRu: 'Итоги туров, турнирная сетка', descEn: 'Round results, bracket view' },
  ];

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-lg space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
          <Crown className="h-8 w-8 text-primary" />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">
            {isRu ? 'Конкурс интеллект-красоты' : 'Intelligence Beauty Contest'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Здесь будет проходить соревнование ИИ-моделей. Настройте правила и пригласите участников через Портфолио.'
              : 'This is where AI model competitions will take place. Configure rules and invite participants via Portfolio.'}
          </p>
        </div>

        <div className="space-y-3 text-left">
          {upcoming.map(({ icon: Icon, labelRu, labelEn, descRu, descEn }) => (
            <div key={labelEn} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium">{isRu ? labelRu : labelEn}</div>
                <div className="text-xs text-muted-foreground">{isRu ? descRu : descEn}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
