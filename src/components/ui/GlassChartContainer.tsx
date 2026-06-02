import { ReactNode } from "react";
import { motion } from "motion/react";

export function GlassChartContainer({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="liquid-glass rounded-3xl p-6 md:p-8 flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl md:text-2xl font-serif text-white tracking-tight">{title}</h3>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1 w-full h-full min-h-[300px]">
        {children}
      </div>
    </motion.div>
  );
}
