import { motion } from "motion/react";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  animate?: boolean;
}

export function GlassCard({ children, className = "", animate = false, ...props }: GlassCardProps) {
  const baseClasses = `liquid-glass rounded-3xl p-6 md:p-8 ${className}`;
  
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className={baseClasses}
        {...props as any}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  );
}
