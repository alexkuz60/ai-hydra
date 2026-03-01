import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPRZ_TAXONOMY, getSprzSubtypes } from '@/lib/sprzTaxonomy';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown } from 'lucide-react';

interface SprzTypeSelectorProps {
  typeId: string;
  subtypeIds: string[];
  onTypeChange: (typeId: string) => void;
  onSubtypeChange: (subtypeIds: string[]) => void;
  disabled?: boolean;
}

export function SprzTypeSelector({
  typeId,
  subtypeIds,
  onTypeChange,
  onSubtypeChange,
  disabled,
}: SprzTypeSelectorProps) {
  const { language } = useLanguage();
  const subtypes = getSprzSubtypes(typeId);

  const handleTypeChange = (value: string) => {
    onTypeChange(value);
    onSubtypeChange([]);
  };

  const toggleSubtype = (id: string) => {
    if (subtypeIds.includes(id)) {
      onSubtypeChange(subtypeIds.filter(s => s !== id));
    } else {
      onSubtypeChange([...subtypeIds, id]);
    }
  };

  const selectedSubtypeLabels = subtypeIds
    .map(id => subtypes.find(s => s.id === id))
    .filter(Boolean)
    .map(s => ({ id: s!.id, label: language === 'ru' ? s!.label.ru : s!.label.en }));

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={typeId || '__none'} onValueChange={(v) => handleTypeChange(v === '__none' ? '' : v)} disabled={disabled}>
        <SelectTrigger className="h-8 w-auto min-w-[160px] text-sm">
          <SelectValue placeholder={language === 'ru' ? 'Тип СПРЗ...' : 'SPRZ type...'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">
            <span className="text-muted-foreground">{language === 'ru' ? '— Не выбран —' : '— Not selected —'}</span>
          </SelectItem>
          {SPRZ_TAXONOMY.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              <span>{type.icon} {language === 'ru' ? type.label.ru : type.label.en}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {typeId && subtypes.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-sm font-normal gap-1" disabled={disabled}>
              {selectedSubtypeLabels.length > 0
                ? `${language === 'ru' ? 'Области' : 'Areas'} (${selectedSubtypeLabels.length})`
                : (language === 'ru' ? 'Уточнить...' : 'Specify...')}
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-2" align="start">
            <div className="space-y-1">
              {subtypes.map((sub) => (
                <label
                  key={sub.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={subtypeIds.includes(sub.id)}
                    onCheckedChange={() => toggleSubtype(sub.id)}
                  />
                  {language === 'ru' ? sub.label.ru : sub.label.en}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Selected subtypes as badges */}
      {selectedSubtypeLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedSubtypeLabels.map(({ id, label }) => (
            <Badge key={id} variant="secondary" className="text-xs flex items-center gap-1 pr-1">
              {label}
              <button
                type="button"
                onClick={() => toggleSubtype(id)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
