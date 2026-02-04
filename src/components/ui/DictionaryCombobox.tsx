import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { getEntryLabel, findEntryByKey, getEntriesByCategory } from '@/config/behaviorDictionaries';

interface DictionaryComboboxProps {
  dictionary: Dictionary;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
}

// Helper to get description by language
function getEntryDescription(entry: DictionaryEntry, language: 'ru' | 'en'): string | undefined {
  return entry.description?.[language];
}

export function DictionaryCombobox({
  dictionary,
  value,
  onChange,
  placeholder,
  allowCustom = true,
  className,
}: DictionaryComboboxProps) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Find current entry or treat as custom value
  const currentEntry = useMemo(() => findEntryByKey(dictionary, value), [dictionary, value]);
  
  // Display value - either entry label or raw value
  const displayValue = useMemo(() => {
    if (currentEntry) {
      return getEntryLabel(currentEntry, language);
    }
    return value || '';
  }, [currentEntry, value, language]);

  // Group entries by category if categories exist
  const groupedEntries = useMemo(() => {
    if (!dictionary.categories?.length) {
      return [{ key: 'all', label: '', entries: dictionary.entries }];
    }
    
    return dictionary.categories.map(category => ({
      key: category.key,
      label: category.label[language],
      entries: getEntriesByCategory(dictionary, category.key),
    }));
  }, [dictionary, language]);

  const handleSelect = (entryKey: string) => {
    onChange(entryKey);
    setOpen(false);
    setCustomMode(false);
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setCustomMode(false);
      setCustomValue('');
      setOpen(false);
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

  if (customMode) {
    return (
      <div className={cn('flex gap-2', className)}>
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
          {t('common.apply')}
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
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className={cn('truncate', !displayValue && 'text-muted-foreground')}>
            {displayValue || placeholder || t('patterns.dictionary.select')}
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
              {groupedEntries.map((group, groupIndex) => (
                <React.Fragment key={group.key}>
                  {groupIndex > 0 && <CommandSeparator />}
                  <CommandGroup heading={group.label || undefined}>
                    {group.entries.map((entry) => {
                      const description = getEntryDescription(entry, language);
                      const itemContent = (
                        <CommandItem
                          key={entry.key}
                          value={`${entry.key} ${getEntryLabel(entry, language)}`}
                          onSelect={() => handleSelect(entry.key)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 flex-shrink-0',
                              value === entry.key ? 'opacity-100' : 'opacity-0'
                            )}
                          />
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
                </React.Fragment>
              ))}
            </TooltipProvider>
            
            {allowCustom && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="__custom__"
                    onSelect={() => {
                      setCustomMode(true);
                      setCustomValue(currentEntry ? '' : value);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <PenLine className="mr-2 h-4 w-4" />
                    {t('patterns.dictionary.other')}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
