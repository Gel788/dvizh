"use client";

import { motion, useReducedMotion } from "motion/react";

const ORBS = [
  { size: 420, x: "78%", y: "-8%", color: "rgba(200,255,87,0.14)", duration: 18 },
  { size: 320, x: "-6%", y: "62%", color: "rgba(255,45,85,0.1)", duration: 22 },
  { size: 260, x: "42%", y: "88%", color: "rgba(0,217,255,0.08)", duration: 16 },
  { size: 180, x: "12%", y: "18%", color: "rgba(141,124,255,0.07)", duration: 20 },
] as const;

export function AdminOrbBackground() {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div className="admin-orb-layer pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="admin-orb absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
          }}
          animate={{
            x: [0, i % 2 === 0 ? 28 : -24, 0],
            y: [0, i % 2 === 0 ? -20 : 26, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="admin-grid-drift absolute inset-0 opacity-[0.35]" />
    </div>
  );
}
