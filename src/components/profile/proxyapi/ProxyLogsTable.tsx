import React from 'react';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { History, RefreshCw, Download, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { LogEntry } from './types';
import { getStatusExpl } from './types';

interface ProxyLogsTableProps {
  logs: LogEntry[];
  logsLoading: boolean;
  onRefresh: () => void;
  onExportCSV: () => void;
}

export function ProxyLogsTable({ logs, logsLoading, onRefresh, onExportCSV }: ProxyLogsTableProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const lang = isRu ? 'ru' : 'en';

  return (
    <AccordionItem value="logs" className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <span className="font-semibold">{isRu ? 'Последние запросы' : 'Recent Requests'}</span>
          <Badge variant="secondary" className="ml-2">{logs.length}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="flex justify-end gap-2 mb-2">
          <Button size="sm" variant="ghost" onClick={onExportCSV} disabled={logs.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1" />
            CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={onRefresh} disabled={logsLoading}>
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1", logsLoading && "animate-spin")} />
            {isRu ? 'Обновить' : 'Refresh'}
          </Button>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{isRu ? 'Нет записей' : 'No records'}</p>
        ) : (
          <div className="overflow-x-auto">
            <TooltipProvider delayDuration={200}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-3">{isRu ? 'Модель' : 'Model'}</th>
                    <th className="text-left py-2 pr-3">
                      <div className="flex items-center gap-1">
                        {isRu ? 'Тип' : 'Type'}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px]">
                            <p className="text-xs">
                              {isRu
                                ? 'Тип запроса: stream (потоковый), test (тестовый), ping (проверка связи)'
                                : 'Request type: stream (streaming), test (testing), ping (connectivity check)'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                    <th className="text-left py-2 pr-3">
                      <div className="flex items-center gap-1">
                        {isRu ? 'Статус' : 'Status'}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[250px]">
                            <div className="text-xs space-y-1">
                              <p><strong className="text-emerald-400">success</strong> — OK</p>
                              <p><strong className="text-destructive">error</strong> — {isRu ? 'ошибка запроса' : 'request error'}</p>
                              <p><strong className="text-amber-500">timeout</strong> — {isRu ? 'превышение таймаута' : 'timeout exceeded'}</p>
                              <p><strong className="text-destructive">gone</strong> — {isRu ? 'модель удалена (410)' : 'model removed (410)'}</p>
                              <p><strong className="text-blue-400">fallback</strong> — {isRu ? 'авто-переключение' : 'auto-fallback'}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                    <th className="text-right py-2 pr-3">{isRu ? 'Латенси' : 'Latency'}</th>
                    <th className="text-right py-2 pr-3">{isRu ? 'Токены' : 'Tokens'}</th>
                    <th className="text-right py-2">{isRu ? 'Дата' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <LogRow key={log.id} log={log} lang={lang} />
                  ))}
                </tbody>
              </table>
            </TooltipProvider>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function LogRow({ log, lang }: { log: LogEntry; lang: 'ru' | 'en' }) {
  const isRu = lang === 'ru';
  const modelShort = log.model_id.replace('proxyapi/', '');
  const date = new Date(log.created_at);
  const locale = isRu ? 'ru-RU' : 'en-US';
  const timeStr = `${date.toLocaleDateString(locale)} ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  const tokens = (log.tokens_input || log.tokens_output)
    ? `${log.tokens_input || 0}/${log.tokens_output || 0}`
    : '—';

  const statusColor = log.status === 'success' ? 'text-emerald-400'
    : log.status === 'gone' ? 'text-destructive'
    : log.status === 'timeout' ? 'text-amber-500'
    : log.status === 'fallback' ? 'text-blue-400'
    : 'text-destructive';

  const statusExpl = getStatusExpl(log.status, lang);
  const typeExpl = getStatusExpl(log.request_type, lang);

  return (
    <tr className="border-b border-border/50 hover:bg-card/50">
      <td className="py-1.5 pr-3 font-medium truncate max-w-[140px]">{modelShort}</td>
      <td className="py-1.5 pr-3">
        {typeExpl ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help border-b border-dotted border-muted-foreground/40">{log.request_type}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px]">
              <p className="text-xs">{typeExpl.description}</p>
            </TooltipContent>
          </Tooltip>
        ) : log.request_type}
      </td>
      <td className={cn("py-1.5 pr-3", statusColor)}>
        {statusExpl ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help border-b border-dotted border-current">{log.status}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[250px]">
              <p className="text-xs font-medium mb-1">{statusExpl.label}</p>
              <p className="text-xs text-muted-foreground">{statusExpl.description}</p>
              {log.error_message && <p className="text-xs text-destructive mt-1">{isRu ? 'Ошибка' : 'Error'}: {log.error_message}</p>}
            </TooltipContent>
          </Tooltip>
        ) : log.status}
      </td>
      <td className="py-1.5 pr-3 text-right font-mono">{log.latency_ms ?? '—'}ms</td>
      <td className="py-1.5 pr-3 text-right font-mono">{tokens}</td>
      <td className="py-1.5 text-right text-muted-foreground">{timeStr}</td>
    </tr>
  );
}
