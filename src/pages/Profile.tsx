import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Key, Settings, Loader2, Eye, EyeOff, Check, Moon, Sun, Globe, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  preferred_language: string;
  preferred_theme: string;
}

interface ApiKeys {
  openai_api_key: string | null;
  google_gemini_api_key: string | null;
  anthropic_api_key: string | null;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({
    openai: false,
    gemini: false,
    anthropic: false,
  });

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');

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
      }

      // Fetch decrypted API keys from Vault
      const { data: apiKeysData } = await supabase
        .rpc('get_my_api_keys');

      if (apiKeysData && apiKeysData.length > 0) {
        setOpenaiKey(apiKeysData[0].openai_api_key || '');
        setGeminiKey(apiKeysData[0].google_gemini_api_key || '');
        setAnthropicKey(apiKeysData[0].anthropic_api_key || '');
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
      // Save each API key through Vault-backed function
      const savePromises = [
        supabase.rpc('save_api_key', { p_provider: 'openai', p_api_key: openaiKey || '' }),
        supabase.rpc('save_api_key', { p_provider: 'anthropic', p_api_key: anthropicKey || '' }),
        supabase.rpc('save_api_key', { p_provider: 'gemini', p_api_key: geminiKey || '' }),
      ];

      const results = await Promise.all(savePromises);
      const error = results.find(r => r.error)?.error;

      if (error) throw error;
      toast.success(t('profile.saved'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
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
          <TabsList className="grid w-full grid-cols-3 max-w-md">
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
                  Добавьте свои API ключи для использования различных LLM моделей (BYOK — Bring Your Own Key)
                </p>

                {/* OpenAI */}
                <div className="space-y-2">
                  <Label htmlFor="openai">{t('profile.openai')}</Label>
                  <div className="relative">
                    <Input
                      id="openai"
                      type={showKeys.openai ? 'text' : 'password'}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                    >
                      {showKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Google Gemini */}
                <div className="space-y-2">
                  <Label htmlFor="gemini">{t('profile.gemini')}</Label>
                  <div className="relative">
                    <Input
                      id="gemini"
                      type={showKeys.gemini ? 'text' : 'password'}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIza..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys({ ...showKeys, gemini: !showKeys.gemini })}
                    >
                      {showKeys.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Anthropic */}
                <div className="space-y-2">
                  <Label htmlFor="anthropic">{t('profile.anthropic')}</Label>
                  <div className="relative">
                    <Input
                      id="anthropic"
                      type={showKeys.anthropic ? 'text' : 'password'}
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys({ ...showKeys, anthropic: !showKeys.anthropic })}
                    >
                      {showKeys.anthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button onClick={handleSaveApiKeys} disabled={saving} className="hydra-glow-sm">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  {t('profile.save')}
                </Button>
              </HydraCardContent>
            </HydraCard>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
