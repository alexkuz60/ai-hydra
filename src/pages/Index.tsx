import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { 
  Zap, Brain, Shield, Scale, ArrowRight, Sparkles, 
  Users, MessageSquare, GitBranch, Library, Wrench, 
  BarChart3, BookOpen, ChevronRight, Target, Lightbulb,
  Network, Eye, Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';

const Index = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const modules = [
    {
      icon: Users,
      title: 'Штат специалистов',
      description: '11 ИИ-ролей с уникальными когнитивными профилями',
      link: '/staff-roles',
      color: 'text-hydra-expert',
    },
    {
      icon: MessageSquare,
      title: 'Панель экспертов',
      description: 'Многомодельные дискуссии в реальном времени',
      link: '/expert-panel',
      color: 'text-primary',
    },
    {
      icon: GitBranch,
      title: 'Редактор потоков',
      description: 'Визуальное проектирование цепочек рассуждений',
      link: '/flow-editor',
      color: 'text-hydra-arbiter',
    },
    {
      icon: Library,
      title: 'Библиотека промптов',
      description: 'Переиспользуемые системные инструкции',
      link: '/role-library',
      color: 'text-hydra-consultant',
    },
    {
      icon: Wrench,
      title: 'Свои инструменты',
      description: 'HTTP и промпт-инструменты для агентов',
      link: '/tools-library',
      color: 'text-hydra-webhunter',
    },
    {
      icon: BarChart3,
      title: 'Рейтинг моделей',
      description: 'Статистика эффективности и предпочтений',
      link: '/model-ratings',
      color: 'text-hydra-analyst',
    },
  ];

  const roles = [
    { name: 'Эксперт', color: 'bg-hydra-expert', description: 'Глубокий анализ' },
    { name: 'Критик', color: 'bg-hydra-critical', description: 'Поиск изъянов' },
    { name: 'Арбитр', color: 'bg-hydra-arbiter', description: 'Финальный синтез' },
    { name: 'Модератор', color: 'bg-hydra-moderator', description: 'Агрегация контекста' },
    { name: 'Аналитик', color: 'bg-hydra-analyst', description: 'Структурный разбор' },
    { name: 'Советник', color: 'bg-hydra-advisor', description: 'Стратегические рекомендации' },
    { name: 'Архивист', color: 'bg-hydra-archivist', description: 'Работа с памятью' },
    { name: 'Вебхантер', color: 'bg-hydra-webhunter', description: 'Поиск информации' },
  ];

  const principles = [
    {
      icon: Eye,
      title: 'Человек — высший арбитр',
      description: 'ИИ-агенты не принимают решений без участия пользователя. Выбор моделей, оценка качества и финальное слово — всегда за человеком.',
    },
    {
      icon: Network,
      title: 'Коллегиальный интеллект',
      description: 'Несколько моделей с разными латентными пространствами работают параллельно, минимизируя слепые зоны и галлюцинации.',
    },
    {
      icon: Cpu,
      title: 'Самоорганизующаяся система',
      description: 'Расширение через паттерны поведения и цепочки рассуждений, а не через программирование. Система учится и адаптируется.',
    },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24">
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-hydra-expert/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-hydra-arbiter/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
          </div>

          <div className="container px-4 relative z-10">
            <motion.div 
              className="max-w-5xl mx-auto text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Logo with brand name */}
              <h1 className="inline-flex items-baseline justify-center gap-[0.15em] mb-6 group font-rounded">
                <span className="text-[5rem] md:text-[9rem] font-bold bg-gradient-to-r from-primary via-hydra-expert to-hydra-arbiter bg-clip-text text-transparent hydra-text-glow leading-none">
                  ai
                </span>
                
                <img 
                  src="/logo.svg" 
                  alt="" 
                  className="h-[3.5rem] md:h-[6rem] w-[3.5rem] md:w-[6rem] self-center transition-transform duration-500 group-hover:animate-[spin-slow_0.6s_ease-in-out]" 
                />
                
                <span className="text-[5rem] md:text-[9rem] font-bold bg-gradient-to-r from-hydra-expert via-hydra-arbiter to-primary bg-clip-text text-transparent hydra-text-glow leading-none">
                  hydra
                </span>
              </h1>

              {/* Tagline */}
              <p className="text-xl md:text-2xl text-primary font-medium mb-4">
                Многоголовый ИИ-партнёр
              </p>

              {/* Mission statement */}
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                Платформа коллегиального экспертного анализа, где несколько ИИ-моделей 
                работают как команда специалистов — каждая со своей ролью, 
                но с общей целью найти лучшее решение для вас.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Button size="lg" asChild className="hydra-glow text-lg px-8">
                    <Link to="/expert-panel">
                      Открыть панель экспертов
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" asChild className="hydra-glow text-lg px-8">
                      <Link to="/signup">
                        Начать работу
                        <Sparkles className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="text-lg px-8 hydra-border-glow">
                      <Link to="/login">
                        Войти
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Principles Section */}
        <section className="py-16 border-t border-border/50">
          <div className="container px-4">
            <motion.div 
              className="text-center mb-12"
              {...fadeInUp}
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Философия дизайна
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Принципы, которые делают Hydra надёжным партнёром
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {principles.map((principle, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <HydraCard variant="glass" className="h-full p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <principle.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold">{principle.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {principle.description}
                    </p>
                  </HydraCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles Preview Section */}
        <section className="py-16 border-t border-border/50 bg-hydra-surface/30">
          <div className="container px-4">
            <motion.div 
              className="text-center mb-10"
              {...fadeInUp}
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Штат специалистов
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                11 специализированных ролей для комплексного анализа любых задач
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto mb-8">
              {roles.map((role, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${role.color}`} />
                  <span className="text-sm font-medium">{role.name}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">— {role.description}</span>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button variant="ghost" asChild className="text-primary">
                <Link to="/staff-roles">
                  Подробнее о ролях
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section className="py-16 border-t border-border/50">
          <div className="container px-4">
            <motion.div 
              className="text-center mb-12"
              {...fadeInUp}
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Инструменты платформы
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Полный набор для управления ИИ-командой
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {modules.map((module, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <Link to={module.link}>
                    <HydraCard 
                      variant="default" 
                      className="h-full p-5 hover:bg-accent/50 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors`}>
                          <module.icon className={`h-5 w-5 ${module.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            {module.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {module.description}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </HydraCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Flow Section */}
        <section className="py-16 border-t border-border/50 bg-hydra-surface/30">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div 
                className="text-center mb-10"
                {...fadeInUp}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  Как это работает
                </h2>
                <p className="text-muted-foreground">
                  Путь вашего запроса через когнитивный конвейер
                </p>
              </motion.div>

              <HydraCard variant="glass" className="p-8">
                <div className="flex flex-col gap-6">
                  {/* Flow steps */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <motion.div 
                      className="text-center p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-hydra-glow/10 border border-hydra-glow/30 flex items-center justify-center">
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-sm font-medium mb-1">1. Запрос</div>
                      <div className="text-xs text-muted-foreground">Модератор распределяет задачу</div>
                    </motion.div>

                    <motion.div 
                      className="text-center p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-hydra-expert/10 border border-hydra-expert/30 flex items-center justify-center">
                        <Brain className="h-6 w-6 text-hydra-expert" />
                      </div>
                      <div className="text-sm font-medium mb-1">2. Эксперты</div>
                      <div className="text-xs text-muted-foreground">Параллельный анализ</div>
                    </motion.div>

                    <motion.div 
                      className="text-center p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-hydra-critical/10 border border-hydra-critical/30 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-hydra-critical" />
                      </div>
                      <div className="text-sm font-medium mb-1">3. Критик</div>
                      <div className="text-xs text-muted-foreground">Поиск противоречий</div>
                    </motion.div>

                    <motion.div 
                      className="text-center p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-hydra-arbiter/10 border border-hydra-arbiter/30 flex items-center justify-center">
                        <Scale className="h-6 w-6 text-hydra-arbiter" />
                      </div>
                      <div className="text-sm font-medium mb-1">4. Арбитр</div>
                      <div className="text-xs text-muted-foreground">Финальный синтез</div>
                    </motion.div>
                  </div>

                  {/* Connecting line */}
                  <div className="hidden md:block relative h-1 bg-gradient-to-r from-primary via-hydra-expert via-hydra-critical to-hydra-arbiter rounded-full mx-8 opacity-30" />
                </div>
              </HydraCard>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-16 border-t border-border/50">
          <div className="container px-4">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              {...fadeInUp}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Стратегическая цель</span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Генеральный Соавтор
              </h2>
              
              <p className="text-muted-foreground leading-relaxed mb-8">
                Hydra стремится стать самодостаточной системой-партнёром, где новые возможности 
                добавляются через обучение паттернам поведения и настройку цепочек рассуждений, 
                а не через программирование. Система, которая понимает ваш контекст, 
                учится на опыте взаимодействия и помогает решать задачи любой сложности.
              </p>

              <Button variant="outline" asChild className="hydra-border-glow">
                <Link to="/hydrapedia">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Узнать больше в Гидропедии
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        {!user && (
          <section className="py-16 border-t border-border/50 bg-gradient-to-b from-hydra-surface/50 to-transparent">
            <div className="container px-4">
              <motion.div 
                className="max-w-2xl mx-auto text-center"
                {...fadeInUp}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Готовы начать?
                </h2>
                <p className="text-muted-foreground mb-8">
                  Присоединяйтесь к платформе коллегиального ИИ-анализа
                </p>
                <Button size="lg" asChild className="hydra-glow text-lg px-10">
                  <Link to="/signup">
                    Создать аккаунт
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default Index;
