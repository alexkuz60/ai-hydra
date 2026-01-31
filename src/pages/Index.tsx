import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Zap, Brain, Shield, Scale, ArrowRight, Sparkles } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const features = [
    {
      icon: Brain,
      title: 'Experts (The Heads)',
      description: 'Параллельная работа нескольких LLM моделей с уникальными латентными пространствами',
      variant: 'expert' as const,
    },
    {
      icon: Shield,
      title: 'Critic (The Skeptic)',
      description: 'Поиск логических изъянов и противоречий между ответами разных моделей',
      variant: 'critic' as const,
    },
    {
      icon: Scale,
      title: 'Arbiter (Synthesizer)',
      description: 'Финальный синтез с динамическим взвешиванием аргументов',
      variant: 'arbiter' as const,
    },
  ];

  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32">
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-hydra-expert/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
          </div>

          <div className="container px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Logo with brand name */}
              <h1 className="inline-flex items-baseline justify-center gap-[0.15em] mb-8 group font-rounded">
                <span className="text-[7rem] md:text-[12rem] font-bold bg-gradient-to-r from-primary via-hydra-expert to-hydra-arbiter bg-clip-text text-transparent hydra-text-glow leading-none">
                  ai
                </span>
                
                <img 
                  src="/favicon.png?v=3" 
                  alt="" 
                  className="h-[4.5rem] md:h-[7.5rem] w-[4.5rem] md:w-[7.5rem] self-center transition-transform duration-500 group-hover:animate-[spin-slow_0.6s_ease-in-out]" 
                />
                
                <span className="text-[7rem] md:text-[12rem] font-bold bg-gradient-to-r from-hydra-expert via-hydra-arbiter to-primary bg-clip-text text-transparent hydra-text-glow leading-none">
                  hydra
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-light">
                {t('hero.subtitle')}
              </p>

              <p className="text-lg text-muted-foreground/80 mb-10 max-w-2xl mx-auto">
                {t('hero.description')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Button size="lg" asChild className="hydra-glow text-lg px-8">
                    <Link to="/expert-panel">
                      {t('nav.warRoom')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" asChild className="hydra-glow text-lg px-8">
                      <Link to="/signup">
                        {t('hero.getStarted')}
                        <Sparkles className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="text-lg px-8 hydra-border-glow">
                      <Link to="/login">
                        {t('nav.login')}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 border-t border-border/50">
          <div className="container px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Архитектура взаимодействия
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Распределение ролей для минимизации галлюцинаций и максимизации синергии
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <HydraCard 
                  key={index} 
                  variant={feature.variant} 
                  glow 
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <HydraCardHeader>
                    <feature.icon className="h-6 w-6 text-primary" />
                    <HydraCardTitle>{feature.title}</HydraCardTitle>
                  </HydraCardHeader>
                  <HydraCardContent className="text-muted-foreground">
                    {feature.description}
                  </HydraCardContent>
                </HydraCard>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture Preview */}
        <section className="py-20 border-t border-border/50">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <HydraCard variant="glass" className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Data Flow</h3>
                  <p className="text-muted-foreground text-sm">Путь запроса через когнитивный конвейер</p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-hydra-glow/10 border border-hydra-glow/30">
                    <span className="text-primary font-mono text-sm">Supervisor</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-hydra-expert/10 border border-hydra-expert/30">
                    <span className="text-hydra-expert font-mono text-sm">Experts</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-hydra-critical/10 border border-hydra-critical/30">
                    <span className="text-hydra-critical font-mono text-sm">Critic</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-hydra-arbiter/10 border border-hydra-arbiter/30">
                    <span className="text-hydra-arbiter font-mono text-sm">Arbiter</span>
                  </div>
                </div>
              </HydraCard>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
