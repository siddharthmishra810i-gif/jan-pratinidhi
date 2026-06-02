import { motion } from "motion/react";

export function AboutSection() {
  return (
    <section className="bg-black pt-32 md:pt-44 pb-10 md:pb-14 px-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-white/40 text-sm tracking-widest uppercase mb-6"
        >
          About Us
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-4xl md:text-6xl lg:text-7xl text-white leading-[1.1] tracking-tight"
        >
          <span className="font-serif italic text-white/60">Pioneering</span> ideas{" "}
          <br className="hidden md:block" />
          for minds that <span className="font-serif italic text-white/60">create, build, and inspire.</span>
        </motion.h2>
      </div>
    </section>
  );
}
