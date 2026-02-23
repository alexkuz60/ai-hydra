// MemoryGraphTab — extracted from HydraMemory.tsx
// This is a large SVG-based graph component, kept as-is for stability.

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BrainCircuit, Loader2, GitBranch, Zap, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ROLE_CONFIG } from '@/config/roles';
import type { useHydraMemoryStats } from '@/hooks/useHydraMemoryStats';
import { useMemoryI18n } from './i18n';

type GraphNodeType = 'center' | 'role' | 'session' | 'knowledge';

interface GraphNode {
  id: string;
  label: string;
  roleId?: string;
  type: GraphNodeType;
  count?: number;
  usageCount?: number;
  confidence?: number;
  category?: string;
  knowledgeCount?: number;
  sessionChunks?: number;
  x: number;
  y: number;
  r: number;
}

interface GraphEdge {
  source: string;
  target: string;
  kind?: 'role' | 'session' | 'knowledge' | 'cross';
}

type GraphLayer = 'role' | 'session' | 'knowledge' | 'cross';

export function MemoryGraphTab({ stats }: { stats: ReturnType<typeof useHydraMemoryStats> }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const tm = useMemoryI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgSize, setSvgSize] = useState({ w: 900, h: 560 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e && e.contentRect.width > 0) setSvgSize({ w: Math.round(e.contentRect.width), h: 700 });
    });
    obs.observe(el);
    const { width } = el.getBoundingClientRect();
    if (width > 0) setSvgSize({ w: Math.round(width), h: 700 });

    const mo = new MutationObserver(() => {
      const rect = el.getBoundingClientRect();
        if (rect.width > 0 && Math.abs(rect.width - svgSize.w) > 10)
        setSvgSize({ w: Math.round(rect.width), h: 700 });
    });
    if (el.parentElement) mo.observe(el.parentElement, { attributes: true, attributeFilter: ['hidden', 'data-state'] });
    return () => { obs.disconnect(); mo.disconnect(); };
  }, []);

  const [roleMemoryDetails, setRoleMemoryDetails] = useState<Record<string, { sessions: string[]; usageCount: number }>>({});
  const [sessionChunks, setSessionChunks] = useState<Record<string, number>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<GraphLayer>>(new Set(['role', 'knowledge']));
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggleLayer = (layer: GraphLayer) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer); else next.add(layer);
      return next;
    });
  };

  useEffect(() => {
    if (!user?.id || stats.roleMemory.length === 0) return;
    setLoadingDetails(true);
    Promise.all([
      supabase.from('role_memory').select('role, source_session_id, usage_count').eq('user_id', user.id),
      supabase.from('session_memory').select('session_id').eq('user_id', user.id),
    ]).then(([rmRes, smRes]) => {
      const details: Record<string, { sessions: string[]; usageCount: number }> = {};
      (rmRes.data || []).forEach(row => {
        if (!details[row.role]) details[row.role] = { sessions: [], usageCount: 0 };
        details[row.role].usageCount += row.usage_count || 0;
        if (row.source_session_id && !details[row.role].sessions.includes(row.source_session_id))
          details[row.role].sessions.push(row.source_session_id);
      });
      setRoleMemoryDetails(details);
      const chunks: Record<string, number> = {};
      (smRes.data || []).forEach(row => { if (row.session_id) chunks[row.session_id] = (chunks[row.session_id] || 0) + 1; });
      setSessionChunks(chunks);
      setLoadingDetails(false);
    });
  }, [user?.id, stats.roleMemory]);

  const knowledgePerRole = useMemo(() => {
    const map: Record<string, number> = {};
    stats.knowledge.forEach(k => { map[k.role] = (map[k.role] || 0) + k.count; });
    return map;
  }, [stats.knowledge]);

  const { nodes, edges } = useMemo(() => {
    const W = svgSize.w, H = svgSize.h, cx = W / 2, cy = H / 2;
    const allNodes: GraphNode[] = [];
    const allEdges: GraphEdge[] = [];
    const sessionIds = new Set<string>();
    const maxCount = Math.max(...stats.roleMemory.map(r => r.count), 1);

    allNodes.push({ id: 'center', label: tm('graph.hydra'), type: 'center', x: cx, y: cy, r: 60 });

    const roleRadius = Math.min(cx, cy) * 0.58 * 1.2;
    const sessionRadius = roleRadius * 1.4;

    stats.roleMemory.forEach((rm, i) => {
      const angle = (2 * Math.PI * i) / stats.roleMemory.length - Math.PI / 2;
      const nodeSize = (11 + (rm.count / maxCount) * 13) * 2;
      const roleConfig = ROLE_CONFIG[rm.role as keyof typeof ROLE_CONFIG];
      const roleLabel = roleConfig ? t(roleConfig.label) : rm.role;
      const roleNode: GraphNode = {
        id: `role_${rm.role}`, label: roleLabel, roleId: rm.role, type: 'role',
        count: rm.count, confidence: rm.avg_confidence,
        usageCount: roleMemoryDetails[rm.role]?.usageCount || 0,
        knowledgeCount: knowledgePerRole[rm.role] || 0,
        x: cx + roleRadius * Math.cos(angle), y: cy + roleRadius * Math.sin(angle), r: nodeSize,
      };
      allNodes.push(roleNode);
      allEdges.push({ source: 'center', target: roleNode.id, kind: 'role' });

      if ((knowledgePerRole[rm.role] || 0) > 0 && activeLayers.has('knowledge')) {
        const kNode: GraphNode = {
          id: `know_${rm.role}`, label: `${knowledgePerRole[rm.role]}`, roleId: rm.role, type: 'knowledge',
          knowledgeCount: knowledgePerRole[rm.role],
          x: roleNode.x + Math.cos(angle - Math.PI * 0.35) * (nodeSize + 20),
          y: roleNode.y + Math.sin(angle - Math.PI * 0.35) * (nodeSize + 20), r: 14,
        };
        allNodes.push(kNode);
        allEdges.push({ source: roleNode.id, target: kNode.id, kind: 'knowledge' });
      }

      const detail = roleMemoryDetails[rm.role];
      if (activeLayers.has('session') && detail && detail.usageCount > 0) {
        detail.sessions.slice(0, 2).forEach((sid, si) => {
      const sa = angle + ((si - 0.5) * 0.45);
          if (!sessionIds.has(sid)) {
            sessionIds.add(sid);
            allNodes.push({
              id: `sess_${sid}`, label: sid.slice(0, 8) + '…', type: 'session',
              sessionChunks: sessionChunks[sid] || 0,
              x: cx + sessionRadius * Math.cos(sa), y: cy + sessionRadius * Math.sin(sa),
              r: (6 + Math.min((sessionChunks[sid] || 0) / 10, 4)) * 2,
            });
          }
          allEdges.push({ source: roleNode.id, target: `sess_${sid}`, kind: 'session' });
        });
      }
    });

    if (activeLayers.has('cross')) {
      const roleSessionMap: Record<string, string[]> = {};
      stats.roleMemory.forEach(rm => { roleSessionMap[rm.role] = roleMemoryDetails[rm.role]?.sessions || []; });
      const roles = stats.roleMemory.map(r => r.role);
      for (let a = 0; a < roles.length; a++) {
        for (let b = a + 1; b < roles.length; b++) {
          const shared = roleSessionMap[roles[a]]?.filter(s => roleSessionMap[roles[b]]?.includes(s));
          if (shared && shared.length > 0) allEdges.push({ source: `role_${roles[a]}`, target: `role_${roles[b]}`, kind: 'cross' });
        }
      }
    }
    return { nodes: allNodes, edges: allEdges };
  }, [stats.roleMemory, roleMemoryDetails, sessionChunks, knowledgePerRole, activeLayers, t, language, svgSize]);

  const nodeMap = useMemo(() => { const m: Record<string, GraphNode> = {}; nodes.forEach(n => { m[n.id] = n; }); return m; }, [nodes]);

  if (stats.loading || loadingDetails) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--hydra-memory))]" /></div>;
  if (stats.roleMemory.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <GitBranch className="h-12 w-12 mb-3 opacity-30" />
      <p className="text-sm">{t('memory.hub.graphEmpty')}</p>
      <p className="text-xs mt-1 opacity-60">{t('memory.hub.graphEmptyHint')}</p>
    </div>
  );

  const maxUsage = Math.max(...stats.roleMemory.map(r => roleMemoryDetails[r.role]?.usageCount || 0), 1);

  const edgeColor = (kind?: string, hovered?: boolean) => {
    if (hovered) return 'hsl(var(--hydra-memory))';
    switch (kind) {
      case 'knowledge': return 'hsl(var(--hydra-glow))';
      case 'session':   return 'hsl(var(--hydra-expert))';
      case 'cross':     return 'hsl(var(--hydra-cyan))';
      default:          return 'hsl(var(--border))';
    }
  };

  const nodeFill = (node: GraphNode) => {
    switch (node.type) {
      case 'center':    return 'hsl(var(--hydra-cyan))';
      case 'session':   return 'hsl(var(--hydra-expert))';
      case 'knowledge': return 'hsl(var(--hydra-glow))';
      default:          return 'hsl(var(--hydra-memory))';
    }
  };

  const layerButtons: { key: GraphLayer; label: string; color: string }[] = [
    { key: 'role',      label: t('memory.hub.legendRole'),      color: 'hsl(var(--hydra-memory))' },
    { key: 'session',   label: t('memory.hub.legendSession'),   color: 'hsl(var(--hydra-expert))' },
    { key: 'knowledge', label: t('memory.hub.legendKnowledge'), color: 'hsl(var(--hydra-glow))' },
    { key: 'cross',     label: t('memory.hub.legendCross'),     color: 'hsl(var(--hydra-cyan))' },
  ];

  return (
    <Card className="overflow-hidden border-border">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-[hsl(var(--hydra-memory))]" />
            {tm('graph.title')}
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>{t('memory.hub.legendHot')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap pt-1">
          {layerButtons.map(({ key, label, color }) => (
            <button key={key} onClick={() => toggleLayer(key)}
              className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all',
                activeLayers.has(key) ? 'border-border bg-muted/60 text-foreground' : 'border-transparent bg-transparent text-muted-foreground opacity-50'
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
              {label}
              {key === 'cross' && <span className="ml-0.5 text-[10px] opacity-70">({t('memory.hub.legendCrossHint')})</span>}
            </button>
          ))}
        </div>
      </CardHeader>
      <div ref={containerRef} className="relative w-full" style={{ height: 700 }}>
        <svg ref={svgRef} viewBox={`0 0 ${svgSize.w} ${svgSize.h}`} className="w-full h-full" style={{ background: 'transparent' }}>
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.4" />
            </pattern>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--hydra-cyan))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(var(--hydra-cyan))" stopOpacity="0" />
            </radialGradient>
            <filter id="nodeGlow"><feGaussianBlur stdDeviation="2.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <marker id="arrow-cross" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="hsl(var(--hydra-cyan))" opacity="0.6" />
            </marker>
          </defs>
          <rect width={svgSize.w} height={svgSize.h} fill="url(#grid)" />
          <circle cx={svgSize.w / 2} cy={svgSize.h / 2} r="80" fill="url(#centerGlow)" />

          {edges.map((edge, i) => {
            const src = nodeMap[edge.source], tgt = nodeMap[edge.target];
            if (!src || !tgt) return null;
            const isHovered = hoveredId === edge.source || hoveredId === edge.target;
            const isCross = edge.kind === 'cross';
            const isKnowledge = edge.kind === 'knowledge';
            const isSession = edge.kind === 'session';
            return (
              <line key={i} x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={edgeColor(edge.kind, isHovered)}
                strokeWidth={isCross ? (isHovered ? 2 : 1.2) : (isHovered ? 1.8 : 0.7)}
                strokeDasharray={isCross ? '6 3' : isKnowledge ? '2 2' : isSession ? '4 3' : undefined}
                opacity={isHovered ? 0.9 : isCross ? 0.5 : isKnowledge ? 0.45 : 0.35}
                markerEnd={isCross && isHovered ? 'url(#arrow-cross)' : undefined}
              />
            );
          })}

          {nodes.map(node => {
            const isCenter = node.type === 'center';
            const isHot = node.type === 'role' && (roleMemoryDetails[node.roleId ?? '']?.usageCount || 0) > (maxUsage * 0.5);
            const isSelected = selected?.id === node.id;
            const isHovered = hoveredId === node.id;
            const fill = nodeFill(node);
            return (
              <g key={node.id} style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredId(node.id)} onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelected(isSelected ? null : node)}
                filter={isSelected || isHovered ? 'url(#nodeGlow)' : undefined}
              >
                {isHot && <circle cx={node.x} cy={node.y} r={node.r + 5} fill="none" stroke="hsl(var(--hydra-arbiter))" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.65" />}
                <circle cx={node.x} cy={node.y} r={node.r} fill={fill}
                  opacity={isSelected || isHovered ? 1 : node.type === 'knowledge' ? 0.7 : 0.75}
                  stroke={isSelected ? 'hsl(var(--foreground))' : 'transparent'} strokeWidth="2"
                />
                {node.type === 'knowledge' && <circle cx={node.x} cy={node.y} r={node.r - 2} fill="none" stroke="hsl(var(--background))" strokeWidth="1" opacity="0.4" />}
                <text x={node.x}
                  y={node.type === 'role' ? node.y + node.r + 10 : node.type === 'knowledge' ? node.y + node.r + 8 : node.y + 3}
                  textAnchor="middle" fill="hsl(var(--foreground))"
                  fontSize={isCenter ? 9 : node.type === 'knowledge' ? 7 : node.type === 'session' ? 6 : 8}
                  fontWeight={isCenter || isSelected ? 600 : 400} opacity={isCenter ? 1 : 0.85}
                >{isCenter ? node.label : node.label.slice(0, 12)}</text>
                {node.type === 'role' && node.count && node.count > 1 && (
                  <text x={node.x + node.r - 2} y={node.y - node.r + 5} textAnchor="middle" fill="hsl(var(--background))" fontSize="6" fontWeight={700}>{node.count}</text>
                )}
                {node.type === 'knowledge' && <text x={node.x} y={node.y + 2.5} textAnchor="middle" fill="hsl(var(--background))" fontSize="6" fontWeight={700}>{node.knowledgeCount}</text>}
                {node.type === 'session' && node.sessionChunks && node.sessionChunks > 0 && (
                  <text x={node.x} y={node.y + 2.5} textAnchor="middle" fill="hsl(var(--background))" fontSize="5.5" fontWeight={700}>{node.sessionChunks}</text>
                )}
                {isHot && <text x={node.x + node.r + 2} y={node.y - node.r + 3} fontSize="7">⚡</text>}
              </g>
            );
          })}
        </svg>

        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-3 left-3 right-3 bg-card/95 backdrop-blur border border-border rounded-lg p-3 text-xs shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: nodeFill(selected) }} />
                    <p className="font-semibold text-sm">{selected.label}</p>
                  </div>
                  {selected.type === 'role' && (
                    <div className="flex items-center gap-3 flex-wrap text-muted-foreground">
                      <span>{t('memory.hub.nodeExperienceRecords')}: <strong className="text-foreground">{selected.count}</strong></span>
                      {selected.confidence !== undefined && <span>{t('memory.hub.nodeAvgConfidence')}: <strong className="text-foreground">{(selected.confidence * 100).toFixed(0)}%</strong></span>}
                      {(selected.usageCount ?? 0) > 0 && <span className="flex items-center gap-1 text-hydra-arbiter"><Zap className="h-3 w-3" />{t('memory.hub.nodeUsages')}: {selected.usageCount}</span>}
                      {(selected.knowledgeCount ?? 0) > 0 && <span className="text-[hsl(var(--hydra-glow))]">{t('memory.hub.legendKnowledge')}: {selected.knowledgeCount}</span>}
                      {roleMemoryDetails[selected.roleId ?? '']?.sessions.length > 0 && <span>{t('memory.hub.nodeLinkedSessions')}: {roleMemoryDetails[selected.roleId ?? ''].sessions.length}</span>}
                    </div>
                  )}
                  {selected.type === 'knowledge' && <p className="text-muted-foreground">{t('memory.hub.legendKnowledge')}: <strong className="text-foreground">{selected.knowledgeCount}</strong> {t('memory.hub.knowledgeNodeDesc')}</p>}
                  {selected.type === 'session' && <p className="text-muted-foreground">{t('memory.hub.nodeSession')}: {selected.label}{(selected.sessionChunks ?? 0) > 0 && <span className="ml-2">&middot; {selected.sessionChunks} {t('memory.hub.sessionChunks')}</span>}</p>}
                  {selected.type === 'center' && <p className="text-muted-foreground">{t('memory.hub.nodeCenterDesc')}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setSelected(null)}><X className="h-3.5 w-3.5" /></Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {stats.roleMemory.filter(r => (roleMemoryDetails[r.role]?.usageCount || 0) > 0).length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-hydra-arbiter" />{t('memory.hub.roleActivity')}</p>
          <div className="space-y-1">
            {stats.roleMemory
              .filter(r => (roleMemoryDetails[r.role]?.usageCount || 0) > 0)
              .sort((a, b) => (roleMemoryDetails[b.role]?.usageCount || 0) - (roleMemoryDetails[a.role]?.usageCount || 0))
              .slice(0, 8)
              .map(r => {
                const roleConfig = ROLE_CONFIG[r.role as keyof typeof ROLE_CONFIG];
                const roleLabel = roleConfig ? t(roleConfig.label) : r.role;
                const usage = roleMemoryDetails[r.role]?.usageCount || 0;
                const pct = Math.round((usage / maxUsage) * 100);
                const kCount = knowledgePerRole[r.role] || 0;
                return (
                  <div key={r.role} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 truncate shrink-0">{roleLabel}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-hydra-memory transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{usage}</span>
                    {kCount > 0 && <span className="text-[10px] text-hydra-glow w-12 shrink-0">+{kCount} {language === 'ru' ? 'знаний' : 'docs'}</span>}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </Card>
  );
}
