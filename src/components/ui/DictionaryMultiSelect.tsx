import React, { useState, useMemo } from 'react';
import { X, Plus, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Dictionary, DictionaryEntry } from '@/config/behaviorDictionaries';
import { getEntryLabel, findEntryByKey } from '@/config/behaviorDictionaries';

interface DictionaryMultiSelectProps {
  dictionary: Dictionary;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
}

// Helper to get description by language
function getEntryDescription(entry: DictionaryEntry, language: 'ru' | 'en'): string | undefined {
  return entry.description?.[language];
}

export function DictionaryMultiSelect({
  dictionary,
  values,
  onChange,
  placeholder,
  allowCustom = true,
  className,
}: DictionaryMultiSelectProps) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Get display labels for selected values
  const selectedLabels = useMemo(() => {
    return values.map(v => {
      const entry = findEntryByKey(dictionary, v);
      return {
        key: v,
        label: entry ? getEntryLabel(entry, language) : v,
        description: entry ? getEntryDescription(entry, language) : undefined,
      };
    });
  }, [values, dictionary, language]);

  // Available entries (not yet selected)
  const availableEntries = useMemo(() => {
    return dictionary.entries.filter(entry => !values.includes(entry.key));
  }, [dictionary, values]);

  const handleSelect = (entryKey: string) => {
    if (!values.includes(entryKey)) {
      onChange([...values, entryKey]);
    }
  };

  const handleRemove = (key: string) => {
    onChange(values.filter(v => v !== key));
  };

  const handleCustomSubmit = () => {
    const trimmed = customValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setCustomValue('');
      setCustomMode(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customMode) {
      e.preventDefault();
      handleCustomSubmit();
    }
    if (e.key === 'Escape') {
      setCustomMode(false);
      setCustomValue('');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected tags with tooltips */}
      {selectedLabels.length > 0 && (
        <TooltipProvider delayDuration={300}>
          <div className="flex flex-wrap gap-1.5">
            {selectedLabels.map(({ key, label, description }) => {
              const badge = (
                <Badge
                  key={key}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => handleRemove(key)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );

              if (description) {
                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      {badge}
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p className="text-sm">{description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return badge;
            })}
          </div>
        </TooltipProvider>
      )}

      {/* Custom input mode */}
      {customMode ? (
        <div className="flex gap-2">
          <Input
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('patterns.dictionary.customPlaceholder')}
            autoFocus
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleCustomSubmit}
            disabled={!customValue.trim()}
          >
            {t('common.add')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setCustomMode(false);
              setCustomValue('');
            }}
          >
            {t('common.cancel')}
          </Button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              <span className="text-muted-foreground">
                {placeholder || t('patterns.dictionary.addFormat')}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandInput placeholder={t('patterns.dictionary.searchPlaceholder')} />
              <CommandList>
                <CommandEmpty>{t('patterns.dictionary.noResults')}</CommandEmpty>
                
                <TooltipProvider delayDuration={300}>
                  <CommandGroup>
                    {availableEntries.map((entry) => {
                      const description = getEntryDescription(entry, language);
                      const itemContent = (
                        <CommandItem
                          key={entry.key}
                          value={`${entry.key} ${getEntryLabel(entry, language)}`}
                          onSelect={() => {
                            handleSelect(entry.key);
                            setOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{getEntryLabel(entry, language)}</span>
                        </CommandItem>
                      );

                      if (description) {
                        return (
                          <Tooltip key={entry.key}>
                            <TooltipTrigger asChild>
                              {itemContent}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                              <p className="text-sm">{description}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return itemContent;
                    })}
                  </CommandGroup>
                </TooltipProvider>
                
                {allowCustom && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        value="__custom__"
                        onSelect={() => {
                          setCustomMode(true);
                          setOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t('patterns.dictionary.other')}
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
