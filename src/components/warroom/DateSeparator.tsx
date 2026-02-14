import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar } from 'lucide-react';

interface DateSeparatorProps {
  date: Date;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const { language } = useLanguage();
  const locale = language === 'ru' ? ru : enUS;

  const getDateLabel = () => {
    if (isToday(date)) {
      return language === 'ru' ? 'Сегодня' : 'Today';
    }
    if (isYesterday(date)) {
      return language === 'ru' ? 'Вчера' : 'Yesterday';
    }
    return format(date, 'd MMMM yyyy', { locale });
  };

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-border/50" />
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 border border-border/50">
        <Calendar className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {getDateLabel()}
        </span>
      </div>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}
