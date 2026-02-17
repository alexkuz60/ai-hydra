import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ROLE_CONFIG, type AgentRole } from '@/config/roles';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Brain } from 'lucide-react';

// 6 default roles for gears
const DEFAULT_GEAR_ROLES: AgentRole[] = [
  'arbiter',
  'toolsmith',
  'critic',
  'assistant',
  'analyst',
  'webhunter',
];

interface GearConfig {
  role: AgentRole;
  angle: number; // position angle on circle
}

interface ActiveConnection {
  from: number;
  to: number;
}

interface HydraGearsProps {
  roles?: AgentRole[];
  activeConnections?: ActiveConnection[];
  spinning?: number[]; // indices of spinning gears
  className?: string;
}

// Generate gear tooth path (SVG)
function gearPath(cx: number, cy: number, outerR: number, innerR: number, teeth: number): string {
  const points: string[] = [];
  const toothAngle = (Math.PI * 2) / teeth;
  const halfTooth = toothAngle / 4;

  for (let i = 0; i < teeth; i++) {
    const a = i * toothAngle - Math.PI / 2;
    // outer tooth
    points.push(
      `${cx + outerR * Math.cos(a - halfTooth)},${cy + outerR * Math.sin(a - halfTooth)}`,
      `${cx + outerR * Math.cos(a + halfTooth)},${cy + outerR * Math.sin(a + halfTooth)}`,
    );
    // inner valley
    const va = a + toothAngle / 2;
    points.push(
      `${cx + innerR * Math.cos(va - halfTooth)},${cy + innerR * Math.sin(va - halfTooth)}`,
      `${cx + innerR * Math.cos(va + halfTooth)},${cy + innerR * Math.sin(va + halfTooth)}`,
    );
  }

  return `M${points[0]} ${points.slice(1).map(p => `L${p}`).join(' ')} Z`;
}

// Get HSL color from CSS variable name
function roleHsl(role: AgentRole): string {
  const colorClass = ROLE_CONFIG[role].color; // e.g. "text-hydra-expert"
  const token = colorClass.replace('text-', '').replace(/-/g, '-'); // hydra-expert
  return `hsl(var(--${token}))`;
}

