import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { GlassInput } from "../components/ui/GlassInput";
import { Search, ChevronRight } from "lucide-react";
import { GlassStatisticCard } from "../components/ui/GlassStatisticCard";
import { GlassProfileCard } from "../components/ui/GlassProfileCard";
import { motion, AnimatePresence } from "motion/react";
import { staggerContainer } from "../lib/animations";
import { representativesData } from "../data/representatives";
import { rajyaSabhaData } from "../data/rajyaSabhaData";
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
     return [...representativesData, ...rajyaSabhaData, ...dbCandidates];
  }, [dbCandidates]);

  const filteredRepresentatives = useMemo(() => {
    let dataSource = allMergedReps;
    if (house === "lok_sabha") {
        dataSource = dataSource.filter(r => r.type === "Lok Sabha" || (!r.type && r.party && !r.type?.includes("Rajya") && r.type !== "MLA"));
    } else if (house === "rajya_sabha") {
        dataSource = dataSource.filter(r => r.type === "Rajya Sabha");
    } else if (house === "mla") {
        dataSource = dataSource.filter(r => r.type === "MLA");
    }

    if (!searchQuery.trim()) {
      return dataSource.slice(0, 16); 
    }
    
    const query = searchQuery.toLowerCase().trim();
    return dataSource.filter((rep) => 
      (rep.name || "").toLowerCase().includes(query) ||
      (rep.constituency || "").toLowerCase().includes(query) ||
      (rep.party || "").toLowerCase().includes(query) ||
      (rep.state || "").toLowerCase().includes(query) ||
      (rep.type || "").toLowerCase().includes(query)
    );
  }, [searchQuery, house, allMergedReps]);

  const lokSabhaCount = allMergedReps.filter(r => r.type === "Lok Sabha" || (!r.type && r.party && !r.type?.includes("Rajya") && r.type !== "MLA")).length;
  const rajyaSabhaCount = allMergedReps.filter(r => r.type === "Rajya Sabha").length;
  const mlaCount = allMergedReps.filter(r => r.type === "MLA").length;

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
          <GlassStatisticCard label="Lok Sabha MPs" value={lokSabhaCount.toString()} />
          <GlassStatisticCard label="Rajya Sabha MPs" value={rajyaSabhaCount.toString()} />
          <GlassStatisticCard label="Total MLAs" value={mlaCount.toString()} />
          <GlassStatisticCard label="Total Representatives" value={allMergedReps.length.toString()} />
        </div>

        {/* Highlighted Profiles */}
        <div className="mb-8 min-h-[500px]">
           <div className="flex justify-between items-end mb-8 md:mb-12 border-b border-white/10 pb-6">
             <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
               {searchQuery ? `Search Results (${filteredRepresentatives.length})` : "Featured Representatives"}
             </h2>
             {!searchQuery && (
               <button className="text-white/60 hover:text-white uppercase tracking-widest text-xs flex items-center gap-1 transition-colors group">
                 View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
             )}
           </div>
           
           {loading ? (
              <div className="py-20 text-center text-white/50">Loading database data...</div>
           ) : filteredRepresentatives.length > 0 ? (
             <motion.div 
               {...staggerContainer}
               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
             >
               <AnimatePresence>
                 {filteredRepresentatives.map((rep) => (
                   <motion.div
                     key={rep.id || rep.name}
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     transition={{ duration: 0.3 }}
                   >
                     <GlassProfileCard 
                       id={rep.id || rep.name.replace(/\s+/g, '-').toLowerCase()} 
                       name={rep.name} 
                       party={rep.party} 
                       constituency={rep.constituency ? `${rep.constituency}, ${rep.state}` : rep.state}
                       type={rep.type || (!rep.type && !rep.constituency ? 'Rajya Sabha' : 'Lok Sabha')}
                       image={rep.image}
                     />
                   </motion.div>
                 ))}
               </AnimatePresence>
             </motion.div>
           ) : (
             <div className="py-20 text-center flex flex-col items-center justify-center">
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                 <Search className="w-8 h-8 text-white/20" />
               </div>
               <h3 className="text-xl text-white font-serif mb-2">No representatives found</h3>
               <p className="text-white/50">Try adjusting your search criteria</p>
             </div>
           )}
        </div>

      </div>
    </MainLayout>
  );
}
