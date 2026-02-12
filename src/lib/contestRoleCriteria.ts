import { ROLE_SPECIFIC_CRITERIA, type AgentRole } from '@/config/roles';

/**
 * Merge role-specific criteria with contest plan criteria
 * Uses union: keeps all unique criteria from both sources
 * Plan criteria take precedence (remain at front), role-specific added after
 */
export function mergeRoleCriteria(
  planCriteria: string[],
  role: AgentRole | undefined
): string[] {
  if (!role) return planCriteria;

  const roleCriteria = ROLE_SPECIFIC_CRITERIA[role] || [];
  
  // Union: combine and deduplicate
  const combined = new Set<string>([...planCriteria, ...roleCriteria]);
  
  // Preserve plan criteria order first, then add role-specific ones
  const result: string[] = [];
  planCriteria.forEach(c => result.push(c));
  roleCriteria.forEach(c => {
    if (!result.includes(c)) {
      result.push(c);
    }
  });
  
  return result;
}

/**
 * Get the description label for a criteria
 */
export function getCriteriaLabel(criteria: string): string {
  const labels: Record<string, string> = {
    // Plan criteria
    factuality: 'Фактологичность',
    relevance: 'Релевантность',
    completeness: 'Полнота',
    clarity: 'Ясность',
    // Role-specific
    creativity: 'Креативность',
    argument_strength: 'Сила аргументов',
    logic_coherence: 'Логическая согласованность',
    evidence_quality: 'Качество доказательств',
    bias_detection: 'Обнаружение предубеждений',
    counter_example_coverage: 'Охват контраргументов',
    synthesis_quality: 'Качество синтеза',
    fairness: 'Объективность',
    decision_justification: 'Обоснование решения',
    nuance_preservation: 'Сохранение нюансов',
    consensus_strength: 'Сила консенсуса',
    practicality: 'Практичность',
    actionability: 'Применяемость',
    risk_awareness: 'Осознание рисков',
    timeline_clarity: 'Ясность сроков',
    resource_feasibility: 'Доступность ресурсов',
    data_accuracy: 'Точность данных',
    methodology_rigor: 'Строгость методологии',
    insight_depth: 'Глубина инсайта',
    correlation_vs_causation: 'Корреляция vs причинность',
    limitation_acknowledgment: 'Признание ограничений',
  };
  return labels[criteria] || criteria;
}

/**
 * Check if a criteria is role-specific (not a default plan criteria)
 */
export function isRoleSpecificCriteria(criteria: string): boolean {
  const defaultPlanCriteria = ['factuality', 'relevance', 'completeness', 'clarity'];
  return !defaultPlanCriteria.includes(criteria);
}
