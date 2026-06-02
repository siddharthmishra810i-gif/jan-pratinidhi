import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { representativesData } from '../data/representatives';
import { rajyaSabhaData } from '../data/rajyaSabhaData';
import { GlassStatisticCard } from '../components/ui/GlassStatisticCard';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassProfileCard } from '../components/ui/GlassProfileCard';
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp, staggerContainer } from '../lib/animations';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import { GlassChartContainer } from '../components/ui/GlassChartContainer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link } from 'react-router-dom';

const allRepresentatives = [...representativesData, ...rajyaSabhaData];

// Get unique states
const offlineStates = Array.from(new Set(allRepresentatives.map(rep => rep.state))).filter(Boolean).sort();

const PARTY_COLORS: Record<string, string> = {
  "Bharatiya Janata Party": "#ff9933",
  "Indian National Congress": "#19aaed",
  "All India Trinamool Congress": "#215B30",
  "Samajwadi Party": "#FF2400",
  "Dravida Munnetra Kazhagam": "#DD1100",
  "Telugu Desam Party": "#ffe500",
  "Janata Dal (United)": "#003366",
  "Shiv Sena (Uddhav Balasaheb Thackrey)": "#ff6600",
  "Shiv Sena": "#ff6600",
  "Aam Aadmi Party": "#0066A4",
};

