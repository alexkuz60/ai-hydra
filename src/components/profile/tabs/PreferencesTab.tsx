import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Settings, Moon, Sun, Globe, Type, Loader2, Check } from 'lucide-react';
import type { FontSize } from '@/contexts/ThemeContext';

interface PreferencesTabProps {
  theme: 'dark' | 'light';
  language: string;
  fontSize: FontSize;
  saving: boolean;
  availableLanguages: { code: string; name: string }[];
  t: (key: string) => string;
  onThemeChange: (v: 'dark' | 'light') => void;
  onLanguageChange: (v: 'ru' | 'en') => void;
  onFontSizeChange: (v: FontSize) => void;
  onSave: () => void;
}

export function PreferencesTab({
  theme, language, fontSize, saving, availableLanguages, t,
  onThemeChange, onLanguageChange, onFontSizeChange, onSave,
}: PreferencesTabProps) {
  return (
    <HydraCard variant="glass" className="p-6">
      <HydraCardHeader>
        <Settings className="h-5 w-5 text-primary" />
        <HydraCardTitle>{t('profile.preferences')}</HydraCardTitle>
      </HydraCardHeader>
      <HydraCardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {t('profile.theme')}
          </Label>
          <Select value={theme} onValueChange={onThemeChange}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">{t('profile.themeDark')}</SelectItem>
              <SelectItem value="light">{t('profile.themeLight')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('profile.language')}
          </Label>
          <Select value={language} onValueChange={onLanguageChange as (v: string) => void}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            {t('profile.fontSize')}
          </Label>
          <Select value={fontSize} onValueChange={onFontSizeChange as (v: string) => void}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">{t('profile.fontNormal')}</SelectItem>
              <SelectItem value="large">{t('profile.fontLarge')}</SelectItem>
              <SelectItem value="xlarge">{t('profile.fontXLarge')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t('profile.fontSizeHint')}</p>
        </div>

        <Button onClick={onSave} disabled={saving} className="hydra-glow-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
          {t('profile.save')}
        </Button>
      </HydraCardContent>
    </HydraCard>
  );
}
