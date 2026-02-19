import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { User, Camera, Trash2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileTabProps {
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  avatarSaving: boolean;
  saving: boolean;
  language: string;
  t: (key: string) => string;
  onDisplayNameChange: (v: string) => void;
  onUsernameChange: (v: string) => void;
  onSave: () => void;
  onAvatarFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteAvatar: () => void;
}

export function ProfileTab({
  email, displayName, username, avatarUrl, avatarSaving, saving, language, t,
  onDisplayNameChange, onUsernameChange, onSave, onAvatarFileSelect, onDeleteAvatar,
}: ProfileTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <HydraCard variant="glass" className="p-6">
      <HydraCardHeader>
        <User className="h-5 w-5 text-primary" />
        <HydraCardTitle>{t('nav.profile')}</HydraCardTitle>
      </HydraCardHeader>
      <HydraCardContent className="space-y-4">
        {/* Avatar section */}
        <div className="flex items-center gap-4 pb-2">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-border">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-muted">
                <User className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            {avatarSaving && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onAvatarFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarSaving}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              {language === 'ru' ? 'Загрузить фото' : 'Upload photo'}
            </Button>
            {avatarUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteAvatar}
                disabled={avatarSaving}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {language === 'ru' ? 'Удалить' : 'Delete'}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {language === 'ru' ? 'JPEG, PNG, WebP · до 2 МБ' : 'JPEG, PNG, WebP · up to 2 MB'}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} disabled className="opacity-60" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">{t('auth.displayName')}</Label>
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="johndoe"
          />
        </div>

        <Button onClick={onSave} disabled={saving} className="hydra-glow-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
          {t('profile.save')}
        </Button>
      </HydraCardContent>
    </HydraCard>
  );
}
