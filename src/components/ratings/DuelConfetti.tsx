import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  swayAmount: number;
}

const CONFETTI_COLORS = [
  'hsl(var(--hydra-arbiter))',
  'hsl(var(--primary))',
  'hsl(var(--hydra-success))',
  'hsl(45 100% 60%)',   // gold
  'hsl(280 80% 65%)',   // purple
  'hsl(200 90% 60%)',   // cyan
];

function generatePieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.8 + Math.random() * 1.5,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
    swayAmount: -30 + Math.random() * 60,
  }));
}

export function DuelConfetti({ show }: { show: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (show && !hasTriggered.current) {
      hasTriggered.current = true;
      setPieces(generatePieces(40));
      const timer = setTimeout(() => setPieces([]), 4000);
      return () => clearTimeout(timer);
    }
    if (!show) hasTriggered.current = false;
  }, [show]);

  if (pieces.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
          }}
          initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: [0, 200, 400],
            x: [0, p.swayAmount, p.swayAmount * 0.5],
            rotate: [0, p.rotation, p.rotation * 2],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
