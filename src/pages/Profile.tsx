import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme, type FontSize } from '@/contexts/ThemeContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Key, Settings, Loader2, Check, Moon, Sun, Globe, Shield, BarChart3, Search, AlertTriangle, Type, Gauge, Camera, Trash2, Bell, BellOff, CheckCheck, ScrollText, ExternalLink } from 'lucide-react';
import { CloudSyncIndicator } from '@/components/ui/CloudSyncIndicator';
import { useCloudSyncStatus } from '@/hooks/useCloudSettings';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { UsageStats } from '@/components/profile/UsageStats';
import { ApiKeyField, type KeyMetadata } from '@/components/profile/ApiKeyField';
import { ProxyApiDashboard } from '@/components/profile/ProxyApiDashboard';
import { GeminiLimitsDialog } from '@/components/profile/GeminiLimitsDialog';
import { OpenRouterLimitsDialog } from '@/components/profile/OpenRouterLimitsDialog';
import { MistralLimitsDialog } from '@/components/profile/MistralLimitsDialog';
import { FirecrawlLimitsDialog } from '@/components/profile/FirecrawlLimitsDialog';
import { AvatarCropDialog } from '@/components/profile/AvatarCropDialog';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSupNotifications } from '@/hooks/useSupNotifications';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';


interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  preferred_language: string;
  preferred_theme: string;
}

// Provider definitions for API keys section
const LLM_PROVIDERS = [
  { provider: 'openai', labelKey: 'profile.openai', placeholder: 'sk-...' },
  { provider: 'gemini', labelKey: 'profile.gemini', placeholder: 'AIza...' },
  { provider: 'anthropic', labelKey: 'profile.anthropic', placeholder: 'sk-ant-...' },
  { provider: 'xai', label: 'xAI (Grok)', placeholder: 'xai-...' },
  { provider: 'openrouter', label: 'OpenRouter (Free Models)', placeholder: 'sk-or-...', hint: { ru: 'openrouter.ai/keys', en: 'openrouter.ai/keys', url: 'https://openrouter.ai/keys' } },
  { provider: 'groq', label: 'Groq (Ultra-Fast Inference)', placeholder: 'gsk_...', hint: { ru: 'console.groq.com/keys', en: 'console.groq.com/keys', url: 'https://console.groq.com/keys' } },
  { provider: 'deepseek', label: 'DeepSeek AI', placeholder: 'sk-...', hint: { ru: 'platform.deepseek.com', en: 'platform.deepseek.com', url: 'https://platform.deepseek.com/api_keys' } },
  { provider: 'mistral', label: 'Mistral AI', placeholder: '...', hint: { ru: 'console.mistral.ai', en: 'console.mistral.ai', url: 'https://console.mistral.ai/api-keys' } },
] as const;

const TOOL_PROVIDERS = [
  { provider: 'firecrawl', label: 'Firecrawl (Web Scraping)', placeholder: 'fc-...', hint: { ru: 'firecrawl.dev', en: 'firecrawl.dev', url: 'https://firecrawl.dev/app/api-keys' } },
] as const;

const SEARCH_PROVIDERS = [
  { provider: 'tavily', labelKey: 'profile.tavily', placeholder: 'tvly-...', hintKey: 'profile.tavilyHint', hintUrl: 'https://tavily.com/app' },
  { provider: 'perplexity', labelKey: 'profile.perplexity', placeholder: 'pplx-...', hintKey: 'profile.perplexityHint', hintUrl: 'https://perplexity.ai/settings/api' },
] as const;

