import { motion } from "motion/react";
import { fadeUp } from "../../lib/animations";

export function GlassStatisticCard({ label, value, trend, icon }: { label: string; value: string | React.ReactNode; trend?: string; icon?: React.ReactNode }) {
  return (
    <motion.div {...fadeUp} className="liquid-glass rounded-3xl p-6 flex flex-col cursor-default hover:bg-white/[0.02] transition-colors">
       <div className="flex justify-between items-start mb-4">
          <div className="text-white/50 text-xs sm:text-sm uppercase tracking-widest leading-relaxed">{label}</div>
          {icon && <div className="text-white/40">{icon}</div>}
       </div>
       <div className="text-4xl md:text-5xl font-serif text-white tracking-tight mt-auto">{value}</div>
       {trend && <div className="text-white/60 text-sm mt-2">{trend}</div>}
    </motion.div>
  );
}
