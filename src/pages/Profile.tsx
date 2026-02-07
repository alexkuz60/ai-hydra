import React, { useState, useEffect } from 'react';
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
import { User, Key, Settings, Loader2, Eye, EyeOff, Check, Moon, Sun, Globe, Shield, BarChart3, Search, AlertTriangle, Type } from 'lucide-react';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { UsageStats } from '@/components/profile/UsageStats';

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
  xai_api_key: string | null;
  openrouter_api_key: string | null;
  groq_api_key: string | null;
  tavily_api_key: string | null;
  perplexity_api_key: string | null;
  deepseek_api_key: string | null;
  firecrawl_api_key: string | null;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { theme, setTheme, fontSize, setFontSize } = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({
    openai: false,
    gemini: false,
    anthropic: false,
    xai: false,
    openrouter: false,
    groq: false,
    tavily: false,
    perplexity: false,
    deepseek: false,
    firecrawl: false,
  });

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [xaiKey, setXaiKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [tavilyKey, setTavilyKey] = useState('');
  const [perplexityKey, setPerplexityKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [firecrawlKey, setFirecrawlKey] = useState('');

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
        const keys = apiKeysData[0] as { 
          openai_api_key?: string; 
          google_gemini_api_key?: string;
          anthropic_api_key?: string;
          xai_api_key?: string;
          openrouter_api_key?: string;
          groq_api_key?: string;
          tavily_api_key?: string;
          perplexity_api_key?: string;
          deepseek_api_key?: string;
          firecrawl_api_key?: string;
        };
        setOpenaiKey(keys.openai_api_key || '');
        setGeminiKey(keys.google_gemini_api_key || '');
        setAnthropicKey(keys.anthropic_api_key || '');
        setXaiKey(keys.xai_api_key || '');
        setOpenrouterKey(keys.openrouter_api_key || '');
        setGroqKey(keys.groq_api_key || '');
        setTavilyKey(keys.tavily_api_key || '');
        setPerplexityKey(keys.perplexity_api_key || '');
        setDeepseekKey(keys.deepseek_api_key || '');
        setFirecrawlKey(keys.firecrawl_api_key || '');
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
        supabase.rpc('save_api_key', { p_provider: 'xai', p_api_key: xaiKey || '' }),
        supabase.rpc('save_api_key', { p_provider: 'openrouter', p_api_key: openrouterKey || '' }),
        supabase.rpc('save_api_key', { p_provider: 'groq', p_api_key: groqKey || '' }),
        supabase.rpc('save_api_key', { p_provider: 'tavily', p_api_key: tavilyKey || '' }),
        supabase.rpc('save_api_key', { p_provider: 'perplexity', p_api_key: perplexityKey || '' }),
        supabase.rpc('save_api_key', { p_provider: 'deepseek', p_api_key: deepseekKey || '' }),
        supabase.rpc('save_api_key', { p_provider: 'firecrawl', p_api_key: firecrawlKey || '' }),
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
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
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
                    {t('profile.fontSize') || 'Размер шрифта'}
                  </Label>
                  <Select value={fontSize} onValueChange={(value: FontSize) => setFontSize(value)}>
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{t('profile.fontNormal') || 'Обычный'}</SelectItem>
                      <SelectItem value="large">{t('profile.fontLarge') || 'Крупный'}</SelectItem>
                      <SelectItem value="xlarge">{t('profile.fontXLarge') || 'Очень крупный'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.fontSizeHint') || 'Увеличивает базовый размер текста во всём интерфейсе'}
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
                  Добавьте свои API ключи для использования различных LLM моделей (BYOK — Bring Your Own Key)
                </p>

                {/* OpenAI */}
                <div className="space-y-2">
                  <Label htmlFor="openai" className="flex items-center gap-2">
                    {PROVIDER_LOGOS.openai && React.createElement(PROVIDER_LOGOS.openai, { className: cn("h-5 w-5", PROVIDER_COLORS.openai) })}
                    {t('profile.openai')}
                  </Label>
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
                  <Label htmlFor="gemini" className="flex items-center gap-2">
                    {PROVIDER_LOGOS.gemini && React.createElement(PROVIDER_LOGOS.gemini, { className: cn("h-5 w-5", PROVIDER_COLORS.gemini) })}
                    {t('profile.gemini')}
                  </Label>
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
                  <Label htmlFor="anthropic" className="flex items-center gap-2">
                    {PROVIDER_LOGOS.anthropic && React.createElement(PROVIDER_LOGOS.anthropic, { className: cn("h-5 w-5", PROVIDER_COLORS.anthropic) })}
                    {t('profile.anthropic')}
                  </Label>
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

                {/* xAI (Grok) */}
                <div className="space-y-2">
                  <Label htmlFor="xai" className="flex items-center gap-2">
                    {PROVIDER_LOGOS.xai && React.createElement(PROVIDER_LOGOS.xai, { className: cn("h-5 w-5", PROVIDER_COLORS.xai) })}
                    xAI (Grok)
                  </Label>
                  <div className="relative">
                    <Input
                      id="xai"
                      type={showKeys.xai ? 'text' : 'password'}
                      value={xaiKey}
                      onChange={(e) => setXaiKey(e.target.value)}
                      placeholder="xai-..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys({ ...showKeys, xai: !showKeys.xai })}
                    >
                      {showKeys.xai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* OpenRouter */}
                <div className="space-y-2">
                  <Label htmlFor="openrouter" className="flex items-center gap-2">
                    {PROVIDER_LOGOS.openrouter && React.createElement(PROVIDER_LOGOS.openrouter, { className: cn("h-5 w-5", PROVIDER_COLORS.openrouter) })}
                    OpenRouter (Free Models)
                  </Label>
                  <div className="relative">
                    <Input
                      id="openrouter"
                      type={showKeys.openrouter ? 'text' : 'password'}
                      value={openrouterKey}
                      onChange={(e) => setOpenrouterKey(e.target.value)}
                      placeholder="sk-or-..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys({ ...showKeys, openrouter: !showKeys.openrouter })}
                    >
                      {showKeys.openrouter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Получите ключ на <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai/keys</a> — доступны бесплатные модели Llama, Gemma, Mistral, Qwen
                  </p>
                </div>

                {/* Groq */}
                <div className="space-y-2">
                  <Label htmlFor="groq" className="flex items-center gap-2">
                    {PROVIDER_LOGOS.groq && React.createElement(PROVIDER_LOGOS.groq, { className: cn("h-5 w-5", PROVIDER_COLORS.groq) })}
                    Groq (Ultra-Fast Inference)
                  </Label>
                  <div className="relative">
                    <Input
                      id="groq"
                      type={showKeys.groq ? 'text' : 'password'}
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      placeholder="gsk_..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys({ ...showKeys, groq: !showKeys.groq })}
                    >
                      {showKeys.groq ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Получите ключ на <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.groq.com/keys</a> — сверхбыстрый инференс Llama 3.3, Mixtral, Gemma
                  </p>
                </div>

                {/* DeepSeek */}
                <div className="space-y-2">
                  <Label htmlFor="deepseek" className="flex items-center gap-2">
                    {PROVIDER_LOGOS.deepseek && React.createElement(PROVIDER_LOGOS.deepseek, { className: cn("h-5 w-5", PROVIDER_COLORS.deepseek) })}
                    DeepSeek AI
                  </Label>
                  <div className="relative">
                    <Input
                      id="deepseek"
                      type={showKeys.deepseek ? 'text' : 'password'}
                      value={deepseekKey}
                      onChange={(e) => setDeepseekKey(e.target.value)}
                      placeholder="sk-..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys({ ...showKeys, deepseek: !showKeys.deepseek })}
                    >
                      {showKeys.deepseek ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Получите ключ на <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.deepseek.com</a> — DeepSeek-V3, DeepSeek-R1 (reasoning)
                  </p>
                </div>

                {/* Tools Section */}
                <Separator className="my-6" />
                
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Инструменты</h3>
                </div>

                {/* Firecrawl */}
                <div className="space-y-2">
                  <Label htmlFor="firecrawl" className="flex items-center gap-2">
                    {PROVIDER_LOGOS.firecrawl && React.createElement(PROVIDER_LOGOS.firecrawl, { className: cn("h-5 w-5", PROVIDER_COLORS.firecrawl) })}
                    Firecrawl (Web Scraping)
                  </Label>
                  <div className="relative">
                    <Input
                      id="firecrawl"
                      type={showKeys.firecrawl ? 'text' : 'password'}
                      value={firecrawlKey}
                      onChange={(e) => setFirecrawlKey(e.target.value)}
                      placeholder="fc-..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys({ ...showKeys, firecrawl: !showKeys.firecrawl })}
                    >
                      {showKeys.firecrawl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Получите ключ на <a href="https://firecrawl.dev/app/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">firecrawl.dev</a> — персональный ключ имеет приоритет над системным
                  </p>
                </div>

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

                {/* Tavily */}
                <div className="space-y-2">
                  <Label htmlFor="tavily" className="flex items-center gap-2">
                    {PROVIDER_LOGOS.tavily && React.createElement(PROVIDER_LOGOS.tavily, { className: cn("h-5 w-5", PROVIDER_COLORS.tavily) })}
                    {t('profile.tavily')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="tavily"
                      type={showKeys.tavily ? 'text' : 'password'}
                      value={tavilyKey}
                      onChange={(e) => setTavilyKey(e.target.value)}
                      placeholder="tvly-..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys({ ...showKeys, tavily: !showKeys.tavily })}
                    >
                      {showKeys.tavily ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.tavilyHint')} — <a href="https://tavily.com/app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">tavily.com/app</a>
                  </p>
                </div>

                {/* Perplexity */}
                <div className="space-y-2">
                  <Label htmlFor="perplexity" className="flex items-center gap-2">
                    {PROVIDER_LOGOS.perplexity && React.createElement(PROVIDER_LOGOS.perplexity, { className: cn("h-5 w-5", PROVIDER_COLORS.perplexity) })}
                    {t('profile.perplexity')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="perplexity"
                      type={showKeys.perplexity ? 'text' : 'password'}
                      value={perplexityKey}
                      onChange={(e) => setPerplexityKey(e.target.value)}
                      placeholder="pplx-..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys({ ...showKeys, perplexity: !showKeys.perplexity })}
                    >
                      {showKeys.perplexity ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.perplexityHint')} — <a href="https://perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">perplexity.ai/settings/api</a>
                  </p>
                </div>

                <Button onClick={handleSaveApiKeys} disabled={saving} className="hydra-glow-sm">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  {t('profile.save')}
                </Button>
              </HydraCardContent>
            </HydraCard>
          </TabsContent>

          <TabsContent value="stats">
            <UsageStats />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
