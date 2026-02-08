import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Eye, EyeOff, CalendarDays, AlertTriangle, Clock } from 'lucide-react';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isPast, isBefore, addDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

export interface KeyMetadata {
  added_at?: string | null;
  expires_at?: string | null;
}

interface ApiKeyFieldProps {
  provider: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: React.ReactNode;
  metadata?: KeyMetadata;
  onExpirationChange?: (date: string | null) => void;
  unlimited?: boolean;
}

export function ApiKeyField({
  provider,
  label,
  value,
  onChange,
  placeholder,
  hint,
  metadata,
  onExpirationChange,
  unlimited,
}: ApiKeyFieldProps) {
  const { language } = useLanguage();
  const [showKey, setShowKey] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const Logo = PROVIDER_LOGOS[provider];
  const color = PROVIDER_COLORS[provider];

  const addedAt = metadata?.added_at ? new Date(metadata.added_at) : null;
  const expiresAt = metadata?.expires_at ? new Date(metadata.expires_at) : null;

  const isExpired = expiresAt ? isPast(expiresAt) : false;
  const isExpiringSoon = expiresAt && !isExpired ? isBefore(expiresAt, addDays(new Date(), 14)) : false;

  const locale = language === 'ru' ? ru : enUS;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onExpirationChange?.(format(date, 'yyyy-MM-dd'));
    } else {
      onExpirationChange?.(null);
    }
    setCalendarOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={provider} className="flex items-center gap-2">
        {Logo && <Logo className={cn("h-5 w-5", color)} />}
        {label}
      </Label>
      <div className="relative">
        <Input
          id={provider}
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-20"
        />
        <div className="absolute right-0 top-0 h-full flex items-center">
          {value && onExpirationChange && !unlimited && (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-full px-2",
                    isExpired && "text-destructive",
                    isExpiringSoon && !isExpired && "text-amber-500"
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 border-b">
                  <p className="text-sm font-medium">
                    {language === 'ru' ? 'Срок действия ключа' : 'Key expiration date'}
                  </p>
                  {expiresAt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 text-xs text-muted-foreground"
                      onClick={() => { onExpirationChange?.(null); setCalendarOpen(false); }}
                    >
                      {language === 'ru' ? 'Убрать срок' : 'Remove expiration'}
                    </Button>
                  )}
                </div>
                <Calendar
                  mode="single"
                  selected={expiresAt || undefined}
                  onSelect={handleDateSelect}
                  locale={locale}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-full px-3"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Metadata info line */}
      {value && (addedAt || expiresAt || unlimited) && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {addedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {language === 'ru' ? 'Добавлен' : 'Added'}: {format(addedAt, 'dd.MM.yyyy', { locale })}
            </span>
          )}
          {unlimited && (
            <span className="flex items-center gap-1 text-emerald-500 font-medium">
              <CalendarDays className="h-3 w-3" />
              {language === 'ru' ? 'Бессрочный' : 'Unlimited'}
            </span>
          )}
          {!unlimited && expiresAt && (
            <span className={cn(
              "flex items-center gap-1",
              isExpired && "text-destructive font-medium",
              isExpiringSoon && !isExpired && "text-amber-500 font-medium"
            )}>
              {isExpired ? (
                <AlertTriangle className="h-3 w-3" />
              ) : isExpiringSoon ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <CalendarDays className="h-3 w-3" />
              )}
              {isExpired
                ? (language === 'ru' ? 'Истёк' : 'Expired')
                : isExpiringSoon
                  ? (language === 'ru'
                    ? `Истекает через ${differenceInDays(expiresAt, new Date())} дн.`
                    : `Expires in ${differenceInDays(expiresAt, new Date())} days`)
                  : (language === 'ru' ? 'До' : 'Until')
              }: {format(expiresAt, 'dd.MM.yyyy', { locale })}
            </span>
          )}
        </div>
      )}

      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
