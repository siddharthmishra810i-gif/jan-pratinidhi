import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { GlassInput } from "../components/ui/GlassInput";
import { Search, ChevronRight } from "lucide-react";
import { GlassStatisticCard } from "../components/ui/GlassStatisticCard";
import { RepresentativeFeed } from "../components/ui/RepresentativeFeed";
import { motion, AnimatePresence } from "motion/react";
import { staggerContainer } from "../lib/animations";
import { representativesData } from "../data/representatives";
import { rajyaSabhaData } from "../data/rajyaSabhaData";
import Fuse from "fuse.js";
import axios from 'axios';

export function ExplorePage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [house, setHouse] = useState<"lok_sabha" | "rajya_sabha" | "mla" | "both">("both");
  const [dbCandidates, setDbCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     axios.get('/api/states/analytics')
        .then(res => {
           let allMlas: any[] = [];
           if (res.data && res.data.data) {
              res.data.data.forEach((stateInfo: any) => {
                 if (stateInfo.candidates) {
                    allMlas = [...allMlas, ...stateInfo.candidates.filter((c: any) => c.winner).map((c: any) => ({
                       ...c,
                       state: stateInfo.name
                    }))];
                 }
              });
           }
           setDbCandidates(allMlas);
           setLoading(false);
        })
        .catch(err => {
           console.error("ExplorePage DB Fetch Error:", err);
           setLoading(false);
        });
  }, []);

  const allMergedReps = useMemo(() => {
     const dbMlas = dbCandidates.filter(c => c.type === 'MLA');
     
     // Merge offline reps and just the MLAs from the database
     const combined = [...representativesData, ...rajyaSabhaData, ...dbMlas];
     const unique = new Map();
     combined.forEach(rep => {
         let type = rep.type;
         if (type === 'MP' || type === 'Lok Sabha') type = 'Lok Sabha';
         else if (!type && rep.constituency) type = 'Lok Sabha';
         else if (!type) type = 'Rajya Sabha';

         // Fix missing names from crashing toLowerCase
         if (!rep.name) return;

         const finalRep = { ...rep, type };
         const uniqueKey = finalRep.id || `${finalRep.name.toLowerCase().trim()}-${finalRep.state}-${finalRep.party}`;
         unique.set(uniqueKey, finalRep);
     });
     return Array.from(unique.values());
  }, [dbCandidates]);

  const fuse = useMemo(() => {
    return new Fuse(allMergedReps, {
      keys: ['name', 'state', 'constituency', 'party'],
      threshold: 0.3,
      distance: 100,
    });
  }, [allMergedReps]);

  const filteredRepresentatives = useMemo(() => {
    let dataSource = allMergedReps;

    if (searchQuery.trim()) {
      dataSource = fuse.search(searchQuery).map(result => result.item);
    }

    if (house === "lok_sabha") {
        dataSource = dataSource.filter(r => r.type === "Lok Sabha");
    } else if (house === "rajya_sabha") {
        dataSource = dataSource.filter(r => r.type === "Rajya Sabha");
    } else if (house === "mla") {
        dataSource = dataSource.filter(r => r.type === "MLA");
    }

    return dataSource;
  }, [searchQuery, house, allMergedReps, fuse]);

  const lokSabhaCount = Math.max(allMergedReps.filter(r => r.type === "Lok Sabha").length, 543);
  const rajyaSabhaCount = Math.max(allMergedReps.filter(r => r.type === "Rajya Sabha").length, 245);
  const mlaCount = Math.max(allMergedReps.filter(r => r.type === "MLA").length, 4123);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-32">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-tight text-white mb-6"
          >
            Explore the <em className="italic text-white/50 border-b border-white/20 pb-2">Assembly</em>.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-white/60 text-lg leading-relaxed max-w-2xl"
          >
            Search comprehensive public data on Members of Parliament and MLAs. Type a name, constituency, or party.
          </motion.p>
        </div>

        {/* House Toggle */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <button 
            onClick={() => { setHouse("both"); setSearchQuery(""); }}
            className={`px-6 py-3 rounded-full text-sm tracking-widest uppercase transition-all whitespace-nowrap ${house === "both" ? "bg-white text-black font-medium" : "liquid-glass text-white/60 hover:text-white"}`}
          >
            All Reps
          </button>
          <button 
            onClick={() => { setHouse("lok_sabha"); setSearchQuery(""); }}
            className={`px-6 py-3 rounded-full text-sm tracking-widest uppercase transition-all whitespace-nowrap ${house === "lok_sabha" ? "bg-white text-black font-medium" : "liquid-glass text-white/60 hover:text-white"}`}
          >
            Lok Sabha
          </button>
          <button 
            onClick={() => { setHouse("rajya_sabha"); setSearchQuery(""); }}
            className={`px-6 py-3 rounded-full text-sm tracking-widest uppercase transition-all whitespace-nowrap ${house === "rajya_sabha" ? "bg-white text-black font-medium" : "liquid-glass text-white/60 hover:text-white"}`}
          >
            Rajya Sabha
          </button>
          <button 
            onClick={() => { setHouse("mla"); setSearchQuery(""); }}
            className={`px-6 py-3 rounded-full text-sm tracking-widest uppercase transition-all whitespace-nowrap ${house === "mla" ? "bg-white text-black font-medium" : "liquid-glass text-white/60 hover:text-white"}`}
          >
            Legislative Assembly
          </button>
        </div>

        {/* Search */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16 md:mb-24"
        >
          <GlassInput 
            icon={<Search className="w-5 h-5" />} 
            placeholder={`Search representatives, constituencies, or parties...`} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-2xl text-lg py-4 md:py-5"
          />
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 md:mb-32">
          <GlassStatisticCard label="Lok Sabha MPs" value={lokSabhaCount.toLocaleString()} />
          <GlassStatisticCard label="Rajya Sabha MPs" value={rajyaSabhaCount.toLocaleString()} />
          <GlassStatisticCard label="Total MLAs" value={mlaCount.toLocaleString()} />
          <GlassStatisticCard label="Total Representatives" value={(lokSabhaCount + rajyaSabhaCount + mlaCount).toLocaleString()} />
        </div>

        {/* Highlighted Profiles */}
        <div className="mb-8 min-h-[500px]">
           <div className="flex justify-between items-end mb-8 md:mb-12 border-b border-white/10 pb-6">
             <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
               {searchQuery ? `Search Results (${filteredRepresentatives.length})` : "Representatives"}
             </h2>
           </div>
           
           {loading ? (
              <div className="py-20 text-center text-white/50">Loading database data...</div>
           ) : (
             <RepresentativeFeed representatives={filteredRepresentatives} />
           )}
        </div>
      </div>
    </MainLayout>
  );
}

