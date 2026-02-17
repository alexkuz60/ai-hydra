import React from 'react';

const ROLES = [
  { token: '--hydra-arbiter' },
  { token: '--hydra-toolsmith' },
  { token: '--hydra-critical' },
  { token: '--hydra-expert' },
  { token: '--hydra-analyst' },
  { token: '--hydra-webhunter' },
];

function miniGearPath(cx: number, cy: number, outerR: number, innerR: number, teeth: number): string {
  const steps = teeth * 16;
  const midR = (outerR + innerR) / 2;
  const amp = (outerR - innerR) / 2;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const r = midR + amp * Math.sin(teeth * angle);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    parts.push(i === 0 ? `M${x},${y}` : `L${x},${y}`);
  }
  return parts.join(' ') + ' Z';
}

export function MiniHydraGears({ className = '' }: { className?: string }) {
  const center = 50;
  const orbitR = 30;
  const gearOuterR = 11;
  const gearInnerR = 8;
  const teeth = 8;
  const centerR = 13;
  const centerInnerR = 10;

  const positions = ROLES.map((_, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    return { x: center + orbitR * Math.cos(angle), y: center + orbitR * Math.sin(angle) };
  });

  return (
    <svg
      viewBox="6 6 88 88"
      className={className}
      aria-hidden="true"
    >
      {/* Connection lines */}
      {positions.map((from, i) =>
        positions.slice(i + 1).map((to, j) => (
          <line
            key={`${i}-${i + j + 1}`}
            x1={from.x} y1={from.y}
            x2={to.x} y2={to.y}
            stroke="currentColor"
            strokeWidth={0.5}
            opacity={0.2}
          />
        ))
      )}
      {/* Center gear */}
      <path
        d={miniGearPath(center, center, centerR, centerInnerR, 10)}
        fill="hsl(270, 25%, 80%)"
        opacity={0.8}
      />
      <circle cx={center} cy={center} r={6} fill="hsl(270, 25%, 90%)" />
      {/* Outer gears */}
      {positions.map((pos, i) => (
        <path
          key={i}
          d={miniGearPath(pos.x, pos.y, gearOuterR, gearInnerR, teeth)}
          fill={`hsl(var(${ROLES[i].token}) / 0.5)`}
          opacity={0.85}
        />
      ))}
    </svg>
  );
}
