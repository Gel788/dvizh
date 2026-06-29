/** Shared spring tokens — motion.dev / MOTION.md */
export const spring = {
  snappy: { type: "spring" as const, stiffness: 520, damping: 34 },
  default: { type: "spring" as const, stiffness: 360, damping: 30 },
  gentle: { type: "spring" as const, stiffness: 220, damping: 26 },
  bouncy: { type: "spring" as const, stiffness: 420, damping: 18 },
};

export const stagger = {
  fast: 0.04,
  normal: 0.06,
  slow: 0.08,
};
