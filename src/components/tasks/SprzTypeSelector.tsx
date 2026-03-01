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

interface SprzTypeSelectorProps {
  typeId: string;
  subtypeId: string;
  onTypeChange: (typeId: string) => void;
  onSubtypeChange: (subtypeId: string) => void;
  disabled?: boolean;
}

export function SprzTypeSelector({
  typeId,
  subtypeId,
  onTypeChange,
  onSubtypeChange,
  disabled,
}: SprzTypeSelectorProps) {
  const { language } = useLanguage();

  const subtypes = getSprzSubtypes(typeId);

  const handleTypeChange = (value: string) => {
    onTypeChange(value);
    // Reset subtype when type changes
    onSubtypeChange('');
  };

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
        <Select value={subtypeId || '__none'} onValueChange={(v) => onSubtypeChange(v === '__none' ? '' : v)} disabled={disabled}>
          <SelectTrigger className="h-8 w-auto min-w-[180px] text-sm">
            <SelectValue placeholder={language === 'ru' ? 'Область...' : 'Area...'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">
              <span className="text-muted-foreground">{language === 'ru' ? '— Уточнить —' : '— Specify —'}</span>
            </SelectItem>
            {subtypes.map((sub) => (
              <SelectItem key={sub.id} value={sub.id}>
                {language === 'ru' ? sub.label.ru : sub.label.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
