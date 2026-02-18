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
const W = 260, H = 250;

// Big gear (right, dominant)
const BIG_CX = 155, BIG_CY = 172, BIG_OUTER = 72, BIG_INNER = 50, BIG_TEETH = 12;

// Small gear (left, meshing)
const SM_CX  =  58, SM_CY  = 182, SM_OUTER  = 46, SM_INNER  = 32, SM_TEETH  = 8;

// Oil can: scale 5.5 → ~132px, upper-right of canvas, nozzle toward gears
const CAN_TX = 100, CAN_TY = 4, CAN_S = 5.5;

// Drop: from nozzle toward gear mesh area
const DROP_CX = 120, DROP_CY = 105;
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
                0%   { opacity: 0;   transform: translateY(-4px)  scale(0.5); }
                15%  { opacity: 1; }
                80%  { opacity: 1;   transform: translateY(20px)  scale(1.1); }
                100% { opacity: 0;   transform: translateY(26px)  scale(0.3); }
              }
              @keyframes can-appear {
                from { opacity: 0; transform: translateX(16px); }
                to   { opacity: 1; transform: translateX(0); }
              }
              @keyframes can-tilt {
                from { transform: rotate(0deg); }
                to   { transform: rotate(-44deg); }
              }

              .gear-big-spinning {
                animation: spin-cw 3.2s linear infinite;
                transform-origin: ${BIG_CX}px ${BIG_CY}px;
              }
              .gear-sm-spinning {
                animation: spin-ccw 3.2s linear infinite;
                transform-origin: ${SM_CX}px ${SM_CY}px;
              }
              .can-appear-anim {
                animation: can-appear 0.35s ease-out forwards;
              }
              .can-tilt-anim {
                animation: can-tilt 0.55s ease-in-out forwards;
                transform-box: fill-box;
                transform-origin: center;
              }
              .drop-anim {
                animation: drop-fall 1s ease-in infinite;
                transform-origin: ${DROP_CX}px ${DROP_CY}px;
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
            <circle cx={BIG_CX} cy={BIG_CY} r={BIG_INNER - 10}
              fill="hsl(var(--background))" />
            <circle cx={BIG_CX} cy={BIG_CY} r={9}
              fill="hsl(var(--foreground))" fillOpacity={0.3} />
          </g>

          {/* ── Small gear (left) ── */}
          <g className={oiling ? 'gear-sm-spinning' : ''}>
            <path
              d={gearPath(SM_CX, SM_CY, SM_OUTER, SM_INNER, SM_TEETH)}
              fill="hsl(var(--foreground))"
              fillOpacity={0.5}
            />
            <circle cx={SM_CX} cy={SM_CY} r={SM_INNER - 7}
              fill="hsl(var(--background))" />
            <circle cx={SM_CX} cy={SM_CY} r={6}
              fill="hsl(var(--foreground))" fillOpacity={0.25} />
          </g>

          {/* ── Oil drop (only while oiling) ── */}
          {oiling && (
            <ellipse
              className="drop-anim"
              cx={DROP_CX} cy={DROP_CY}
              rx={7} ry={9}
              fill="hsl(var(--foreground))"
              fillOpacity={0.75}
            />
          )}

          {/* ── Oil can (on hover) ── */}
          {hovered && (
            <g
              className={oiling ? 'can-tilt-anim' : 'can-appear-anim'}
              transform={`translate(${CAN_TX}, ${CAN_TY}) scale(${CAN_S})`}
              fill="hsl(var(--foreground))"
              fillOpacity={0.6}
            >
              <path d="M22 12.5s2 2.17 2 3.5a2 2 0 0 1-2 2a2 2 0 0 1-2-2c0-1.33 2-3.5 2-3.5M6 6h4a1 1 0 0 1 1 1a1 1 0 0 1-1 1H9v2h2c.74 0 1.39.4 1.73 1l6.51-3.76l3.26 1.89c.5.27.64.87.37 1.37c-.28.47-.87.64-1.37.36l-2.1-1.21l-3.65 6.32c-.34.61-1 1.03-1.75 1.03H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2V8H6a1 1 0 0 1-1-1a1 1 0 0 1 1-1m-1 6v3h9l2.06-3.57l-3.46 2l-.91-1.43zM.38 9.21L2.09 7.5c.41-.39 1.02-.39 1.41 0s.39 1 0 1.41l-1.71 1.71c-.39.38-1.02.38-1.41 0C0 10.23 0 9.6.38 9.21" />
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
