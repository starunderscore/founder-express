"use client";
import { motion, useReducedMotion } from 'framer-motion';

export function FloatingGradients() {
  const reduce = useReducedMotion();

  const common: React.CSSProperties = {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.5,
    pointerEvents: 'none',
    mixBlendMode: 'screen',
  };

  const duration = reduce ? 0 : 24;

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      <motion.div
        style={{
          ...common,
          background: 'radial-gradient(closest-side, rgba(167,139,250,0.7), rgba(167,139,250,0) 70%)',
          left: -140,
          top: -100,
        }}
        initial={{ x: -20, y: -10, scale: 0.95 }}
        animate={{ x: [ -20, 20, 0, -20 ], y: [ -10, 5, 15, -10 ], scale: [0.95, 1.03, 1.0, 0.95 ] }}
        transition={{ duration, ease: 'easeInOut', repeat: reduce ? 0 : Infinity, repeatType: 'mirror' }}
      />
      <motion.div
        style={{
          ...common,
          background: 'radial-gradient(closest-side, rgba(94,234,212,0.6), rgba(94,234,212,0) 70%)',
          right: -140,
          top: 120,
        }}
        initial={{ x: 15, y: 10, scale: 1.0 }}
        animate={{ x: [ 15, -10, 10, 15 ], y: [ 10, 25, -5, 10 ], scale: [1.0, 0.98, 1.02, 1.0 ] }}
        transition={{ duration: duration * 1.2, ease: 'easeInOut', repeat: reduce ? 0 : Infinity, repeatType: 'mirror' }}
      />
      <motion.div
        style={{
          ...common,
          background: 'radial-gradient(closest-side, rgba(96,165,250,0.55), rgba(96,165,250,0) 70%)',
          left: 60,
          bottom: -180,
        }}
        initial={{ x: -5, y: 10, scale: 1.02 }}
        animate={{ x: [ -5, 10, -15, -5 ], y: [ 10, -5, 15, 10 ], scale: [1.02, 1.0, 0.98, 1.02 ] }}
        transition={{ duration: duration * 1.4, ease: 'easeInOut', repeat: reduce ? 0 : Infinity, repeatType: 'mirror' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(1200px 600px at 50% 60%, rgba(0,0,0,0.05), rgba(0,0,0,0.45))' }} />
    </div>
  );
}
