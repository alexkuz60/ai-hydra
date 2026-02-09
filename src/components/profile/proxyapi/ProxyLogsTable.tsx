import React from 'react';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { History, RefreshCw, Download, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogEntry } from './types';
import { STATUS_EXPLANATIONS } from './types';

interface ProxyLogsTableProps {
  logs: LogEntry[];
  logsLoading: boolean;
  onRefresh: () => void;
  onExportCSV: () => void;
}

export function ProxyLogsTable({ logs, logsLoading, onRefresh, onExportCSV }: ProxyLogsTableProps) {
  return (
    <AccordionItem value="logs" className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <span className="font-semibold">Последние запросы</span>
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
            Обновить
          </Button>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Нет записей</p>
        ) : (
          <div className="overflow-x-auto">
            <TooltipProvider delayDuration={200}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-3">Модель</th>
                    <th className="text-left py-2 pr-3">
                      <div className="flex items-center gap-1">
                        Тип
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px]">
                            <p className="text-xs">Тип запроса: stream (потоковый), test (тестовый), ping (проверка связи)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                    <th className="text-left py-2 pr-3">
                      <div className="flex items-center gap-1">
                        Статус
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[250px]">
                            <div className="text-xs space-y-1">
                              <p><strong className="text-emerald-400">success</strong> — OK</p>
                              <p><strong className="text-destructive">error</strong> — ошибка запроса</p>
                              <p><strong className="text-amber-500">timeout</strong> — превышение таймаута</p>
                              <p><strong className="text-destructive">gone</strong> — модель удалена (410)</p>
                              <p><strong className="text-blue-400">fallback</strong> — авто-переключение</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                    <th className="text-right py-2 pr-3">Латенси</th>
                    <th className="text-right py-2 pr-3">Токены</th>
                    <th className="text-right py-2">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <LogRow key={log.id} log={log} />
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

function LogRow({ log }: { log: LogEntry }) {
  const modelShort = log.model_id.replace('proxyapi/', '');
  const date = new Date(log.created_at);
  const timeStr = `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  const tokens = (log.tokens_input || log.tokens_output)
    ? `${log.tokens_input || 0}/${log.tokens_output || 0}`
    : '—';

  const statusColor = log.status === 'success' ? 'text-emerald-400'
    : log.status === 'gone' ? 'text-destructive'
    : log.status === 'timeout' ? 'text-amber-500'
    : log.status === 'fallback' ? 'text-blue-400'
    : 'text-destructive';

  const statusExpl = STATUS_EXPLANATIONS[log.status];
  const typeExpl = STATUS_EXPLANATIONS[log.request_type];

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
              {log.error_message && <p className="text-xs text-destructive mt-1">Ошибка: {log.error_message}</p>}
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
