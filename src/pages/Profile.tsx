import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme, type FontSize } from '@/contexts/ThemeContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Key, Settings, Loader2, Shield, BarChart3, Bell, Wallet, Network } from 'lucide-react';
import { CloudSyncIndicator } from '@/components/ui/CloudSyncIndicator';
import { useCloudSyncStatus } from '@/hooks/useCloudSettings';
import { Link } from 'react-router-dom';
import { UsageStats } from '@/components/profile/UsageStats';
import { AvatarCropDialog } from '@/components/profile/AvatarCropDialog';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSupNotifications } from '@/hooks/useSupNotifications';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type KeyMetadata } from '@/components/profile/ApiKeyField';

import { ProfileTab } from '@/components/profile/tabs/ProfileTab';
import { PreferencesTab } from '@/components/profile/tabs/PreferencesTab';
import { ApiKeysTab } from '@/components/profile/tabs/ApiKeysTab';
import { NotificationsTab } from '@/components/profile/tabs/NotificationsTab';
import { FinanceTab } from '@/components/profile/tabs/FinanceTab';
import { ApiRoutersTab } from '@/components/profile/tabs/ApiRoutersTab';

interface ProfileData {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  preferred_language: string;
  preferred_theme: string;
}

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

const USER_TAB_KEY = 'profile-user-tab';
const API_TAB_KEY = 'profile-api-tab';
const VALID_USER_TABS = ['profile', 'preferences', 'notifications', 'finance'];
const VALID_API_TABS = ['api-keys', 'api-routers', 'stats'];

