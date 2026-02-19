import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Bell, BellOff, CheckCheck, Check, ScrollText, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  entry_code: string;
  message: string;
  is_read: boolean;
  created_at: string;
  chronicle_id: string | null;
}

interface NotificationsTabProps {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  language: string;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
}

export function NotificationsTab({
  notifications, loading, unreadCount, language,
  onMarkRead, onMarkAllRead, onDelete,
}: NotificationsTabProps) {
  return (
    <HydraCard variant="glass" className="p-6">
      <HydraCardHeader>
        <Bell className="h-5 w-5 text-hydra-arbiter" />
        <HydraCardTitle>
          {language === 'ru' ? 'Уведомления Супервизора' : 'Supervisor Notifications'}
        </HydraCardTitle>
      </HydraCardHeader>
      <HydraCardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {language === 'ru'
              ? 'Новые ИИ-ревизии Эволюциониста, требующие вашей оценки'
              : 'New AI revisions from the Evolutioner awaiting your review'}
          </p>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllRead}
              disabled={unreadCount === 0}
              className="gap-1.5 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {unreadCount === 0
                ? (language === 'ru' ? 'Прочитаны все' : 'All read')
                : (language === 'ru' ? 'Прочитать все' : 'Mark all read')}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            {language === 'ru' ? 'Загрузка...' : 'Loading...'}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <BellOff className="h-8 w-8 opacity-30" />
            <p className="text-sm">{language === 'ru' ? 'Нет уведомлений' : 'No notifications'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-4 transition-colors',
                  n.is_read
                    ? 'border-border bg-muted/30 opacity-70'
                    : 'border-hydra-arbiter/30 bg-hydra-arbiter/5'
                )}
              >
                <ScrollText className={cn('h-4 w-4 mt-0.5 shrink-0', n.is_read ? 'text-muted-foreground' : 'text-hydra-arbiter')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono text-xs shrink-0">{n.entry_code}</Badge>
                    {!n.is_read && (
                      <span className="text-[10px] font-medium text-hydra-arbiter uppercase tracking-wide">
                        {language === 'ru' ? 'Новое' : 'New'}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {format(new Date(n.created_at), 'dd.MM.yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-snug">{n.message}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.is_read && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMarkRead(n.id)} title={language === 'ru' ? 'Прочитано' : 'Mark read'}>
                      <Check className="h-3.5 w-3.5 text-hydra-success" />
                    </Button>
                  )}
                  {n.chronicle_id && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link to="/hydra-memory" title={language === 'ru' ? 'Перейти к Хроникам' : 'Go to Chronicles'}>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(n.id)} title={language === 'ru' ? 'Удалить' : 'Delete'}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </HydraCardContent>
    </HydraCard>
  );
}
