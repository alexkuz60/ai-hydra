import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Gear tooth path (sinusoidal profile)
function gearPath(cx: number, cy: number, outerR: number, innerR: number, teeth: number): string {
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

const HELP_OPTIONS = [
  { id: 'star',       labelRu: '⭐ Поставить звезду на GitHub', labelEn: '⭐ Star on GitHub',        href: 'https://github.com' },
  { id: 'share',      labelRu: '📣 Рассказать друзьям',         labelEn: '📣 Tell friends',           href: null },
  { id: 'feedback',   labelRu: '💬 Оставить отзыв',             labelEn: '💬 Leave feedback',         href: null },
  { id: 'contribute', labelRu: '🛠 Стать контрибьютором',       labelEn: '🛠 Become a contributor',   href: null },
  { id: 'donate',     labelRu: '💸 Поддержать донатом',         labelEn: '💸 Support with donation',  href: null },
];

// ─── Layout constants ─────────────────────────────────────────────────────────
// Canvas
const W = 260, H = 260;

// Big gear (right)
const BIG_CX = 168, BIG_CY = 192, BIG_OUTER = 66, BIG_INNER = 46, BIG_TEETH = 12;

// Small gear (left) — meshing tightly with big
const SM_CX = 76, SM_CY = 204, SM_OUTER = 42, SM_INNER = 29, SM_TEETH = 8;

// Mesh point X between the two gears
const MESH_X = (SM_CX + SM_OUTER + BIG_CX - BIG_OUTER) / 2 + (SM_OUTER + BIG_OUTER) / 2 * 0.5;
// Drop position — from nozzle tip after tilt, falls between gears
const DROP_X = 122;
const DROP_Y_START = 133; // between gear tops
// ─────────────────────────────────────────────────────────────────────────────

export function HelpMeWidget() {
  const { language } = useLanguage();
  const [hovered, setHovered] = useState(false);
  const [oiling,  setOiling]  = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hovered) {
      timerRef.current = setTimeout(() => setOiling(true), 1000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setOiling(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [hovered]);

  useEffect(() => {
    if (!popupOpen) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popupOpen]);

  const toggleCheck = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const label = language === 'ru' ? 'Помочь проекту' : 'Support project';

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2 select-none">

      {/* ── Popup ── */}
      {popupOpen && (
        <div
          ref={popupRef}
          className="mb-1 bg-background/95 backdrop-blur border border-border rounded-xl shadow-xl p-4 w-64 animate-fade-in"
          style={{ boxShadow: '0 8px 32px hsl(var(--primary)/0.18)' }}
        >
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span>🤝</span>
            {language === 'ru' ? 'Как вы можете помочь?' : 'How can you help?'}
          </p>
          <div className="flex flex-col gap-2">
            {HELP_OPTIONS.map(opt => (
              <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => toggleCheck(opt.id)}
                  className={`w-4 h-4 rounded border transition-all flex-shrink-0 flex items-center justify-center ${
                    checked[opt.id] ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/60'
                  }`}
                >
                  {checked[opt.id] && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span
                  onClick={() => toggleCheck(opt.id)}
                  className="text-xs text-muted-foreground group-hover:text-foreground transition-colors"
                >
                  {language === 'ru' ? opt.labelRu : opt.labelEn}
                </span>
              </label>
            ))}
          </div>
          {Object.values(checked).some(Boolean) && (
            <button
              className="mt-3 w-full text-xs py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
              onClick={() => setPopupOpen(false)}
            >
              {language === 'ru' ? 'Спасибо! 💙' : 'Thank you! 💙'}
            </button>
          )}
        </div>
      )}

      {/* ── SVG Widget ── */}
      <div
        className="cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setPopupOpen(p => !p)}
        title={label}
      >
        <svg
          width={W} height={H}
          viewBox={`0 0 ${W} ${H}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <style>{`
              @keyframes spin-cw {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
              }
              @keyframes spin-ccw {
                from { transform: rotate(0deg); }
                to   { transform: rotate(-360deg); }
              }
              @keyframes drop-fall {
                0%   { opacity: 0;   transform: translateY(0px)   scale(0.6); }
                15%  { opacity: 1; }
                75%  { opacity: 1;   transform: translateY(28px)  scale(1); }
                100% { opacity: 0;   transform: translateY(36px)  scale(0.3); }
              }
              @keyframes can-appear {
                from { opacity: 0; transform: translateX(20px); }
                to   { opacity: 1; transform: translateX(0); }
              }
              @keyframes can-tilt {
                from { transform: rotate(0deg); }
                to   { transform: rotate(52deg); }
              }

              .gear-big-spinning {
                animation: spin-cw 3.2s linear infinite;
                transform-origin: ${BIG_CX}px ${BIG_CY}px;
              }
              .gear-sm-spinning {
                animation: spin-ccw 2.02s linear infinite;
                transform-origin: ${SM_CX}px ${SM_CY}px;
              }
              .can-appear-anim {
                animation: can-appear 0.35s ease-out forwards;
              }
              .can-tilt-anim {
                animation: can-tilt 0.6s ease-in-out forwards;
                transform-box: fill-box;
                transform-origin: 50% 50%;
              }
              .drop-anim {
                animation: drop-fall 0.9s ease-in infinite;
                transform-origin: ${DROP_X}px ${DROP_Y_START}px;
              }
            `}</style>
          </defs>

          {/* ── Big gear (right) ── */}
          <g className={oiling ? 'gear-big-spinning' : ''}>
            <path
              d={gearPath(BIG_CX, BIG_CY, BIG_OUTER, BIG_INNER, BIG_TEETH)}
              fill="hsl(var(--foreground))"
              fillOpacity={0.55}
            />
            <circle cx={BIG_CX} cy={BIG_CY} r={BIG_INNER - 12}
              fill="hsl(var(--background))" />
            <circle cx={BIG_CX} cy={BIG_CY} r={8}
              fill="hsl(var(--foreground))" fillOpacity={0.3} />
          </g>

          {/* ── Small gear (left) ── */}
          <g className={oiling ? 'gear-sm-spinning' : ''}>
            <path
              d={gearPath(SM_CX, SM_CY, SM_OUTER, SM_INNER, SM_TEETH)}
              fill="hsl(var(--foreground))"
              fillOpacity={0.5}
            />
            <circle cx={SM_CX} cy={SM_CY} r={SM_INNER - 8}
              fill="hsl(var(--background))" />
            <circle cx={SM_CX} cy={SM_CY} r={6}
              fill="hsl(var(--foreground))" fillOpacity={0.25} />
          </g>

          {/* ── Oil drop — only when oiling (can is tilted, nozzle down) ── */}
          {oiling && (
            <path
              className="drop-anim"
              d={`M${DROP_X},${DROP_Y_START - 10} C${DROP_X - 7},${DROP_Y_START - 2} ${DROP_X - 9},${DROP_Y_START + 8} ${DROP_X},${DROP_Y_START + 12} C${DROP_X + 9},${DROP_Y_START + 8} ${DROP_X + 7},${DROP_Y_START - 2} ${DROP_X},${DROP_Y_START - 10} Z`}
              fill="#d4a017"
              fillOpacity={0.9}
            />
          )}

          {/* ── Oil can — large custom SVG silhouette, upper-right ── */}
          {/* In rest state: horizontal, nozzle pointing LEFT.
              On oiling: rotates +50° clockwise → nozzle points DOWN-LEFT toward gear mesh. */}
          {hovered && (
            <g
              className={oiling ? 'can-tilt-anim' : 'can-appear-anim'}
              fill="hsl(var(--foreground))"
              fillOpacity={0.65}
            >
              {/* Body of the oil can — horizontal rectangle, rightmost area of canvas */}
              <rect x="152" y="22" width="90" height="55" rx="7" ry="7" />

              {/* Handle — arch on top-right */}
              <rect x="228" y="8"  width="16" height="30" rx="5" ry="5" />
              <rect x="222" y="4"  width="26" height="12" rx="5" ry="5" />

              {/* Filler cap on top center */}
              <rect x="172" y="10" width="22" height="14" rx="4" ry="4" />

              {/* Nozzle — horizontal pipe pointing left from body */}
              {/* Nozzle base (wide, attached to left wall of body) */}
              <polygon points="152,38 152,58 116,52 116,44" />
              {/* Nozzle taper to tip */}
              <polygon points="116,44 116,52 100,50 100,46" />
              {/* Nozzle rounded tip */}
              <ellipse cx="100" cy="48" rx="4" ry="5" />

              {/* Decorative body stripe */}
              <rect x="160" y="30" width="74" height="7" rx="3" ry="3" fill="hsl(var(--background))" fillOpacity={0.18} />
            </g>
          )}
        </svg>

        {/* Label */}
        <div
          className="text-center mt-0.5"
          style={{
            fontFamily: '"Quicksand", sans-serif',
            fontSize: 11,
            color: 'hsl(var(--muted-foreground))',
            letterSpacing: '0.03em',
            opacity: hovered ? 1 : 0.65,
            transition: 'opacity 0.3s',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
