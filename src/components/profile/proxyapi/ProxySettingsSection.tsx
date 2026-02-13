import React from 'react';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2 } from 'lucide-react';
import { CloudSyncIndicator } from '@/components/ui/CloudSyncIndicator';
import type { ProxyApiSettings } from './types';

interface ProxySettingsSectionProps {
  settings: ProxyApiSettings;
  onSettingsChange: (updater: (s: ProxyApiSettings) => ProxyApiSettings) => void;
  syncLoaded?: boolean;
}

export function ProxySettingsSection({ settings, onSettingsChange, syncLoaded = true }: ProxySettingsSectionProps) {
  return (
    <AccordionItem value="settings" className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            <span className="font-semibold">Настройки</span>
          </div>
          <CloudSyncIndicator loaded={syncLoaded} />
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Таймаут (сек)</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[settings.timeout_sec]}
                onValueChange={([v]) => onSettingsChange(s => ({ ...s, timeout_sec: v }))}
                min={10}
                max={120}
                step={5}
                className="flex-1"
              />
              <span className="text-sm font-mono w-10 text-right">{settings.timeout_sec}s</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Макс. повторов (retry)</Label>
            <Select
              value={String(settings.max_retries)}
              onValueChange={(v) => onSettingsChange(s => ({ ...s, max_retries: Number(v) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — без повторов</SelectItem>
                <SelectItem value="1">1 повтор</SelectItem>
                <SelectItem value="2">2 повтора</SelectItem>
                <SelectItem value="3">3 повтора</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="fallback-enabled"
            checked={settings.fallback_enabled}
            onCheckedChange={(checked) => onSettingsChange(s => ({ ...s, fallback_enabled: !!checked }))}
          />
          <Label htmlFor="fallback-enabled" className="text-sm cursor-pointer">
            Автоматический фолбэк на Lovable AI при ошибках
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Настройки сохраняются локально и применяются при следующих запросах через ProxyAPI.
        </p>
      </AccordionContent>
    </AccordionItem>
  );
}