const ALL_PROVIDERS = [
  'openai', 'gemini', 'anthropic', 'xai', 'openrouter', 'groq', 'deepseek', 'mistral',
  'firecrawl', 'tavily', 'perplexity',
];

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { theme, setTheme, fontSize, setFontSize } = useTheme();
  const navigate = useNavigate();
  const cloudSynced = useCloudSyncStatus();
  const { refetch: refetchSidebarProfile } = useUserProfile();
  const { isSupervisor } = useUserRoles();
  const { notifications, loading: notifLoading, unreadCount, markRead, markAllRead, deleteNotification } = useSupNotifications();

  const [userTab, setUserTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(USER_TAB_KEY);
      if (saved && VALID_USER_TABS.includes(saved)) return saved;
    } catch {}
    return 'profile';
  });

  const [apiTab, setApiTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(API_TAB_KEY);
      if (saved && VALID_API_TABS.includes(saved)) return saved;
    } catch {}
    return 'api-keys';
  });

  const handleUserTabChange = useCallback((tab: string) => {
    setUserTab(tab);
    try { localStorage.setItem(USER_TAB_KEY, tab); } catch {}
  }, []);

  const handleApiTabChange = useCallback((tab: string) => {
    setApiTab(tab);
    try { localStorage.setItem(API_TAB_KEY, tab); } catch {}
  }, []);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [keyMetadata, setKeyMetadata] = useState<Record<string, KeyMetadata>>({});
  const [proxyapiPriority, setProxyapiPriority] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (user) fetchProfile();
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData);
        setDisplayName(profileData.display_name || '');
        setUsername(profileData.username || '');
        setIsAdmin(profileData.username === 'AlexKuz');
        setProxyapiPriority((profileData as any).proxyapi_priority ?? false);
        if (profileData.avatar_url) setAvatarUrl(profileData.avatar_url);
      }

      const [apiKeysResult, metadataResult] = await Promise.all([
        supabase.rpc('get_my_api_keys'),
        supabase.rpc('get_my_key_metadata'),
      ]);

      if (apiKeysResult.data?.length > 0) {
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
      const { error } = await supabase.from('profiles').update({
        display_name: displayName,
        username,
        preferred_language: language,
        preferred_theme: theme,
      }).eq('user_id', user.id);
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
      const providers = language === 'ru'
        ? [...ALL_PROVIDERS, 'proxyapi']
        : ALL_PROVIDERS;
      const results = await Promise.all(
        providers.map(p => supabase.rpc('save_api_key', { p_provider: p, p_api_key: apiKeys[p] || '' }))
      );
      const error = results.find(r => r.error)?.error;
      if (error) throw error;

      const { data: newMeta } = await supabase.rpc('get_my_key_metadata');
      if (newMeta) setKeyMetadata(newMeta as Record<string, KeyMetadata>);
      toast.success(t('profile.saved'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExpirationChange = useCallback(async (provider: string, date: string | null) => {
    setKeyMetadata(prev => ({ ...prev, [provider]: { ...prev[provider], expires_at: date } }));
    try {
      const { error } = await supabase.rpc('set_api_key_expiration', { p_provider: provider, p_expires_at: date || '' });
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
    e.target.value = '';
  };

  const handleCropComplete = async (blob: Blob) => {
    if (!user) return;
    setAvatarSaving(true);
    try {
      const filePath = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { error: profileError } = await supabase.from('profiles')
        .update({ avatar_url: filePath }).eq('user_id', user.id);
      if (profileError) throw profileError;

      const { data: signedData } = await supabase.storage.from('avatars')
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
      const { error } = await supabase.from('profiles')
        .update({ avatar_url: null }).eq('user_id', user.id);
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

  return (
    <Layout>
      <div className="container max-w-4xl px-4 py-8 space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
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

        {/* ══════════ Section 1: User ══════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{language === 'ru' ? 'Личный кабинет' : 'Personal'}</h2>
          </div>
          <Tabs value={userTab} onValueChange={handleUserTabChange} className="space-y-6">
            <TabsList className="flex w-full h-auto flex-wrap gap-0.5">
              <TabsTrigger value="profile" className="flex items-center gap-2 flex-1">
                <User className="h-4 w-4 shrink-0" />
                <span>{t('nav.profile')}</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2 flex-1">
                <Settings className="h-4 w-4 shrink-0" />
                <span>{t('profile.preferences')}</span>
              </TabsTrigger>
              {isSupervisor && (
                <TabsTrigger value="notifications" className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                  <Bell className="h-4 w-4 shrink-0" />
                  <span>{language === 'ru' ? 'Уведомления' : 'Notifications'}</span>
                  {unreadCount > 0 && (
                    <Badge className="ml-1 h-5 min-w-5 px-1 text-[10px] bg-destructive text-destructive-foreground">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="finance" className="flex items-center gap-2 flex-1">
                <Wallet className="h-4 w-4 shrink-0" />
                <span>{language === 'ru' ? 'Финансы' : 'Finance'}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileTab
                email={user?.email || ''}
                displayName={displayName}
                username={username}
                avatarUrl={avatarUrl}
                avatarSaving={avatarSaving}
                saving={saving}
                language={language}
                t={t}
                onDisplayNameChange={setDisplayName}
                onUsernameChange={setUsername}
                onSave={handleSaveProfile}
                onAvatarFileSelect={handleAvatarFileSelect}
                onDeleteAvatar={handleDeleteAvatar}
              />
            </TabsContent>

            <TabsContent value="preferences">
              <PreferencesTab
                theme={theme}
                language={language}
                fontSize={fontSize}
                saving={saving}
                availableLanguages={availableLanguages}
                t={t}
                onThemeChange={setTheme}
                onLanguageChange={setLanguage}
                onFontSizeChange={setFontSize}
                onSave={handleSaveProfile}
              />
            </TabsContent>

            {isSupervisor && (
              <TabsContent value="notifications">
                <NotificationsTab
                  notifications={notifications}
                  loading={notifLoading}
                  unreadCount={unreadCount}
                  language={language}
                  onMarkRead={markRead}
                  onMarkAllRead={markAllRead}
                  onDelete={deleteNotification}
                />
              </TabsContent>
            )}

            <TabsContent value="finance">
              <FinanceTab />
            </TabsContent>
          </Tabs>
        </section>

        <Separator className="my-2" />

        {/* ══════════ Section 2: API Management ══════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{language === 'ru' ? 'Управление API' : 'API Management'}</h2>
          </div>
          <Tabs value={apiTab} onValueChange={handleApiTabChange} className="space-y-6">
            <TabsList className="flex w-full h-auto flex-wrap gap-0.5">
              <TabsTrigger value="api-keys" className="flex items-center gap-2 flex-1">
                <Key className="h-4 w-4 shrink-0" />
                <span>{language === 'ru' ? 'API Ключи' : 'API Keys'}</span>
              </TabsTrigger>
              <TabsTrigger value="api-routers" className="flex items-center gap-2 flex-1">
                <Network className="h-4 w-4 shrink-0" />
                <span>{language === 'ru' ? 'API Роутеры' : 'API Routers'}</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2 flex-1">
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span>{t('profile.stats')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api-keys">
              <ApiKeysTab
                apiKeys={apiKeys}
                keyMetadata={keyMetadata}
                saving={saving}
                language={language}
                t={t}
                onKeyChange={setKeyValue}
                onExpirationChange={handleExpirationChange}
                onSave={handleSaveApiKeys}
              />
            </TabsContent>

            <TabsContent value="api-routers">
              <ApiRoutersTab
                apiKeys={apiKeys}
                keyMetadata={keyMetadata}
                language={language}
                t={t}
                onKeyChange={setKeyValue}
                onExpirationChange={handleExpirationChange}
                proxyapiPriority={proxyapiPriority}
                onPriorityChange={async (val) => {
                  setProxyapiPriority(val);
                  if (user) {
                    await supabase.from('profiles')
                      .update({ proxyapi_priority: val }).eq('user_id', user.id);
                  }
                }}
                userId={user?.id}
                isAdmin={isAdmin}
              />
            </TabsContent>

            <TabsContent value="stats">
              <UsageStats />
            </TabsContent>
          </Tabs>
        </section>
      </div>

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