// Map from RPC field names to provider keys
const RPC_KEY_MAP: Record<string, string> = {
  openai_api_key: 'openai',
  google_gemini_api_key: 'gemini',
  anthropic_api_key: 'anthropic',
  xai_api_key: 'xai',
  openrouter_api_key: 'openrouter',
  groq_api_key: 'groq',
  tavily_api_key: 'tavily',
  perplexity_api_key: 'perplexity',
  deepseek_api_key: 'deepseek',
  firecrawl_api_key: 'firecrawl',
  mistral_api_key: 'mistral',
  proxyapi_api_key: 'proxyapi',
};

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { theme, setTheme, fontSize, setFontSize } = useTheme();
  const navigate = useNavigate();
  const cloudSynced = useCloudSyncStatus();
  const { refetch: refetchSidebarProfile } = useUserProfile();
  const { isSupervisor } = useUserRoles();
  const { notifications, loading: notifLoading, unreadCount, markRead, markAllRead, deleteNotification } = useSupNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  // Form states
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  
  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  // API keys as a single record
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [keyMetadata, setKeyMetadata] = useState<Record<string, KeyMetadata>>({});
  const [proxyapiPriority, setProxyapiPriority] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData);
        setDisplayName(profileData.display_name || '');
        setUsername(profileData.username || '');
        setIsAdmin(profileData.username === 'AlexKuz');
        setProxyapiPriority((profileData as any).proxyapi_priority ?? false);

        // Load signed avatar URL if exists
        if (profileData.avatar_url) {
          setAvatarUrl(profileData.avatar_url);
        }
      }

      // Fetch decrypted API keys from Vault + metadata in parallel
      const [apiKeysResult, metadataResult] = await Promise.all([
        supabase.rpc('get_my_api_keys'),
        supabase.rpc('get_my_key_metadata'),
      ]);

      if (apiKeysResult.data && apiKeysResult.data.length > 0) {
        const keys = apiKeysResult.data[0] as Record<string, string | null>;
        const newApiKeys: Record<string, string> = {};
        for (const [rpcField, provider] of Object.entries(RPC_KEY_MAP)) {
          newApiKeys[provider] = keys[rpcField] || '';
        }
        setApiKeys(newApiKeys);
      }

      if (metadataResult.data) {
        setKeyMetadata(metadataResult.data as Record<string, KeyMetadata>);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          username: username,
          preferred_language: language,
          preferred_theme: theme,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success(t('profile.saved'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKeys = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const allProviders = [...LLM_PROVIDERS, ...TOOL_PROVIDERS, ...SEARCH_PROVIDERS];
      const savePromises = allProviders.map(p =>
        supabase.rpc('save_api_key', { p_provider: p.provider, p_api_key: apiKeys[p.provider] || '' })
      );
      // Save proxyapi key if in Russian locale
      if (language === 'ru') {
        savePromises.push(
          supabase.rpc('save_api_key', { p_provider: 'proxyapi', p_api_key: apiKeys['proxyapi'] || '' })
        );
      }

      const results = await Promise.all(savePromises);
      const error = results.find(r => r.error)?.error;

      if (error) throw error;
      
      // Refetch metadata (added_at gets updated on save)
      const { data: newMeta } = await supabase.rpc('get_my_key_metadata');
      if (newMeta) {
        setKeyMetadata(newMeta as Record<string, KeyMetadata>);
      }
      
      toast.success(t('profile.saved'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExpirationChange = useCallback(async (provider: string, date: string | null) => {
    // Optimistic update
    setKeyMetadata(prev => ({
      ...prev,
      [provider]: { ...prev[provider], expires_at: date },
    }));

    try {
      const { error } = await supabase.rpc('set_api_key_expiration', {
        p_provider: provider,
        p_expires_at: date || '',
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  const setKeyValue = useCallback((provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  }, []);

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === 'ru' ? 'Максимальный размер файла — 2 МБ' : 'Max file size is 2 MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(language === 'ru' ? 'Поддерживаются форматы: JPEG, PNG, WebP' : 'Supported formats: JPEG, PNG, WebP');
      return;
    }
    setCropFile(file);
    setCropOpen(true);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleCropComplete = async (blob: Blob) => {
    if (!user) return;
    setAvatarSaving(true);
    try {
      // Store path only — signed URL is generated fresh in useUserProfile
      const filePath = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      // Save the file path (not a signed URL) — avoids expiry issues
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('user_id', user.id);
      if (profileError) throw profileError;

      // Generate a short-lived signed URL for immediate display in this session
      const { data: signedData } = await supabase.storage
        .from('avatars')
        .createSignedUrl(filePath, 60 * 60 * 2);
      setAvatarUrl(signedData?.signedUrl || null);

      refetchSidebarProfile();
      setCropOpen(false);
      toast.success(language === 'ru' ? 'Аватар обновлён' : 'Avatar updated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user) return;
    setAvatarSaving(true);
    try {
      await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`]);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);
      if (error) throw error;
      setAvatarUrl(null);
      refetchSidebarProfile();
      toast.success(language === 'ru' ? 'Аватар удалён' : 'Avatar deleted');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAvatarSaving(false);
    }
  };



  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const renderProviderHint = (p: Record<string, unknown>) => {
    const hintKey = p.hintKey as string | undefined;
    const hintUrl = p.hintUrl as string | undefined;
    const hint = p.hint as { ru: string; en: string; url: string } | undefined;
    
    if (hintKey) {
      return (
        <>
          {t(hintKey)} — <a href={hintUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{hintUrl?.replace('https://', '')}</a>
        </>
      );
    }
    if (hint) {
      return (
        <>
          {language === 'ru' ? 'Получите ключ на' : 'Get your key at'}{' '}
          <a href={hint.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {language === 'ru' ? hint.ru : hint.en}
          </a>
        </>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="container max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
            <CloudSyncIndicator loaded={cloudSynced} />
          </div>
          {isAdmin && (
            <Button asChild variant="outline" className="border-hydra-arbiter text-hydra-arbiter hover:bg-hydra-arbiter/10">
              <Link to="/admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t('nav.admin')}
              </Link>
            </Button>
          )}
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className={cn("grid w-full max-w-2xl", isSupervisor ? (language === 'ru' ? "grid-cols-6" : "grid-cols-5") : (language === 'ru' ? "grid-cols-5" : "grid-cols-4"))}>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.profile')}</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t('profile.preferences')}</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">{t('profile.apiKeys')}</span>
            </TabsTrigger>
            {language === 'ru' && (
              <TabsTrigger value="proxyapi" className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                <span className="hidden sm:inline">ProxyAPI</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('profile.stats')}</span>
            </TabsTrigger>
            {isSupervisor && (
              <TabsTrigger value="notifications" className="flex items-center gap-2 relative">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">{language === 'ru' ? 'Уведомления' : 'Notifications'}</span>
                {unreadCount > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 px-1 text-[10px] bg-destructive text-destructive-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>


          <TabsContent value="profile">
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
                      onChange={handleAvatarFileSelect}
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
                        onClick={handleDeleteAvatar}
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
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="opacity-60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">{t('auth.displayName')}</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                  />
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="hydra-glow-sm">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  {t('profile.save')}
                </Button>
              </HydraCardContent>
            </HydraCard>
          </TabsContent>

          <TabsContent value="preferences">
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
                  <Select value={theme} onValueChange={(value: 'dark' | 'light') => setTheme(value)}>
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
                  <Select value={language} onValueChange={(value: 'ru' | 'en') => setLanguage(value)}>
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
                  <Select value={fontSize} onValueChange={(value: FontSize) => setFontSize(value)}>
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{t('profile.fontNormal')}</SelectItem>
                      <SelectItem value="large">{t('profile.fontLarge')}</SelectItem>
                      <SelectItem value="xlarge">{t('profile.fontXLarge')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.fontSizeHint')}
                  </p>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="hydra-glow-sm">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  {t('profile.save')}
                </Button>
              </HydraCardContent>
            </HydraCard>
          </TabsContent>

          <TabsContent value="api-keys">
            <HydraCard variant="glass" className="p-6">
              <HydraCardHeader>
                <Key className="h-5 w-5 text-primary" />
                <HydraCardTitle>{t('profile.apiKeys')}</HydraCardTitle>
              </HydraCardHeader>
              <HydraCardContent className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'ru'
                    ? 'Добавьте свои API ключи для использования различных LLM моделей (BYOK — Bring Your Own Key)'
                    : 'Add your API keys to use various LLM models (BYOK — Bring Your Own Key)'}
                </p>

                {/* LLM Providers — with ProxyAPI inserted after OpenRouter */}
                {LLM_PROVIDERS.map(p => (
                  <React.Fragment key={p.provider}>
                    <ApiKeyField
                      provider={p.provider}
                      label={'labelKey' in p ? t(p.labelKey) : p.label}
                      value={apiKeys[p.provider] || ''}
                      onChange={(v) => setKeyValue(p.provider, v)}
                      placeholder={p.placeholder}
                      metadata={keyMetadata[p.provider]}
                      onExpirationChange={(date) => handleExpirationChange(p.provider, date)}
                      hint={renderProviderHint(p)}
                      unlimited={p.provider === 'mistral'}
                    />
                    {/* ProxyAPI key moved to ProxyAPI Dashboard tab */}
                    {p.provider === 'gemini' && apiKeys['gemini'] && (
                      <div className="mt-1 mb-2">
                        <GeminiLimitsDialog hasKey={!!apiKeys['gemini']} />
                      </div>
                    )}
                    {p.provider === 'openrouter' && apiKeys['openrouter'] && (
                      <div className="mt-1 mb-2">
                        <OpenRouterLimitsDialog hasKey={!!apiKeys['openrouter']} />
                      </div>
                    )}
                    {p.provider === 'mistral' && apiKeys['mistral'] && (
                      <div className="mt-1 mb-2">
                        <MistralLimitsDialog hasKey={!!apiKeys['mistral']} />
                      </div>
                    )}
                  </React.Fragment>
                ))}

                {/* Tools Section */}
                <Separator className="my-6" />
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">
                    {language === 'ru' ? 'Инструменты' : 'Tools'}
                  </h3>
                </div>

                {TOOL_PROVIDERS.map(p => (
                  <React.Fragment key={p.provider}>
                    <ApiKeyField
                      provider={p.provider}
                      label={p.label}
                      value={apiKeys[p.provider] || ''}
                      onChange={(v) => setKeyValue(p.provider, v)}
                      placeholder={p.placeholder}
                      metadata={keyMetadata[p.provider]}
                      onExpirationChange={(date) => handleExpirationChange(p.provider, date)}
                      hint={renderProviderHint(p)}
                    />
                    {p.provider === 'firecrawl' && apiKeys['firecrawl'] && (
                      <div className="mt-1 mb-2">
                        <FirecrawlLimitsDialog hasKey={!!apiKeys['firecrawl']} />
                      </div>
                    )}
                  </React.Fragment>
                ))}

                {/* Web Search Section */}
                <Separator className="my-6" />
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t('profile.webSearch')}</h3>
                </div>

                {/* Warning Block */}
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-200">
                      {t('profile.webSearchWarning')}
                    </p>
                  </div>
                </div>

                {SEARCH_PROVIDERS.map(p => (
                  <ApiKeyField
                    key={p.provider}
                    provider={p.provider}
                    label={t(p.labelKey)}
                    value={apiKeys[p.provider] || ''}
                    onChange={(v) => setKeyValue(p.provider, v)}
                    placeholder={p.placeholder}
                    metadata={keyMetadata[p.provider]}
                    onExpirationChange={(date) => handleExpirationChange(p.provider, date)}
                    hint={renderProviderHint(p)}
                  />
                ))}

                <Button onClick={handleSaveApiKeys} disabled={saving} className="hydra-glow-sm">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  {t('profile.save')}
                </Button>
              </HydraCardContent>
            </HydraCard>
          </TabsContent>

          {language === 'ru' && (
            <TabsContent value="proxyapi">
              <ProxyApiDashboard
                hasKey={!!apiKeys['proxyapi']}
                proxyapiPriority={proxyapiPriority && !!apiKeys['proxyapi']}
                onPriorityChange={async (val) => {
                  setProxyapiPriority(val);
                  if (user) {
                    await supabase
                      .from('profiles')
                      .update({ proxyapi_priority: val })
                      .eq('user_id', user.id);
                  }
                }}
                apiKeyValue={apiKeys['proxyapi'] || ''}
                onApiKeyChange={(v) => setKeyValue('proxyapi', v)}
                keyMetadata={keyMetadata['proxyapi']}
                onExpirationChange={(date) => handleExpirationChange('proxyapi', date)}
              />
            </TabsContent>
          )}

          <TabsContent value="stats">
            <UsageStats />
          </TabsContent>

          {isSupervisor && (
            <TabsContent value="notifications">
              <HydraCard variant="glass" className="p-6">
                <HydraCardHeader>
                  <Bell className="h-5 w-5 text-amber-400" />
                  <HydraCardTitle>
                    {language === 'ru' ? 'Уведомления Супервизора' : 'Supervisor Notifications'}
                  </HydraCardTitle>
                </HydraCardHeader>
                <HydraCardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {language === 'ru'
                        ? 'Новые ИИ-ревизии Эволюциониста, требующие вашей оценки'
                        : 'New AI revisions from the Evolutioner awaiting your review'}
                    </p>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-1.5 text-xs">
                        <CheckCheck className="h-3.5 w-3.5" />
                        {language === 'ru' ? 'Прочитать все' : 'Mark all read'}
                      </Button>
                    )}
                  </div>

                  {notifLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {language === 'ru' ? 'Загрузка...' : 'Loading...'}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                      <BellOff className="h-8 w-8 opacity-30" />
                      <p className="text-sm">{language === 'ru' ? 'Нет уведомлений' : 'No notifications'}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map(n => (
                        <div
                          key={n.id}
                          className={cn(
                            'flex items-start gap-3 rounded-lg border p-4 transition-colors',
                            n.is_read
                              ? 'border-border bg-muted/30 opacity-70'
                              : 'border-amber-500/30 bg-amber-500/5'
                          )}
                        >
                          <ScrollText className={cn('h-4 w-4 mt-0.5 shrink-0', n.is_read ? 'text-muted-foreground' : 'text-amber-400')} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="font-mono text-xs shrink-0">{n.entry_code}</Badge>
                              {!n.is_read && (
                                <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wide">
                                  {language === 'ru' ? 'Новое' : 'New'}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {format(new Date(n.created_at), 'dd.MM.yyyy HH:mm')}
                              </span>
                            </div>
                            <p className="text-sm text-foreground leading-snug">{n.message}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!n.is_read && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead(n.id)} title={language === 'ru' ? 'Прочитано' : 'Mark read'}>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              </Button>
                            )}
                            {n.chronicle_id && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                <Link to="/hydra-memory" title={language === 'ru' ? 'Перейти к Хроникам' : 'Go to Chronicles'}>
                                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                </Link>
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteNotification(n.id)} title={language === 'ru' ? 'Удалить' : 'Delete'}>
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </HydraCardContent>
              </HydraCard>
            </TabsContent>
          )}

        </Tabs>
      </div>

      {/* Avatar crop dialog */}
      <AvatarCropDialog
        open={cropOpen}
        imageFile={cropFile}
        onClose={() => setCropOpen(false)}
        onCropComplete={handleCropComplete}
        language={language}
      />
    </Layout>
  );
}

