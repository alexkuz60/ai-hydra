import React, { useState, useEffect, useCallback } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Key, Settings, Loader2, Check, Moon, Sun, Globe, Shield, BarChart3, Search, AlertTriangle, Type, Gauge } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { UsageStats } from '@/components/profile/UsageStats';
import { ApiKeyField, type KeyMetadata } from '@/components/profile/ApiKeyField';
import { ProxyApiDashboard } from '@/components/profile/ProxyApiDashboard';
import { GeminiLimitsDialog } from '@/components/profile/GeminiLimitsDialog';

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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  
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
          <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
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
          <TabsList className={cn("grid w-full max-w-lg", language === 'ru' ? "grid-cols-5" : "grid-cols-4")}>
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
          </TabsList>

          <TabsContent value="profile">
            <HydraCard variant="glass" className="p-6">
              <HydraCardHeader>
                <User className="h-5 w-5 text-primary" />
                <HydraCardTitle>{t('nav.profile')}</HydraCardTitle>
              </HydraCardHeader>
              <HydraCardContent className="space-y-4">
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
                  <ApiKeyField
                    key={p.provider}
                    provider={p.provider}
                    label={p.label}
                    value={apiKeys[p.provider] || ''}
                    onChange={(v) => setKeyValue(p.provider, v)}
                    placeholder={p.placeholder}
                    metadata={keyMetadata[p.provider]}
                    onExpirationChange={(date) => handleExpirationChange(p.provider, date)}
                    hint={renderProviderHint(p)}
                  />
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
        </Tabs>
      </div>
    </Layout>
  );
}
