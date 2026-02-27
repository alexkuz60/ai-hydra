import React from 'react';
import {
  MessageSquare, FileText, Lightbulb, BookOpen, ListChecks, Star,
  File, FileImage, FileText as FileTextIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { ROLE_CONFIG } from '@/config/roles';
import type { SessionMemoryChunk, ChunkType } from '@/hooks/useSessionMemory';

// ─── Design tokens ───────────────────────────────────────────────────────────

export const MEMORY_TYPE_COLORS: Record<string, string> = {
  experience: 'bg-hydra-info/15 text-hydra-info border-hydra-info/30',
  preference: 'bg-hydra-expert/15 text-hydra-expert border-hydra-expert/30',
  skill: 'bg-hydra-success/15 text-hydra-success border-hydra-success/30',
  mistake: 'bg-hydra-critical/15 text-hydra-critical border-hydra-critical/30',
  success: 'bg-hydra-warning/15 text-hydra-warning border-hydra-warning/30',
};

export const CHUNK_TYPE_COLORS: Record<string, string> = {
  decision: 'bg-hydra-cyan/15 text-hydra-cyan',
  context: 'bg-hydra-info/15 text-hydra-info',
  instruction: 'bg-hydra-memory/15 text-hydra-memory',
  evaluation: 'bg-hydra-warning/15 text-hydra-warning',
  summary: 'bg-hydra-success/15 text-hydra-success',
  message: 'bg-muted text-muted-foreground',
};

export const CHUNK_TYPE_CONFIG: Record<ChunkType, { icon: React.ElementType; color: string; labelKey: string }> = {
  message: { icon: MessageSquare, color: 'text-muted-foreground', labelKey: 'memory.messages' },
  summary: { icon: FileText, color: 'text-hydra-glow', labelKey: 'memory.summaries' },
  decision: { icon: Lightbulb, color: 'text-hydra-success', labelKey: 'memory.decisions' },
  context: { icon: BookOpen, color: 'text-hydra-expert', labelKey: 'memory.context' },
  instruction: { icon: ListChecks, color: 'text-hydra-critical', labelKey: 'memory.instructions' },
  evaluation: { icon: Star, color: 'text-hydra-warning', labelKey: 'memory.evaluations' },
};

export const MEMORY_TYPE_LABELS: Record<string, { ru: string; en: string }> = {
  experience: { ru: 'Опыт', en: 'Experience' },
  preference: { ru: 'Предпочтение', en: 'Preference' },
  skill: { ru: 'Навык', en: 'Skill' },
  mistake: { ru: 'Ошибка', en: 'Mistake' },
  success: { ru: 'Успех', en: 'Success' },
};

export const KNOWLEDGE_CATEGORY_LABELS: Record<string, { ru: string; en: string }> = {
  general: { ru: 'Общие', en: 'General' },
  documentation: { ru: 'Документация', en: 'Documentation' },
  guide: { ru: 'Руководство', en: 'Guide' },
  reference: { ru: 'Справочник', en: 'Reference' },
  tutorial: { ru: 'Обучение', en: 'Tutorial' },
  faq: { ru: 'ЧаВО', en: 'FAQ' },
  api: { ru: 'API', en: 'API' },
  system_prompt: { ru: 'Системный промпт', en: 'System Prompt' },
  rejection_examples: { ru: 'Примеры отказов', en: 'Rejection Examples' },
  procedure: { ru: 'Процедура', en: 'Procedure' },
  standard: { ru: 'Стандарт', en: 'Standard' },
  hydrapedia: { ru: 'Гидрапедия', en: 'Hydrapedia' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function findDuplicates(chunks: SessionMemoryChunk[]): Map<string, string[]> {
  const duplicateMap = new Map<string, string[]>();
  const contentToIds = new Map<string, string[]>();
  chunks.forEach(chunk => {
    const norm = chunk.content.toLowerCase().trim().replace(/\s+/g, ' ');
    const ids = contentToIds.get(norm) || [];
    ids.push(chunk.id);
    contentToIds.set(norm, ids);
  });
  contentToIds.forEach(ids => {
    if (ids.length > 1) ids.forEach(id => duplicateMap.set(id, ids.filter(o => o !== id)));
  });
  return duplicateMap;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function fileIcon(mime: string | null) {
  if (!mime) return File;
  if (mime.startsWith('image/')) return FileImage;
  if (mime.startsWith('text/') || mime.includes('pdf')) return FileTextIcon;
  return File;
}

// ─── StatCard ────────────────────────────────────────────────────────────────

export function StatCard({ label, value, icon: Icon, accent, description }: { label: string; value: string | number; icon: React.ElementType; accent?: boolean; description?: string }) {
  return (
    <Card className={`border ${accent ? 'border-hydra-memory/40 bg-hydra-memory/5' : 'border-border bg-card'}`}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={`rounded-lg p-2 mt-0.5 shrink-0 ${accent ? 'bg-hydra-memory/15' : 'bg-muted'}`}>
          <Icon className={`h-5 w-5 ${accent ? 'text-hydra-memory' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">{label}</p>
          <p className="text-2xl font-extrabold mt-0.5">{value}</p>
          {description && <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Role Badge ──────────────────────────────────────────────────────────────

const ROLE_ALIASES: Record<string, string> = {
  flow_regulator: 'flowregulator',
  prompt_engineer: 'promptengineer',
  supervisor: 'user',
  admin: 'user',
  evolutioner: 'evolutioner',
  chronicler: 'chronicler',
};

export function matchRoleKey(raw: string): string | null {
  const lower = raw.toLowerCase().trim();
  if (ROLE_CONFIG[lower as keyof typeof ROLE_CONFIG]) return lower;
  if (ROLE_ALIASES[lower]) return ROLE_ALIASES[lower];
  for (const key of Object.keys(ROLE_CONFIG)) {
    if (lower.startsWith(key)) return key;
  }
  for (const [alias, target] of Object.entries(ROLE_ALIASES)) {
    if (lower.startsWith(alias)) return target;
  }
  return null;
}

export function RoleBadge({ value, isRu }: { value: string; isRu: boolean }) {
  const { t } = useLanguage();
  const roleKey = matchRoleKey(value);
  if (roleKey && ROLE_CONFIG[roleKey as keyof typeof ROLE_CONFIG]) {
    const cfg = ROLE_CONFIG[roleKey as keyof typeof ROLE_CONFIG];
    const Icon = cfg.icon;
    const isSup = value.toLowerCase().startsWith('supervisor') || value.toLowerCase().startsWith('admin');
    const color = isSup ? 'text-hydra-supervisor' : cfg.color;
    return (
      <Badge variant="outline" className={cn('text-xs font-medium gap-1 border', color, cfg.bgClass || '')}>
        <Icon className={cn('h-3 w-3', color)} />
        {t(cfg.label)}
      </Badge>
    );
  }
  return <Badge variant="outline" className="text-xs">{value}</Badge>;
}

// ─── AI Revision parser ──────────────────────────────────────────────────────

export function parseAiRevision(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.trajectory && Array.isArray(parsed.trajectory)) {
      return parsed.trajectory
        .filter((s: any) => s.content && typeof s.content === 'string')
        .map((s: any) => s.content)
        .join('\n\n');
    }
    return raw;
  } catch {
    return raw;
  }
}
