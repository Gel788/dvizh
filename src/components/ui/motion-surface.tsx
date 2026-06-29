"use client";

import { motion } from "motion/react";
import { spring, stagger } from "@/lib/motion-spring";
import { cn } from "@/lib/utils";

export function MotionEnter({
  children,
  index = 0,
  className,
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring.default, delay: index * stagger.fast }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionPress({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={spring.snappy}
      onClick={onClick}
      className={cn("t-card-press", className)}
    >
      {children}
    </motion.div>
  );
}