export function StateAnalyticsPage() {
  const [selectedState, setSelectedState] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbAnalytics, setDbAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mlcSearchQuery, setMlcSearchQuery] = useState("");
  const [mlcs, setMlcs] = useState<{name: string, party: string, district: string, status: string}[]>([]);
  const [isSearchingMlc, setIsSearchingMlc] = useState(false);

  const handleMlcSearch = () => {
    if (!mlcSearchQuery.trim()) return;
    setIsSearchingMlc(true);
    // Mocking an on-demand MLC fetch based on district name
    setTimeout(() => {
      setMlcs([
        { name: "Srinivas Rao", party: "Independent", district: mlcSearchQuery, status: "MLC" },
        { name: "Anita Reddy", party: "INC", district: mlcSearchQuery, status: "MLC" }
      ]);
      setIsSearchingMlc(false);
    }, 600);
  };

  useEffect(() => {
    fetch('/api/states/analytics')
      .then(res => res.json())
      .then(data => {
         setDbAnalytics(data);
         setLoading(false);
      })
      .catch(err => {
         console.warn("Could not fetch MLAnalytics from DB", err);
         setLoading(false);
      });
  }, []);

  const dbStates = dbAnalytics && dbAnalytics.data ? dbAnalytics.data.map((s: any) => s.name).sort() : [];
  const mergedStatesMap = new Set([...offlineStates, ...dbStates]);
  const states = Array.from(mergedStatesMap).sort();

  const stateInfoFromDb = useMemo(() => {
      if (!dbAnalytics || !dbAnalytics.data) return null;
      return dbAnalytics.data.find((s: any) => s.name === selectedState) || null;
  }, [dbAnalytics, selectedState]);

  const stateRepresentatives = useMemo(() => {
    if (!selectedState) return [];
    
    let dbReps: any[] = [];
    if (stateInfoFromDb && stateInfoFromDb.candidates) {
        dbReps = stateInfoFromDb.candidates.filter((c: any) => c.winner).map((c: any) => ({
            ...c, 
            state: selectedState,
            isDbRecord: true
        }));
    }

    const offlineReps = allRepresentatives.filter(rep => rep.state === selectedState && rep.type !== 'MLA');
    
    return [...dbReps, ...offlineReps];
  }, [selectedState, stateInfoFromDb]);

  const { mpRepresentatives, mlaRepresentatives } = useMemo(() => {
    const mps = stateRepresentatives.filter(r => r.type !== 'MLA');
    const mlas = stateRepresentatives.filter(r => r.type === 'MLA');
    return { mpRepresentatives: mps, mlaRepresentatives: mlas };
  }, [stateRepresentatives]);

  const mpPartyStats = useMemo(() => {
    const counts: Record<string, number> = {};
    mpRepresentatives.forEach(rep => {
      counts[rep.party] = (counts[rep.party] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([party, count]) => ({ party, count }))
      .sort((a, b) => b.count - a.count);
  }, [mpRepresentatives]);

  const mlaPartyStats = useMemo(() => {
    const counts: Record<string, number> = {};
    mlaRepresentatives.forEach(rep => {
      counts[rep.party] = (counts[rep.party] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([party, count]) => ({ party, count }))
      .sort((a, b) => b.count - a.count);
  }, [mlaRepresentatives]);

  const filteredReps = useMemo(() => {
    if (!searchQuery.trim()) return stateRepresentatives;
    const q = searchQuery.toLowerCase();
    return stateRepresentatives.filter(rep => 
      (rep.name || "").toLowerCase().includes(q) ||
      (rep.party || "").toLowerCase().includes(q) ||
      (rep.constituency || "").toLowerCase().includes(q) ||
      (rep.type || "").toLowerCase().includes(q)
    );
  }, [stateRepresentatives, searchQuery]);

  const lokSabhaCount = mpRepresentatives.filter(r => r.type === "Lok Sabha" || (!r.type && r.party)).length;
  const rajyaSabhaCount = mpRepresentatives.filter(r => r.type === "Rajya Sabha").length;
  const mlaCount = mlaRepresentatives.length;
  const totalSeats = lokSabhaCount + rajyaSabhaCount + mlaCount;


  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-serif text-white tracking-tight mb-6">
            State Insights
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Select a state to explore party dominance, seat distribution, and learn about the elected representatives from that region.
          </motion.p>
        </motion.div>

        {/* State Selector */}
        <div className="relative max-w-xl mx-auto mb-16 z-20">
          <div 
            className="liquid-glass rounded-xl p-5 flex items-center justify-between cursor-pointer border border-white/10 hover:bg-white/[0.02] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-3">
              <MapPin className="text-white/50 w-5 h-5" />
              <span className={selectedState ? "text-white text-lg" : "text-white/50 text-lg"}>
                {selectedState || "Select a State or Union Territory"}
              </span>
            </div>
            <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 p-2 liquid-glass rounded-xl border border-white/10 max-h-[400px] overflow-y-auto"
              >
                {states.map(state => (
                  <div
                    key={state}
                    className="p-3 hover:bg-white/5 rounded-lg cursor-pointer text-white/80 hover:text-white transition-colors"
                    onClick={() => {
                      setSelectedState(state);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    {state}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {selectedState && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <GlassStatisticCard label="Total Representatives" value={totalSeats.toString()} />
              <GlassStatisticCard label="Lok Sabha MPs" value={lokSabhaCount.toString()} />
              <GlassStatisticCard label="Rajya Sabha MPs" value={rajyaSabhaCount.toString()} />
              <GlassStatisticCard label="Legislative Assembly (MLAs)" value={mlaCount.toString()} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              <div className="space-y-4">
                <h3 className="text-xl font-serif text-white px-2">MP Seats (Lok Sabha & Rajya Sabha)</h3>
                <GlassChartContainer title="">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mpPartyStats} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="party" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val.split(' ').map((w: string) => w[0]).join('')} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" name="Seats Won" radius={[4, 4, 0, 0]}>
                        {mpPartyStats.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={PARTY_COLORS[entry.party] || "#ffffff"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </GlassChartContainer>
              </div>

              <div className="space-y-4">
                 <h3 className="text-xl font-serif text-white px-2">MLA Seats (Legislative Assembly)</h3>
                 {mlaPartyStats.length > 0 ? (
                    <GlassChartContainer title="">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={mlaPartyStats} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="party" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val.split(' ').map((w: string) => w[0]).join('')} />
                          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="count" name="Seats Won" radius={[4, 4, 0, 0]}>
                            {mlaPartyStats.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={PARTY_COLORS[entry.party] || "#ffffff"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </GlassChartContainer>
                 ) : (
                   <div className="liquid-glass rounded-3xl p-8 flex items-center justify-center h-[348px]">
                     <span className="text-white/40">No MLA Data Available for this State</span>
                   </div>
                 )}
              </div>
            </div>

            <div className="mb-16">
              <h2 className="text-2xl font-serif text-white tracking-tight mb-6">Legislative Council (MLC) Districts</h2>
              <div className="liquid-glass p-8 rounded-3xl md:flex flex-col gap-6 border border-white/5">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div>
                      <h3 className="text-lg text-white mb-2">Search MLCs by District</h3>
                      <p className="text-white/50 text-sm max-w-md">Currently, MLC details are loaded on-demand. Please enter a district name to explore potential Member of Legislative Council info.</p>
                   </div>
                   <div className="flex gap-4 w-full md:w-auto">
                      <input 
                         type="text" 
                         value={mlcSearchQuery}
                         onChange={(e) => setMlcSearchQuery(e.target.value)}
                         placeholder="District Name (e.g. Hyderabad)" 
                         className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 transition-colors w-full md:w-64"
                      />
                      <button onClick={handleMlcSearch} className="bg-white text-black px-6 py-3 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors shrink-0">
                         {isSearchingMlc ? 'Searching...' : 'Search'}
                      </button>
                   </div>
                 </div>

                 {mlcs.length > 0 && !isSearchingMlc && (
                    <div className="mt-4 border-t border-white/10 pt-6">
                      <h4 className="text-white mb-4 font-serif">Results for {mlcs[0].district}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {mlcs.map((mlc, idx) => (
                           <div key={idx} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5">
                             <div>
                               <div className="text-white font-medium">{mlc.name}</div>
                               <div className="text-white/50 text-sm">{mlc.party}</div>
                             </div>
                             <div className="text-white/30 text-xs uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full">
                               {mlc.status}
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                 )}
              </div>
            </div>

            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <h2 className="text-3xl font-serif text-white tracking-tight">Elected Representatives</h2>
               <div className="flex flex-col md:flex-row items-center gap-4">
                 <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                       type="text" 
                       placeholder="Search MPs or MLAs..." 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 transition-colors w-full md:w-64"
                    />
                 </div>
                 <Link to="/compare" className="text-sm text-white/60 hover:text-white transition-colors shrink-0 liquid-glass px-4 py-2 rounded-full hidden md:inline-flex">
                   Compare Reps
                 </Link>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredReps.map(rep => (
                <GlassProfileCard 
                  key={rep.id} 
                  id={rep.id || ''}
                  name={rep.name}
                  party={rep.party}
                  constituency={rep.constituency}
                  image={rep.image}
                  type={rep.type}
                />
              ))}
              {filteredReps.length === 0 && (
                <div className="col-span-full py-12 text-center text-white/40">
                  No representatives found matching your search.
                </div>
              )}
            </div>

          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
