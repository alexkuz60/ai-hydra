import React from 'react';
import { ROLE_CONFIG, type MessageRole } from '@/config/roles';
import { cn } from '@/lib/utils';

interface RoleIconInlineProps {
  role: MessageRole;
  showLabel?: boolean;
  className?: string;
}

// Map role names from content to actual role keys
const ROLE_NAME_MAP: Record<string, MessageRole> = {
  'assistant': 'assistant',
  'ассистент': 'assistant',
  'critic': 'critic',
  'критик': 'critic',
  'arbiter': 'arbiter',
  'арбитр': 'arbiter',
  'consultant': 'consultant',
  'консультант': 'consultant',
  'moderator': 'moderator',
  'модератор': 'moderator',
  'advisor': 'advisor',
  'советник': 'advisor',
  'archivist': 'archivist',
  'архивариус': 'archivist',
  'analyst': 'analyst',
  'аналитик': 'analyst',
  'webhunter': 'webhunter',
  'веб-охотник': 'webhunter',
  'promptengineer': 'promptengineer',
  'промпт-инженер': 'promptengineer',
  'flowregulator': 'flowregulator',
  'регулировщик': 'flowregulator',
  'user': 'user',
  'пользователь': 'user',
};

export function getRoleFromName(name: string): MessageRole | null {
  const normalized = name.toLowerCase().trim();
  return ROLE_NAME_MAP[normalized] || null;
}

export function RoleIconInline({ role, showLabel = true, className }: RoleIconInlineProps) {
  const config = ROLE_CONFIG[role];
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border",
      "bg-gradient-to-r from-background to-muted/30",
      className
    )}
    style={{
      borderColor: `hsl(var(--hydra-${role === 'user' ? 'user' : role})/0.4)`,
    }}
    >
      <IconComponent 
        className={cn("h-4 w-4 flex-shrink-0", config.color)} 
      />
      {showLabel && (
        <span className={cn("text-xs font-medium", config.color)}>
          {role}
        </span>
      )}
    </span>
  );
}
