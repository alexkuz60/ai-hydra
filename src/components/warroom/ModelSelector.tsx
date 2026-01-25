import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAvailableModels, ModelOption } from '@/hooks/useAvailableModels';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Key, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ModelSelector({ value, onChange, className }: ModelSelectorProps) {
  const { t } = useLanguage();
  const { isAdmin, lovableModels, personalModels, hasAnyModels, loading } = useAvailableModels();

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={cn('w-[200px]', className)}>
          <SelectValue placeholder={t('common.loading')} />
        </SelectTrigger>
      </Select>
    );
  }

  if (!hasAnyModels) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 text-hydra-critical" />
        <span>{t('warRoom.noApiKeys')}</span>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn('w-[220px]', className)}>
        <SelectValue placeholder={t('warRoom.selectModel')} />
      </SelectTrigger>
      <SelectContent className="hydra-glass max-h-[300px]">
        {/* Lovable AI Models (Admin only) */}
        {lovableModels.length > 0 && (
          <SelectGroup>
            <SelectLabel className="flex items-center gap-2 text-primary">
              <Sparkles className="h-3 w-3" />
              Lovable AI
            </SelectLabel>
            {lovableModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {/* Personal API Key Models */}
        {personalModels.length > 0 && (
          <SelectGroup>
            <SelectLabel className="flex items-center gap-2 text-muted-foreground">
              <Key className="h-3 w-3" />
              {t('warRoom.personalKeys')}
            </SelectLabel>
            {personalModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
