import React, { useMemo, useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  SUPERVISOR_WISHES_DICTIONARY,
  getSupervisorWishesForRole,
  type SupervisorWish,
} from '@/config/behaviorDictionaries';
import { ROLE_CONFIG, type MessageRole } from '@/config/roles';

interface SupervisorWishesPickerProps {
  selectedWishes: string[];
  onWishesChange: (wishes: string[]) => void;
  activeRoles: MessageRole[];
  disabled?: boolean;
  supervisorDisplayName?: string | null;
}

export function SupervisorWishesPicker({
  selectedWishes,
  onWishesChange,
  activeRoles,
  disabled = false,
  supervisorDisplayName,
}: SupervisorWishesPickerProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

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

  // Auto-cleanup: remove wishes that are no longer applicable when roles change
  useEffect(() => {
    if (activeRoles.length === 0 || selectedWishes.length === 0) return;

    const applicableKeys = new Set<string>();
    activeRoles.forEach((role) => {
      getSupervisorWishesForRole(role).forEach((w) => applicableKeys.add(w.key));
    });

    const filtered = selectedWishes.filter((key) => applicableKeys.has(key));
    if (filtered.length !== selectedWishes.length) {
      onWishesChange(filtered);
    }
  }, [activeRoles, selectedWishes, onWishesChange]);

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

  const handleRowClick = (e: React.MouseEvent, wishKey: string) => {
    e.stopPropagation();
    e.preventDefault();
    handleToggleWish(wishKey);
  };

  const selectedWishLabels = selectedWishes
    .map((key) => SUPERVISOR_WISHES_DICTIONARY.find((w) => w.key === key))
    .filter(Boolean) as SupervisorWish[];

  // Dynamic title based on active roles
  const dynamicRoleNames = useMemo(() => {
    if (activeRoles.length === 0) return '';
    
    const roleNames = activeRoles
      .map((role) => {
        const config = ROLE_CONFIG[role as MessageRole];
        return config ? t(config.label) : role;
      })
      .filter(Boolean);
    
    if (roleNames.length === 1) return roleNames[0];
    if (roleNames.length === 2) return `${roleNames[0]} ${t('common.and')} ${roleNames[1]}`;
    return `${roleNames.slice(0, 2).join(', ')} +${roleNames.length - 2}`;
  }, [activeRoles, t]);

  const triggerTitle =
    activeRoles.length === 0
      ? (supervisorDisplayName ? `${t('supervisorWishes.title')} (${supervisorDisplayName})` : t('supervisorWishes.title'))
      : `→ ${dynamicRoleNames}`;

  const popoverTitle =
    activeRoles.length === 0
      ? (supervisorDisplayName ? `${t('supervisorWishes.title')} (${supervisorDisplayName})` : t('supervisorWishes.title'))
      : `→ ${dynamicRoleNames}`;

  const isDisabled = disabled || activeRoles.length === 0;

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
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
            disabled={isDisabled}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent 
          className="w-80 p-3" 
          align="end" 
          side="top"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">
                  {popoverTitle}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('supervisorWishes.description')}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Wishes list */}
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {applicableWishes.length > 0 ? (
                applicableWishes.map((wish) => (
                  <div
                    key={wish.key}
                    onClick={(e) => handleRowClick(e, wish.key)}
                    className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      id={wish.key}
                      checked={selectedWishes.includes(wish.key)}
                      onCheckedChange={() => {}}
                      className="mt-0.5 pointer-events-none"
                    />
                    <div className="flex-1 text-xs">
                      <div className="font-medium text-foreground">
                        {wish.label[language as 'ru' | 'en']}
                      </div>
                      {wish.description && (
                        <div className="text-muted-foreground">
                          {wish.description[language as 'ru' | 'en']}
                        </div>
                      )}
                    </div>
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
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">
                    {t('supervisorWishes.selected')}: {selectedWishes.length}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearAll();
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t('supervisorWishes.clearAll')}
                  </button>
                </div>
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

      {/* Badge positioned outside PopoverTrigger to avoid nested triggers */}
      {selectedWishes.length > 0 && (
        <Badge 
          variant="default"
          className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center px-1 text-xs bg-hydra-promptengineer text-white pointer-events-none"
        >
          {selectedWishes.length}
        </Badge>
      )}
    </div>
  );
}
