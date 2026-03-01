import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPRZ_TAXONOMY, getSprzSubtypesForTypes } from '@/lib/sprzTaxonomy';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, ChevronsUpDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface SprzTypeSelectorProps {
  typeIds: string[];
  subtypeIds: string[];
  onTypeChange: (typeIds: string[]) => void;
  onSubtypeChange: (subtypeIds: string[]) => void;
  disabled?: boolean;
}

export function SprzTypeSelector({
  typeIds,
  subtypeIds,
  onTypeChange,
  onSubtypeChange,
  disabled,
}: SprzTypeSelectorProps) {
  const { language } = useLanguage();

  const toggleType = (id: string) => {
    let next: string[];
    if (typeIds.includes(id)) {
      next = typeIds.filter(t => t !== id);
      // Remove subtypes that belonged to the deselected type
      const removedType = SPRZ_TAXONOMY.find(t => t.id === id);
      if (removedType) {
        const removedSubIds = new Set(removedType.subtypes.map(s => s.id));
        onSubtypeChange(subtypeIds.filter(s => !removedSubIds.has(s)));
      }
    } else {
      next = [...typeIds, id];
    }
    onTypeChange(next);
  };

  const toggleSubtype = (id: string) => {
    if (subtypeIds.includes(id)) {
      onSubtypeChange(subtypeIds.filter(s => s !== id));
    } else {
      onSubtypeChange([...subtypeIds, id]);
    }
  };

  const groupedSubtypes = getSprzSubtypesForTypes(typeIds);

  const selectedTypeLabels = typeIds
    .map(id => SPRZ_TAXONOMY.find(t => t.id === id))
    .filter(Boolean)
    .map(t => ({ id: t!.id, label: `${t!.icon} ${language === 'ru' ? t!.label.ru : t!.label.en}` }));

  const allSubtypes = groupedSubtypes.flatMap(g => g.subtypes);
  const selectedSubtypeLabels = subtypeIds
    .map(id => allSubtypes.find(s => s.id === id))
    .filter(Boolean)
    .map(s => ({ id: s!.id, label: language === 'ru' ? s!.label.ru : s!.label.en }));

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Type multi-select */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-sm font-normal gap-1" disabled={disabled}>
            {selectedTypeLabels.length > 0
              ? `${language === 'ru' ? 'Тип' : 'Type'} (${selectedTypeLabels.length})`
              : (language === 'ru' ? 'Тип СПРЗ...' : 'SPRZ type...')}
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-2" align="start">
          <div className="space-y-1">
            {SPRZ_TAXONOMY.map((type) => (
              <label
                key={type.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer text-sm"
              >
                <Checkbox
                  checked={typeIds.includes(type.id)}
                  onCheckedChange={() => toggleType(type.id)}
                />
                <span>{type.icon} {language === 'ru' ? type.label.ru : type.label.en}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Subtype multi-select — grouped by type */}
      {groupedSubtypes.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-sm font-normal gap-1" disabled={disabled}>
              {selectedSubtypeLabels.length > 0
                ? `${language === 'ru' ? 'Области' : 'Areas'} (${selectedSubtypeLabels.length})`
                : (language === 'ru' ? 'Уточнить...' : 'Specify...')}
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[260px] p-2" align="start">
            <div className="space-y-2">
              {groupedSubtypes.map(({ type, subtypes }) => (
                <div key={type.id}>
                  <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                    {type.icon} {language === 'ru' ? type.label.ru : type.label.en}
                  </div>
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
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Selected types as badges */}
      {selectedTypeLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTypeLabels.map(({ id, label }) => (
            <Badge key={id} variant="outline" className="text-xs flex items-center gap-1 pr-1">
              {label}
              <button
                type="button"
                onClick={() => toggleType(id)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
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