export function HydraGears({
  roles = DEFAULT_GEAR_ROLES,
  activeConnections = [],
  spinning = [],
  className = '',
}: HydraGearsProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const viewBox = '0 0 500 500';
  const center = 250;
  const orbitR = 150; // distance from center to gear centers
  const gearOuterR = 48;
  const gearInnerR = 38;
  const gearTeeth = 12;
  const centerGearOuterR = 58;
  const centerGearInnerR = 46;
  const centerGearTeeth = 14;
  const iconSize = 28;
  const centerIconSize = 72;

  const gears: GearConfig[] = useMemo(
    () => roles.slice(0, 6).map((role, i) => ({
      role,
      angle: (i * 60 - 90) * (Math.PI / 180), // start from top
    })),
    [roles],
  );

  // Gear positions
  const gearPositions = useMemo(
    () => gears.map(g => ({
      x: center + orbitR * Math.cos(g.angle),
      y: center + orbitR * Math.sin(g.angle),
    })),
    [gears],
  );

  // All connections (each-to-all = 15 lines for 6 gears)
  const allConnections = useMemo(() => {
    const conns: { from: number; to: number }[] = [];
    for (let i = 0; i < 6; i++) {
      for (let j = i + 1; j < 6; j++) {
        conns.push({ from: i, to: j });
      }
    }
    return conns;
  }, []);

  const isActive = (from: number, to: number) =>
    activeConnections.some(
      c => (c.from === from && c.to === to) || (c.from === to && c.to === from),
    );

  const showAvatar = user && profile?.avatarUrl;

  return (
    <svg
      viewBox={viewBox}
      className={`w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Directional arrow marker */}
        <marker
          id="flow-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 8 5 L 0 9 z" fill="hsl(var(--primary))" fillOpacity={0.9} />
        </marker>

        {/* Animated dash for active connections */}
        <style>{`
          @keyframes gear-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes gear-spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          @keyframes dash-flow {
            to { stroke-dashoffset: -24; }
          }
          @keyframes icon-glow-pulse {
            0%, 100% { filter: drop-shadow(0 0 2px currentColor); opacity: 0.85; }
            50% { filter: drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor); opacity: 1; }
          }
          .gear-icon-active {
            animation: icon-glow-pulse 2.5s ease-in-out infinite;
          }
          .gear-spinning {
            animation: gear-spin 8s linear infinite;
          }
          .gear-spinning-reverse {
            animation: gear-spin-reverse 8s linear infinite;
          }
          .connection-active {
            animation: dash-flow 1s linear infinite;
          }
          .gear-group path, .gear-group circle {
            transition: stroke 0.4s ease, stroke-opacity 0.4s ease, fill-opacity 0.4s ease;
          }
        `}</style>

        {/* Clip for center avatar */}
        <clipPath id="avatar-clip">
          <circle cx={center} cy={center} r={centerGearInnerR - 6} />
        </clipPath>
      </defs>

      {/* Connection lines */}
      {allConnections.map(({ from, to }, idx) => {
        const active = isActive(from, to);
        // Find the directional connection to determine arrow direction
        const dirConn = active
          ? activeConnections.find(
              c => (c.from === from && c.to === to) || (c.from === to && c.to === from),
            )
          : null;
        const p1 = gearPositions[from];
        const p2 = gearPositions[to];

        // For active directional lines, shorten the line to not overlap with gear body
        if (active && dirConn) {
          const srcIdx = dirConn.from;
          const dstIdx = dirConn.to;
          const src = gearPositions[srcIdx];
          const dst = gearPositions[dstIdx];
          const dx = dst.x - src.x;
          const dy = dst.y - src.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / len;
          const uy = dy / len;
          const margin = gearOuterR + 4;
          return (
            <line
              key={`conn-${idx}`}
              x1={src.x + ux * margin}
              y1={src.y + uy * margin}
              x2={dst.x - ux * margin}
              y2={dst.y - uy * margin}
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              strokeOpacity={0.8}
              strokeDasharray="8 4"
              className="connection-active"
              filter="url(#glow)"
              markerEnd="url(#flow-arrow)"
            />
          );
        }

        return (
          <line
            key={`conn-${idx}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="hsl(var(--primary))"
            strokeWidth={0.8}
            strokeOpacity={0.15}
          />
        );
      })}

      {/* Connection lines to center gear */}
      {gearPositions.map((pos, idx) => (
        <line
          key={`center-conn-${idx}`}
          x1={pos.x}
          y1={pos.y}
          x2={center}
          y2={center}
          stroke="hsl(var(--primary))"
          strokeWidth={0.8}
          strokeOpacity={0.12}
        />
      ))}

      {/* Outer gears */}
      {gears.map((gear, idx) => {
        const pos = gearPositions[idx];
        const isSpinning = spinning.includes(idx);
        const color = roleHsl(gear.role);
        const IconComponent = ROLE_CONFIG[gear.role].icon;
        const isActiveGear = activeConnections.some(c => c.from === idx || c.to === idx);

        const defaultStroke = isActiveGear ? color : 'white';
        const defaultStrokeOpacity = isActiveGear ? '0.9' : '0.5';
        const defaultIconColor = isActiveGear ? color : 'rgba(255,255,255,0.5)';

        return (
          <g key={`gear-${idx}`} className="gear-group">
            {/* Invisible hover target */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={gearOuterR + 4}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                const g = e.currentTarget.parentElement;
                g?.querySelectorAll('path, circle:not(:first-child)').forEach(el => {
                  (el as SVGElement).style.stroke = color;
                  (el as SVGElement).style.strokeOpacity = '0.9';
                });
                const icon = g?.querySelector('.gear-icon') as HTMLElement;
                if (icon) icon.style.color = color;
              }}
              onMouseLeave={(e) => {
                const g = e.currentTarget.parentElement;
                g?.querySelectorAll('path, circle:not(:first-child)').forEach(el => {
                  (el as SVGElement).style.stroke = defaultStroke;
                  (el as SVGElement).style.strokeOpacity = defaultStrokeOpacity;
                });
                const icon = g?.querySelector('.gear-icon') as HTMLElement;
                if (icon) icon.style.color = defaultIconColor;
              }}
            />
            {/* Gear body (rotates) */}
            <g
              className={isSpinning ? (idx % 2 === 0 ? 'gear-spinning' : 'gear-spinning-reverse') : ''}
              style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
            >
              <path
                d={gearPath(pos.x, pos.y, gearOuterR, gearInnerR, gearTeeth)}
                fill="none"
                stroke={defaultStroke}
                strokeWidth={2}
                strokeOpacity={Number(defaultStrokeOpacity)}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={gearInnerR - 4}
                fill="hsl(var(--background))"
                fillOpacity={0.6}
                stroke={defaultStroke}
                strokeWidth={1.5}
                strokeOpacity={Number(defaultStrokeOpacity)}
              />
            </g>

            {/* Icon (does NOT rotate) */}
            <foreignObject
              x={pos.x - iconSize / 2}
              y={pos.y - iconSize / 2}
              width={iconSize}
              height={iconSize}
            >
              <div
                className={`gear-icon${isActiveGear ? ' gear-icon-active' : ''}`}
                style={{
                  width: iconSize, height: iconSize,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: defaultIconColor,
                  transition: 'color 0.4s ease',
                  borderRadius: '50%',
                }}
              >
                <IconComponent
                  size={iconSize - 4}
                  style={{ color: 'inherit' }}
                  strokeWidth={1.8}
                />
              </div>
            </foreignObject>
          </g>
        );
      })}

      {/* Center gear */}
      <g>
        {/* Gear body */}
        <g
          className="gear-spinning"
          style={{ transformOrigin: `${center}px ${center}px` }}
        >
          <path
            d={gearPath(center, center, centerGearOuterR, centerGearInnerR, centerGearTeeth)}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            strokeOpacity={0.6}
          />
          <circle
            cx={center}
            cy={center}
            r={centerGearInnerR - 4}
            fill="hsl(var(--background))"
            fillOpacity={0.7}
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            strokeOpacity={0.4}
          />
        </g>

        {/* Center content: avatar or brain (does NOT rotate) */}
        {showAvatar ? (
          <g>
            <clipPath id="center-avatar-clip">
              <circle cx={center} cy={center} r={centerGearInnerR - 8} />
            </clipPath>
            <image
              href={profile.avatarUrl!}
              x={center - (centerGearInnerR - 8)}
              y={center - (centerGearInnerR - 8)}
              width={(centerGearInnerR - 8) * 2}
              height={(centerGearInnerR - 8) * 2}
              clipPath="url(#center-avatar-clip)"
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        ) : (
          <foreignObject
            x={center - centerIconSize / 2}
            y={center - centerIconSize / 2}
            width={centerIconSize}
            height={centerIconSize}
          >
            <div
              style={{
                width: centerIconSize,
                height: centerIconSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain
                size={centerIconSize - 4}
                style={{ color: 'hsl(270, 50%, 75%)' }}
                strokeWidth={1.5}
              />
            </div>
          </foreignObject>
        )}
      </g>
    </svg>
  );
}
