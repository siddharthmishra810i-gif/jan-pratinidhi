import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GlassProfileCard } from './GlassProfileCard';
import { motion } from 'motion/react';
import { fadeUp } from '../../lib/animations';

interface RepresentativeFeedProps {
  representatives: any[];
}

export function RepresentativeFeed({ representatives }: RepresentativeFeedProps) {
  const [visibleCount, setVisibleCount] = useState(24);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(24); // Reset when the list changes
  }, [representatives]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + 24, representatives.length));
  }, [representatives.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < representatives.length) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, visibleCount, representatives.length, loadMore]);

  const visibleReps = representatives.slice(0, visibleCount);

  if (representatives.length === 0) {
    return (
      <div className="liquid-glass rounded-3xl p-16 text-center border border-white/5">
        <h3 className="text-2xl font-serif text-white mb-2">No representatives found</h3>
        <p className="text-white/60">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {visibleReps.map((rep, idx) => (
          <motion.div
            key={`rep-${rep.name}-${idx}`}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: (idx % 12) * 0.05 }}
          >
            <GlassProfileCard
              name={rep.name}
              party={rep.party}
              constituency={rep.constituency ? `${rep.constituency}, ${rep.state}` : rep.state}
              image={rep.image}
              type={rep.type}
              id={rep.id || rep.name.replace(/\s+/g, '-').toLowerCase()}
            />
          </motion.div>
        ))}
      </div>
      {visibleCount < representatives.length && (
        <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
        </div>
      )}
    </>
  );
}
