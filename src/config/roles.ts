// Unified role configuration for the entire project
import {
  Brain,
  Shield,
  Scale,
  Lightbulb,
  Gavel,
  HandHelping,
  Archive,
  LineChart,
  Globe,
  Crown,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// All AI agent roles (excludes 'user' which is for human users)
export type AgentRole = 
  | 'assistant' 
  | 'critic' 
  | 'arbiter' 
  | 'consultant'
  | 'moderator'
  | 'advisor'
  | 'archivist'
  | 'analyst'
  | 'webhunter';

// All possible message roles including user
export type MessageRole = 'user' | AgentRole;

export interface RoleConfigItem {
  icon: LucideIcon;
  color: string;
  label: string;
  bgClass?: string;
}

// Unified role configuration with icons and colors
export const ROLE_CONFIG: Record<MessageRole, RoleConfigItem> = {
  user: {
    icon: User,
    color: 'text-hydra-user',
    label: 'role.user',
  },
  assistant: {
    icon: Brain,
    color: 'text-hydra-expert',
    label: 'role.assistant',
  },
  critic: {
    icon: Shield,
    color: 'text-hydra-critical',
    label: 'role.critic',
  },
  arbiter: {
    icon: Scale,
    color: 'text-hydra-arbiter',
    label: 'role.arbiter',
  },
  consultant: {
    icon: Lightbulb,
    color: 'text-hydra-consultant',
    label: 'role.consultant',
  },
  moderator: {
    icon: Gavel,
    color: 'text-hydra-moderator',
    label: 'role.moderator',
  },
  advisor: {
    icon: HandHelping,
    color: 'text-hydra-advisor',
    label: 'role.advisor',
  },
  archivist: {
    icon: Archive,
    color: 'text-hydra-archivist',
    label: 'role.archivist',
  },
  analyst: {
    icon: LineChart,
    color: 'text-hydra-analyst',
    label: 'role.analyst',
  },
  webhunter: {
    icon: Globe,
    color: 'text-hydra-webhunter',
    label: 'role.webhunter',
  },
};

// Supervisor icon (used for user with supervisor privileges)
export const SupervisorIcon = Crown;
export const SupervisorColor = 'text-hydra-supervisor';

// All agent roles as array (for iteration)
export const AGENT_ROLES: AgentRole[] = [
  'assistant',
  'critic',
  'arbiter',
  'consultant',
  'moderator',
  'advisor',
  'archivist',
  'analyst',
  'webhunter',
];

// Default system prompts for each agent role
export const DEFAULT_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  assistant: `Вы - эксперт в своей области. Предоставляйте четкие, хорошо обоснованные ответы. Будьте лаконичны, но основательны.`,
  critic: `Вы - критик-аналитик. Ваша задача - находить слабые места, противоречия и потенциальные проблемы в рассуждениях. Будьте конструктивны, но строги.`,
  arbiter: `Вы - арбитр дискуссии. Синтезируйте различные точки зрения, выделяйте консенсус и расхождения. Формируйте взвешенное финальное решение.`,
  consultant: `Вы - консультант, привлечённый для разового экспертного запроса. Предоставьте глубокий, детальный ответ на конкретный вопрос. При необходимости проведите анализ, предложите решения и альтернативы.`,
  moderator: `Вы - модератор дискуссии. Следите за порядком обсуждения, направляйте участников к конструктивному диалогу. Подводите итоги, выделяйте ключевые моменты и предотвращайте отклонения от темы.`,
  advisor: `Вы - советник. Предоставляйте рекомендации и стратегические советы на основе анализа ситуации. Рассматривайте долгосрочные последствия и предлагайте оптимальные пути решения.`,
  archivist: `Вы - архивариус. Систематизируйте информацию, находите релевантные данные в предоставленном контексте. Создавайте структурированные сводки и ссылки на источники.`,
  analyst: `Вы - аналитик. Проводите глубокий анализ данных, выявляйте закономерности и тренды. Представляйте выводы в структурированном виде с обоснованием.`,
  webhunter: `Вы - web-охотник. Специализируетесь на поиске информации в интернете. Формулируйте эффективные поисковые запросы, анализируйте найденные источники и предоставляйте релевантную информацию.`,
};

// Helper function to get role config with fallback
export function getRoleConfig(role: string): RoleConfigItem {
  return ROLE_CONFIG[role as MessageRole] || ROLE_CONFIG.assistant;
}

// Badge color classes for each role
export const ROLE_BADGE_COLORS: Record<string, string> = {
  assistant: 'bg-hydra-expert/20 text-hydra-expert border-hydra-expert/30',
  critic: 'bg-hydra-critical/20 text-hydra-critical border-hydra-critical/30',
  arbiter: 'bg-hydra-arbiter/20 text-hydra-arbiter border-hydra-arbiter/30',
  consultant: 'bg-hydra-consultant/20 text-hydra-consultant border-hydra-consultant/30',
  moderator: 'bg-hydra-moderator/20 text-hydra-moderator border-hydra-moderator/30',
  advisor: 'bg-hydra-advisor/20 text-hydra-advisor border-hydra-advisor/30',
  archivist: 'bg-hydra-archivist/20 text-hydra-archivist border-hydra-archivist/30',
  analyst: 'bg-hydra-analyst/20 text-hydra-analyst border-hydra-analyst/30',
  webhunter: 'bg-hydra-webhunter/20 text-hydra-webhunter border-hydra-webhunter/30',
};

export function getRoleBadgeColor(role: string): string {
  return ROLE_BADGE_COLORS[role] || ROLE_BADGE_COLORS.assistant;
}
