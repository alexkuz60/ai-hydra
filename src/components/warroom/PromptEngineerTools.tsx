 import React, { useState, useCallback } from 'react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Button } from '@/components/ui/button';
 import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
 import { Badge } from '@/components/ui/badge';
 import { cn } from '@/lib/utils';
 import { motion, AnimatePresence } from 'framer-motion';
 import {
   FileSearch,
   Shuffle,
   Sparkles,
   Target,
   Loader2,
 } from 'lucide-react';
 
 export type PromptEngineerTool = 'analyze' | 'variations' | 'enhance' | 'clarify';
 
 interface ToolConfig {
   id: PromptEngineerTool;
   icon: React.ElementType;
   labelKey: string;
   descriptionKey: string;
   color: string;
 }
 
 const TOOLS: ToolConfig[] = [
   { 
     id: 'analyze', 
     icon: FileSearch, 
     labelKey: 'promptEngineer.tools.analyze', 
     descriptionKey: 'promptEngineer.tools.analyzeDesc',
     color: 'text-blue-500' 
   },
   { 
     id: 'variations', 
     icon: Shuffle, 
     labelKey: 'promptEngineer.tools.variations', 
     descriptionKey: 'promptEngineer.tools.variationsDesc',
     color: 'text-purple-500' 
   },
   { 
     id: 'enhance', 
     icon: Sparkles, 
     labelKey: 'promptEngineer.tools.enhance', 
     descriptionKey: 'promptEngineer.tools.enhanceDesc',
     color: 'text-amber-500' 
   },
   { 
     id: 'clarify', 
     icon: Target, 
     labelKey: 'promptEngineer.tools.clarify', 
     descriptionKey: 'promptEngineer.tools.clarifyDesc',
     color: 'text-emerald-500' 
   },
 ];
 
 interface PromptEngineerToolsProps {
   onSelectTool: (tool: PromptEngineerTool, instruction: string) => void;
   disabled?: boolean;
   isLoading?: boolean;
   hasInput?: boolean;
 }
 
 export function PromptEngineerTools({
   onSelectTool,
   disabled = false,
   isLoading = false,
   hasInput = false,
 }: PromptEngineerToolsProps) {
   const { t } = useLanguage();
   const [selectedTool, setSelectedTool] = useState<PromptEngineerTool | null>(null);
 
   const handleToolClick = useCallback((tool: ToolConfig) => {
     if (disabled || isLoading) return;
     
     setSelectedTool(tool.id);
     
     // Build instruction based on tool type
     const instructions: Record<PromptEngineerTool, string> = {
       analyze: `Проанализируй следующий промпт и предоставь детальную оценку:
 1. **Сильные стороны**: что хорошо сформулировано
 2. **Слабые стороны**: что можно улучшить
 3. **Структура**: насколько логично построен запрос
 4. **Ясность**: понятны ли инструкции для ИИ
 5. **Рекомендации**: конкретные шаги для улучшения
 
 Промпт для анализа:`,
       
       variations: `Создай 3-5 альтернативных вариантов следующего промпта, каждый с уникальным подходом:
 1. **Формальный вариант**: более структурированный и деловой
 2. **Креативный вариант**: с нестандартным подходом
 3. **Минималистичный вариант**: максимально краткий
 4. **Детальный вариант**: с дополнительными уточнениями
 5. **Экспертный вариант**: с профессиональной терминологией
 
 Для каждого варианта укажи его особенности и когда лучше использовать.
 
 Исходный промпт:`,
       
       enhance: `Улучши следующий промпт, сохраняя его исходную цель:
 1. Добавь чёткие критерии успеха
 2. Уточни формат ожидаемого ответа
 3. Добавь необходимый контекст
 4. Устрани двусмысленности
 5. Оптимизируй структуру
 
 Верни улучшенную версию с пояснением внесённых изменений.
 
 Промпт для улучшения:`,
       
       clarify: `Сформулируй уточняющие вопросы для следующего промпта:
 1. Какая информация отсутствует?
 2. Какие детали нужно уточнить?
 3. Какие ограничения следует добавить?
 4. Какой контекст поможет ИИ лучше понять задачу?
 
 Предложи 3-5 ключевых вопросов, ответы на которые значительно улучшат качество промпта.
 
 Промпт для анализа:`,
     };
     
     onSelectTool(tool.id, instructions[tool.id]);
   }, [disabled, isLoading, onSelectTool]);
 
   return (
     <div className="flex flex-col gap-2 p-2 border-b border-border bg-hydra-promptengineer/5">
       <div className="flex items-center gap-2">
         <Sparkles className="h-3.5 w-3.5 text-hydra-promptengineer" />
         <span className="text-xs font-medium text-hydra-promptengineer">
           {t('promptEngineer.tools.title')}
         </span>
         {!hasInput && (
           <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">
             {t('promptEngineer.tools.enterPromptFirst')}
           </Badge>
         )}
       </div>
       
       <div className="grid grid-cols-4 gap-1">
         <AnimatePresence>
           {TOOLS.map((tool) => (
             <Tooltip key={tool.id}>
               <TooltipTrigger asChild>
                 <motion.div
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 0.15 }}
                 >
                   <Button
                     variant={selectedTool === tool.id ? 'secondary' : 'ghost'}
                     size="sm"
                     onClick={() => handleToolClick(tool)}
                     disabled={disabled || isLoading || !hasInput}
                     className={cn(
                       'h-8 px-2 flex items-center gap-1.5 w-full',
                       selectedTool === tool.id && tool.color,
                       !hasInput && 'opacity-50'
                     )}
                   >
                     {isLoading && selectedTool === tool.id ? (
                       <Loader2 className="h-3.5 w-3.5 animate-spin" />
                     ) : (
                       <tool.icon className="h-3.5 w-3.5" />
                     )}
                     <span className="text-[10px] hidden sm:inline truncate">
                       {t(tool.labelKey)}
                     </span>
                   </Button>
                 </motion.div>
               </TooltipTrigger>
               <TooltipContent side="bottom" className="max-w-[200px]">
                 <p className="font-medium">{t(tool.labelKey)}</p>
                 <p className="text-xs text-muted-foreground">{t(tool.descriptionKey)}</p>
               </TooltipContent>
             </Tooltip>
           ))}
         </AnimatePresence>
       </div>
     </div>
   );
 }