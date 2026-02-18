import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Github } from 'lucide-react';

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

const GITHUB_URL = 'https://github.com/alexkuz60/ai-hydra';
const GITHUB_STAR_URL = 'https://github.com/alexkuz60/ai-hydra/stargazers';

type HelpOption = {
  id: string;
  labelRu: string;
  labelEn: string;
  href: string | null;
  type?: 'link' | 'social' | 'checkbox' | 'register';
};

const HELP_OPTIONS: HelpOption[] = [
  { id: 'star',       labelRu: '⭐ Поставить звезду на GitHub', labelEn: '⭐ Star on GitHub',        href: GITHUB_STAR_URL, type: 'link' },
  { id: 'contribute', labelRu: '🛠 Стать контрибьютором',       labelEn: '🛠 Become a contributor',   href: GITHUB_URL,      type: 'link' },
  { id: 'feedback',   labelRu: '💬 Оставить отзыв',             labelEn: '💬 Leave feedback',         href: null,            type: 'social' },
  { id: 'share',      labelRu: '📣 Рассказать друзьям',         labelEn: '📣 Tell friends',           href: null,            type: 'checkbox' },
  { id: 'donate',     labelRu: '💸 Поддержать донатом',         labelEn: '💸 Support with donation',  href: null,            type: 'checkbox' },
  { id: 'register',   labelRu: '📝 Зарегистрироваться',         labelEn: '📝 Register',               href: '/signup',       type: 'register' },
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
  const navigate = useNavigate();
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

  const handleOptionClick = (opt: HelpOption) => {
    if (opt.type === 'link' && opt.href) {
      window.open(opt.href, '_blank', 'noopener,noreferrer');
    } else if (opt.type === 'register' && opt.href) {
      setPopupOpen(false);
      navigate(opt.href);
    } else if (opt.type === 'social') {
      // placeholder — social links will be added later
    } else {
      setChecked(prev => ({ ...prev, [opt.id]: !prev[opt.id] }));
    }
  };

  const label = language === 'ru' ? 'Помочь проекту' : 'Support project';

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2 select-none">

      {/* ── Popup ── */}
      {popupOpen && (
        <>
          <style>{`
            @keyframes popup-slide-in {
              0%   { opacity: 0; transform: translateX(28px) scale(0.96); }
              60%  { opacity: 1; transform: translateX(-3px) scale(1.01); }
              100% { opacity: 1; transform: translateX(0)   scale(1); }
            }
            .popup-enter {
              animation: popup-slide-in 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
          `}</style>
          <div
            ref={popupRef}
            className="popup-enter mb-1 bg-background/95 backdrop-blur border border-border rounded-xl shadow-xl p-4 w-64"
            style={{ boxShadow: '0 8px 32px hsl(var(--primary)/0.18)', transformOrigin: 'right bottom' }}
          >
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span>🤝</span>
            {language === 'ru' ? 'Как вы можете помочь?' : 'How can you help?'}
          </p>
          <div className="flex flex-col gap-2">
            {HELP_OPTIONS.map(opt => {
              const isLink = opt.type === 'link' || opt.type === 'register';
              const isSocial = opt.type === 'social';
              const isGithub = opt.type === 'link' && opt.href?.includes('github');
              const isChecked = checked[opt.id];

              return (
                <div
                  key={opt.id}
                  className="flex items-center gap-2.5 cursor-pointer group"
                  onClick={() => handleOptionClick(opt)}
                >
                  {/* Indicator */}
                  {isLink || isSocial ? (
                    <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      {isGithub ? (
                        <Github size={14} />
                      ) : isLink ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7"/>
                          <path d="M8 1h3v3M11 1L5.5 6.5"/>
                        </svg>
                      ) : (
                        <span className="flex gap-0.5">
                          {/* Telegram */}
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.016 9.504c-.148.658-.537.818-1.088.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.39 4.53 13.5c-.656-.204-.67-.656.136-.97l10.853-4.184c.547-.2 1.025.12.843.902z"/>
                          </svg>
                          {/* Discord */}
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                          </svg>
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className={`w-4 h-4 rounded border transition-all flex-shrink-0 flex items-center justify-center ${
                      isChecked ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/60'
                    }`}>
                      {isChecked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  )}
                  <span className={`text-xs transition-colors ${
                    isLink || isSocial
                      ? 'text-muted-foreground group-hover:text-foreground underline-offset-2 group-hover:underline'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {language === 'ru' ? opt.labelRu : opt.labelEn}
                    {isSocial && <span className="ml-1 text-[9px] text-muted-foreground/50">(скоро)</span>}
                  </span>
                </div>
              );
            })}
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
        </>
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
          width={W / 2} height={H / 2}
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
                to   { transform: rotate(-52deg); }
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
