import { motion, HTMLMotionProps } from "motion/react";
import React from "react";

interface GlassButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function GlassButton({ children, icon, className = "", ...props }: GlassButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`liquid-glass rounded-full px-6 py-3 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-colors ${className}`}
      {...props}
    >
      {children}
      {icon && <span className="shrink-0">{icon}</span>}
    </motion.button>
  );
}
