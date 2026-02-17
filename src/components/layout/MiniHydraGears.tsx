import React from 'react';

const ROLES = [
  { token: '--hydra-arbiter' },
  { token: '--hydra-toolsmith' },
  { token: '--hydra-critic' },
  { token: '--hydra-expert' },
  { token: '--hydra-analyst' },
  { token: '--hydra-webhunter' },
];

function miniGearPath(cx: number, cy: number, outerR: number, innerR: number, teeth: number): string {
  const points: string[] = [];
  const toothAngle = (Math.PI * 2) / teeth;
  const halfTooth = toothAngle / 4;
  for (let i = 0; i < teeth; i++) {
    const a = i * toothAngle - Math.PI / 2;
    points.push(
      `${cx + outerR * Math.cos(a - halfTooth)},${cy + outerR * Math.sin(a - halfTooth)}`,
      `${cx + outerR * Math.cos(a + halfTooth)},${cy + outerR * Math.sin(a + halfTooth)}`,
    );
    const va = a + toothAngle / 2;
    points.push(
      `${cx + innerR * Math.cos(va - halfTooth)},${cy + innerR * Math.sin(va - halfTooth)}`,
      `${cx + innerR * Math.cos(va + halfTooth)},${cy + innerR * Math.sin(va + halfTooth)}`,
    );
  }
  return `M${points[0]} ${points.slice(1).map(p => `L${p}`).join(' ')} Z`;
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
        fill="hsl(270, 50%, 75%)"
        opacity={0.8}
      />
      <circle cx={center} cy={center} r={6} fill="hsl(270, 50%, 85%)" />
      {/* Outer gears */}
      {positions.map((pos, i) => (
        <path
          key={i}
          d={miniGearPath(pos.x, pos.y, gearOuterR, gearInnerR, teeth)}
          fill={`hsl(var(${ROLES[i].token}))`}
          opacity={0.85}
        />
      ))}
    </svg>
  );
}
