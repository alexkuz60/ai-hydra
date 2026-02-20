import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_CONFIG } from '@/config/roles';
import { MemoryGraphTab } from './MemoryGraphTab';
import type { useHydraMemoryStats } from '@/hooks/useHydraMemoryStats';

// ─── Arsenal Connections Graph ──────────────────────────────────────────────

interface ArsenalGraphNode {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  r: number;
  color: string;
  glow: string;
  type: 'layer' | 'role';
  value: number;
}

interface ArsenalGraphEdge {
  source: string;
  target: string;
  weight: number;
  color: string;
}

function ArsenalConnectionsGraph({
  counts,
  stats,
  roleData,
}: {
  counts: {
    prompts: { total: number; system: number; custom: number };
    blueprints: { total: number; system: number; custom: number };
    behaviors: { total: number; system: number; custom: number };
    tools: { total: number; prompt: number; http: number };
    flows: { total: number };
  };
  stats: ReturnType<typeof useHydraMemoryStats>;
  roleData: { role: string; memCount: number; knowledgeCount: number; promptCount: number }[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 700, h: 440 });
  const [hovered, setHovered] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const isRu = language === 'ru';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e && e.contentRect.width > 0) {
        setSize({ w: Math.round(e.contentRect.width), h: 560 });
      }
    });
    obs.observe(el);
    const { width } = el.getBoundingClientRect();
    if (width > 0) setSize({ w: Math.round(width), h: 560 });
    return () => obs.disconnect();
  }, []);

  const { nodes, edges } = useMemo(() => {
    const { w, h } = size;
    const cx = w / 2;
    const cy = h / 2;
    const layerR = Math.min(cx, cy) * 0.72;
    const roleR = Math.min(cx, cy) * 0.30;

    const layerDefs = [
      { id: 'instincts', label: isRu ? 'Инстинкты' : 'Instincts', value: counts.prompts.total, color: 'hsl(var(--hydra-expert))', glow: 'hsl(var(--hydra-expert) / 0.4)' },
      { id: 'patterns',  label: isRu ? 'Паттерны' : 'Patterns',   value: counts.blueprints.total + counts.behaviors.total, color: 'hsl(var(--hydra-arbiter))', glow: 'hsl(var(--hydra-arbiter) / 0.4)' },
      { id: 'tools',     label: isRu ? 'Инструменты' : 'Tools',    value: counts.tools.total, color: 'hsl(var(--hydra-info))', glow: 'hsl(var(--hydra-info) / 0.4)' },
      { id: 'flows',     label: isRu ? 'Потоки' : 'Flows',          value: counts.flows.total, color: 'hsl(var(--hydra-cyan))', glow: 'hsl(var(--hydra-cyan) / 0.4)' },
      { id: 'achieve',   label: isRu ? 'Достижения' : 'Achieve',   value: 0, color: 'hsl(var(--hydra-success))', glow: 'hsl(var(--hydra-success) / 0.4)' },
      { id: 'memory',    label: isRu ? 'Память' : 'Memory',         value: stats.totalRoleMemory + stats.totalKnowledge + stats.sessionMemory.total, color: 'hsl(var(--hydra-memory))', glow: 'hsl(var(--hydra-memory) / 0.4)' },
    ];

    const maxLayerVal = Math.max(...layerDefs.map(l => l.value), 1);

    const layerNodes: ArsenalGraphNode[] = layerDefs.map((def, i) => {
      const angle = (2 * Math.PI * i) / layerDefs.length - Math.PI / 2;
      const nodeR = 30 + (def.value / maxLayerVal) * 22;
      return {
        id: def.id, label: def.label,
        x: cx + layerR * Math.cos(angle), y: cy + layerR * Math.sin(angle),
        r: nodeR, color: def.color, glow: def.glow, type: 'layer' as const, value: def.value,
      };
    });

    const topRoles = roleData
      .filter(r => r.memCount > 0 || r.knowledgeCount > 0 || r.promptCount > 0)
      .sort((a, b) => (b.memCount + b.knowledgeCount + b.promptCount) - (a.memCount + a.knowledgeCount + a.promptCount))
      .slice(0, 7);

    const maxRoleVal = Math.max(...topRoles.map(r => r.memCount + r.knowledgeCount + r.promptCount), 1);

    const roleNodes: ArsenalGraphNode[] = topRoles.map((r, i) => {
      const angle = (2 * Math.PI * i) / topRoles.length - Math.PI / 2;
      const total = r.memCount + r.knowledgeCount + r.promptCount;
      const nodeR = 20 + (total / maxRoleVal) * 16;
      const roleConfig = ROLE_CONFIG[r.role as keyof typeof ROLE_CONFIG];
      const roleLabel = roleConfig ? t(roleConfig.label) : r.role;
      return {
        id: `role_${r.role}`, label: roleLabel, sublabel: `${total}`,
        x: cx + roleR * Math.cos(angle), y: cy + roleR * Math.sin(angle),
        r: nodeR, color: 'hsl(var(--muted-foreground))', glow: 'hsl(var(--muted-foreground) / 0.3)',
        type: 'role' as const, value: total,
      };
    });

    const allNodes = [...layerNodes, ...roleNodes];
    const allEdges: ArsenalGraphEdge[] = [];
    const maxEdgeWeight = Math.max(...topRoles.map(r => r.memCount + r.knowledgeCount + r.promptCount), 1);

    topRoles.forEach(r => {
      const roleId = `role_${r.role}`;
      if (r.promptCount > 0) allEdges.push({ source: 'instincts', target: roleId, weight: r.promptCount / maxEdgeWeight, color: 'hsl(var(--hydra-expert))' });
      if (r.memCount > 0) allEdges.push({ source: 'memory', target: roleId, weight: r.memCount / maxLayerVal, color: 'hsl(var(--hydra-memory))' });
      if (r.knowledgeCount > 0) allEdges.push({ source: 'memory', target: roleId, weight: r.knowledgeCount / maxLayerVal, color: 'hsl(var(--hydra-success))' });
    });

    allEdges.push({ source: 'instincts', target: 'patterns', weight: 0.4, color: 'hsl(var(--hydra-expert) / 0.6)' });
    allEdges.push({ source: 'patterns', target: 'tools', weight: 0.35, color: 'hsl(var(--hydra-info) / 0.6)' });
    allEdges.push({ source: 'tools', target: 'flows', weight: 0.35, color: 'hsl(var(--hydra-cyan) / 0.6)' });
    allEdges.push({ source: 'memory', target: 'achieve', weight: 0.3, color: 'hsl(var(--hydra-success) / 0.6)' });

    return { nodes: allNodes, edges: allEdges };
  }, [size, counts, stats, roleData, isRu]);

  const getNode = (id: string) => nodes.find(n => n.id === id);

  return (
    <Card className="border-border bg-card/50 overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-hydra-memory" />
            {isRu ? 'Граф связей' : 'Connections Graph'}
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            {isRu ? 'Роли как мосты между слоями' : 'Roles as bridges between layers'}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={containerRef} className="w-full relative" style={{ height: 560 }}>
          <svg width={size.w} height={size.h} className="absolute inset-0">
            <defs>
              {nodes.map(n => (
                <radialGradient key={`grad_${n.id}`} id={`grad_${n.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={n.color} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={n.color} stopOpacity="0.35" />
                </radialGradient>
              ))}
              <filter id="glow-arsenal">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {edges.map((edge, i) => {
              const src = getNode(edge.source);
              const tgt = getNode(edge.target);
              if (!src || !tgt) return null;
              const isActive = hovered === edge.source || hovered === edge.target;
              const strokeW = 0.8 + edge.weight * 3.5;
              return (
                <line
                  key={i}
                  x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                  stroke={edge.color} strokeWidth={strokeW}
                  strokeOpacity={isActive ? 0.85 : 0.22}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-opacity 0.2s' }}
                />
              );
            })}

            {nodes.map(node => {
              const isHov = hovered === node.id;
              const scale = isHov ? 1.18 : 1;
              const opacity = hovered && !isHov && !edges.some(e => (e.source === hovered || e.target === hovered) && (e.source === node.id || e.target === node.id)) ? 0.45 : 1;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  style={{ cursor: 'pointer', opacity, transition: 'opacity 0.2s' }}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {isHov && (
                    <circle r={node.r * scale + 6} fill="none" stroke={node.color} strokeWidth={2} strokeOpacity={0.5} filter="url(#glow-arsenal)" />
                  )}
                  <circle
                    r={node.r * scale} fill={`url(#grad_${node.id})`}
                    stroke={node.color} strokeWidth={node.type === 'layer' ? 1.5 : 1} strokeOpacity={0.7}
                    style={{ transition: 'r 0.2s' }}
                  />
                  <text
                    textAnchor="middle" dominantBaseline="middle" fill="white"
                    fontSize={node.type === 'layer' ? Math.max(11, node.r * 0.46) : Math.max(10, node.r * 0.44)}
                    fontWeight={node.type === 'layer' ? 600 : 500}
                    dy={node.sublabel ? -5 : 0}
                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                  >
                    {node.label.length > 12 ? node.label.slice(0, 11) + '…' : node.label}
                  </text>
                  {node.sublabel && (
                    <text textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={7} fontWeight={400} dy={7} fillOpacity={0.7} style={{ userSelect: 'none', pointerEvents: 'none' }}>
                      {node.sublabel}
                    </text>
                  )}
                  {node.type === 'layer' && node.value > 0 && !isHov && (
                    <text textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={8} dy={node.r * 0.52 + 10} fillOpacity={0.55} style={{ userSelect: 'none', pointerEvents: 'none' }}>
                      {node.value}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {hovered && (() => {
            const n = nodes.find(nd => nd.id === hovered);
            if (!n) return null;
            return (
              <div
                className="absolute bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-none z-10"
                style={{ left: Math.min(n.x + n.r + 8, size.w - 160), top: Math.max(n.y - 30, 4) }}
              >
                <p className="font-semibold">{n.label}</p>
                {n.type === 'role' && (() => {
                  const rd = roleData.find(r => `role_${r.role}` === n.id);
                  return rd ? (
                    <div className="mt-1 space-y-0.5 text-muted-foreground">
                      {rd.promptCount > 0 && <p>💜 {isRu ? 'Промпты' : 'Prompts'}: {rd.promptCount}</p>}
                      {rd.memCount > 0 && <p>🔵 {isRu ? 'Память' : 'Memory'}: {rd.memCount}</p>}
                      {rd.knowledgeCount > 0 && <p>🟢 {isRu ? 'Знания' : 'Knowledge'}: {rd.knowledgeCount}</p>}
                    </div>
                  ) : null;
                })()}
                {n.type === 'layer' && (
                  <p className="text-muted-foreground mt-0.5">{isRu ? 'Объектов' : 'Objects'}: {n.value}</p>
                )}
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── DualGraphsTab ──────────────────────────────────────────────────────────

export function DualGraphsTab({ stats }: { stats: ReturnType<typeof useHydraMemoryStats> }) {
  const { user } = useAuth();

  const [counts, setCounts] = useState({
    prompts: { total: 0, system: 0, custom: 0 },
    blueprints: { total: 0, system: 0, custom: 0 },
    behaviors: { total: 0, system: 0, custom: 0 },
    tools: { total: 0, prompt: 0, http: 0 },
    flows: { total: 0 },
    interviews: { total: 0, completed: 0 },
    contests: { total: 0, completed: 0 },
  });

  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      try {
        const [promptsRes, blueprintsRes, behaviorsRes, toolsRes, flowsRes] = await Promise.all([
          supabase.from('prompt_library').select('is_default').eq('user_id', user.id),
          supabase.from('task_blueprints').select('is_system'),
          supabase.from('role_behaviors').select('is_system'),
          supabase.rpc('get_custom_tools_safe'),
          supabase.from('flow_diagrams').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);
        const prompts = (promptsRes.data || []) as { is_default: boolean }[];
        const blueprints = (blueprintsRes.data || []) as { is_system: boolean }[];
        const behaviors = (behaviorsRes.data || []) as { is_system: boolean }[];
        const tools = (toolsRes.data || []) as { tool_type?: string }[];
        setCounts(prev => ({
          ...prev,
          prompts: { total: prompts.length, system: prompts.filter(p => p.is_default).length, custom: prompts.filter(p => !p.is_default).length },
          blueprints: { total: blueprints.length, system: blueprints.filter(b => b.is_system).length, custom: blueprints.filter(b => !b.is_system).length },
          behaviors: { total: behaviors.length, system: behaviors.filter(b => b.is_system).length, custom: behaviors.filter(b => !b.is_system).length },
          tools: { total: tools.length, prompt: tools.filter(t => t.tool_type === 'prompt' || !t.tool_type).length, http: tools.filter(t => t.tool_type === 'http_api').length },
          flows: { total: flowsRes.count || 0 },
        }));
      } catch (e) {
        console.error('[DualGraphsTab]', e);
      }
    };
    fetch();
  }, [user?.id]);

  const { t } = useLanguage();
  const [rolePromptCounts, setRolePromptCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('prompt_library').select('role').eq('user_id', user.id).then(({ data }) => {
      const map: Record<string, number> = {};
      (data || []).forEach((r: { role: string }) => { map[r.role] = (map[r.role] || 0) + 1; });
      setRolePromptCounts(map);
    });
  }, [user?.id]);

  const knowledgePerRole = useMemo(() => {
    const map: Record<string, number> = {};
    stats.knowledge.forEach(k => { map[k.role] = (map[k.role] || 0) + k.count; });
    return map;
  }, [stats.knowledge]);

  const roleData = useMemo(() => {
    const allRoles = new Set([
      ...stats.roleMemory.map(r => r.role),
      ...Object.keys(knowledgePerRole),
      ...Object.keys(rolePromptCounts),
    ]);
    return Array.from(allRoles).map(role => ({
      role,
      memCount: stats.roleMemory.find(r => r.role === role)?.count || 0,
      knowledgeCount: knowledgePerRole[role] || 0,
      promptCount: rolePromptCounts[role] || 0,
    }));
  }, [stats.roleMemory, knowledgePerRole, rolePromptCounts]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <MemoryGraphTab stats={stats} />
      <ArsenalConnectionsGraph counts={counts} stats={stats} roleData={roleData} />
    </div>
  );
}
