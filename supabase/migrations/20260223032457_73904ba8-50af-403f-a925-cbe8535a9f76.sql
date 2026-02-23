-- Add English localization columns to sessions
ALTER TABLE public.sessions ADD COLUMN title_en text;
ALTER TABLE public.sessions ADD COLUMN description_en text;

-- Fill English translations for system tutorial sessions
UPDATE public.sessions SET 
  title_en = '🎨 Creative Brainstorm: Idea Generation',
  description_en = 'Tutorial example: multi-model brainstorm. Three models with different roles generate startup ideas. Demonstrates the power of collective AI thinking.'
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE public.sessions SET 
  title_en = '🔍 Code Review: Architecture Analysis',
  description_en = 'Tutorial example: code review with three specialists. Analyst finds bugs, strategist evaluates architecture, critic checks security.'
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE public.sessions SET 
  title_en = '📋 Product Strategy: Quarterly Roadmap',
  description_en = 'Tutorial example: strategic planning with two models. Strategist builds the roadmap, analyst evaluates risks and resources.'
WHERE id = '00000000-0000-0000-0000-000000000003';

UPDATE public.sessions SET 
  title_en = '⚡ Quick Answers: Express Assistant',
  description_en = 'Tutorial example: simple mode with one fast model. Ideal for short questions, translations, code refactoring.'
WHERE id = '00000000-0000-0000-0000-000000000004';