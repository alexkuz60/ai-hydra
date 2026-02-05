import React, { useMemo } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  SUPERVISOR_WISHES_DICTIONARY,
  getSupervisorWishesForRole,
  type SupervisorWish,
} from '@/config/behaviorDictionaries';
import type { MessageRole } from '@/config/roles';

interface SupervisorWishesPickerProps {
  selectedWishes: string[];
  onWishesChange: (wishes: string[]) => void;
  activeRoles: MessageRole[];
  disabled?: boolean;
}

export function SupervisorWishesPicker({
  selectedWishes,
  onWishesChange,
  activeRoles,
  disabled = false,
}: SupervisorWishesPickerProps) {
  const { t, language } = useLanguage();

  // Get applicable wishes for current active roles
  const applicableWishes = useMemo(() => {
    if (activeRoles.length === 0) return [];

    // Collect all unique wishes applicable to active roles
    const wishesSet = new Set<string>();
    activeRoles.forEach((role) => {
      const roleWishes = getSupervisorWishesForRole(role);
      roleWishes.forEach((wish) => wishesSet.add(wish.key));
    });

    return SUPERVISOR_WISHES_DICTIONARY.filter((wish) =>
      wishesSet.has(wish.key)
    );
  }, [activeRoles]);

  const handleToggleWish = (wishKey: string) => {
    if (selectedWishes.includes(wishKey)) {
      onWishesChange(selectedWishes.filter((w) => w !== wishKey));
    } else {
      onWishesChange([...selectedWishes, wishKey]);
    }
  };

  const handleClearAll = () => {
    onWishesChange([]);
  };

  const selectedWishLabels = selectedWishes
    .map((key) => SUPERVISOR_WISHES_DICTIONARY.find((w) => w.key === key))
    .filter(Boolean) as SupervisorWish[];

  const triggerTitle =
    activeRoles.length === 0
      ? t('supervisorWishes.noRolesSelected')
      : t('supervisorWishes.selectWishes');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={triggerTitle}
          aria-label={triggerTitle}
          className={cn(
            'h-9 w-9',
            selectedWishes.length > 0 &&
              'bg-hydra-promptengineer/20 text-hydra-promptengineer hover:bg-hydra-promptengineer/30'
          )}
          disabled={disabled || activeRoles.length === 0}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-3" align="end" side="top">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">
                {t('supervisorWishes.title')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('supervisorWishes.description')}
              </p>
            </div>
            {selectedWishes.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Wishes list */}
          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {applicableWishes.length > 0 ? (
              applicableWishes.map((wish) => (
                <div
                  key={wish.key}
                  className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={wish.key}
                    checked={selectedWishes.includes(wish.key)}
                    onCheckedChange={() => handleToggleWish(wish.key)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={wish.key}
                    className="flex-1 cursor-pointer text-xs"
                  >
                    <div className="font-medium text-foreground">
                      {wish.label[language as 'ru' | 'en']}
                    </div>
                    {wish.description && (
                      <div className="text-muted-foreground">
                        {wish.description[language as 'ru' | 'en']}
                      </div>
                    )}
                  </label>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                {t('supervisorWishes.noWishesForRoles')}
              </div>
            )}
          </div>

          {/* Selected wishes summary */}
          {selectedWishes.length > 0 && (
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground mb-2">
                {t('supervisorWishes.selected')}: {selectedWishes.length}
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedWishLabels.map((wish) => (
                  <div
                    key={wish.key}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-hydra-promptengineer/10 border border-hydra-promptengineer/30 text-hydra-promptengineer text-xs"
                  >
                    <span>{wish.label[language as 'ru' | 'en']}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWish(wish.key);
                      }}
                      className="hover:text-hydra-promptengineer/80"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
