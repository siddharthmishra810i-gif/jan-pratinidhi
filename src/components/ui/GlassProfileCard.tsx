import { motion } from "motion/react";
import { fadeUp } from "../../lib/animations";
import { Link } from "react-router-dom";

interface GlassProfileCardProps {
  id: string;
  name: string;
  party: string;
  constituency: string;
  image?: string;
  type: string;
  attendance?: number | null;
  questionsAsked?: number | null;
}

export function GlassProfileCard({ id, name, party, constituency, image, type, attendance, questionsAsked }: GlassProfileCardProps) {
  const safeName = name || "Unknown";

  return (
    <Link to={`/representative/${id}`}>
      <motion.div 
        {...fadeUp}
        whileHover={{ scale: 1.02, y: -4 }}
        className="liquid-glass rounded-3xl overflow-hidden cursor-pointer group flex flex-col h-full bg-transparent hover:bg-white/[0.02] transition-all"
      >
        <div className="aspect-[4/5] bg-white/5 relative overflow-hidden shrink-0">
          {image ? (
            <img src={image} alt={safeName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-white/20 font-serif text-6xl">
               {safeName.charAt(0)}
             </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          <div className="absolute top-4 right-4 liquid-glass px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            {type}
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-2xl font-serif text-white mb-2">{safeName}</h3>
          <p className="text-white/60 text-sm mb-4 flex-1">{party}</p>
          <div className="flex flex-col gap-2 border-t border-white/10 pt-4 mt-auto">
            <div className="text-white/40 text-[10px] sm:text-xs tracking-widest uppercase line-clamp-1">
              {constituency}
            </div>
            
            {(attendance != null || questionsAsked != null) && (
              <div className="flex items-center gap-4 text-xs font-mono text-white/50">
                 {attendance != null && (
                   <span title="Attendance">Att: {attendance}%</span>
                 )}
                 {questionsAsked != null && (
                   <span title="Questions Asked">Q's: {questionsAsked}</span>
                 )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
