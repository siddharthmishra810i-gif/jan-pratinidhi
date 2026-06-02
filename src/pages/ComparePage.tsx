import { useState, useMemo, useRef, useEffect } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { GlassTable, GlassTableHeader, GlassTableRow, GlassTableCell } from "../components/ui/GlassTable";
import { GlassChartContainer } from "../components/ui/GlassChartContainer";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { fadeUp } from "../lib/animations";
import { representativesData, Representative } from "../data/representatives";
import { rajyaSabhaData } from "../data/rajyaSabhaData";
import { getAffidavitData } from "../data/affidavitData";
import { getAttendanceData } from "../data/attendanceData";
import { getQuestionsForMP } from "../data/questionsData";
import { Search, ChevronDown } from "lucide-react";

// Combine both datasets for searching
const allRepresentatives = [...representativesData, ...rajyaSabhaData];

function MPSelector({ selected, onSelect, placeholder }: { selected: Representative | null, onSelect: (r: Representative) => void, placeholder: string }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return allRepresentatives.slice(0, 50);
    const q = query.toLowerCase();
    return allRepresentatives.filter(r => 
      (r.name || "").toLowerCase().includes(q) || 
      (r.constituency || "").toLowerCase().includes(q) || 
      (r.state || "").toLowerCase().includes(q) ||
      (r.party || "").toLowerCase().includes(q) ||
      (r.type || "").toLowerCase().includes(q)
    ).slice(0, 50);
  }, [query]);

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        className="liquid-glass rounded-xl p-4 flex items-center justify-between cursor-pointer border border-white/10 hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          {selected ? (
            <div>
              <div className="text-white font-medium">{selected.name}</div>
              <div className="text-white/40 text-xs">{selected.constituency}, {selected.state}</div>
            </div>
          ) : (
            <div className="text-white/50">{placeholder}</div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 w-full mt-2 liquid-glass rounded-xl border border-white/10 overflow-hidden z-50 shadow-2xl"
          >
            <div className="p-2 border-b border-white/10 flex items-center gap-2">
              <Search className="w-4 h-4 text-white/40 ml-2" />
              <input 
                type="text" 
                autoFocus
                placeholder="Search by name, constituency..." 
                className="bg-transparent w-full text-white placeholder-white/30 text-sm outline-none px-2 py-1"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filtered.map(r => (
                <div 
                  key={r.id} 
                  className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors"
                  onClick={() => {
                    onSelect(r);
                    setIsOpen(false);
                    setQuery("");
                  }}
                >
                  <div className="text-white text-sm">{r.name}</div>
                  <div className="text-white/40 text-xs">{r.party} • {r.constituency}</div>
                </div>
              ))}
              {filtered.length === 0 && <div className="p-4 text-center text-white/40 text-sm">No results found</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const parseAssets = (assetStr: string) => {
  const match = assetStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

export function ComparePage() {
  const [mp1, setMp1] = useState<Representative>(representativesData[0]);
  const [mp2, setMp2] = useState<Representative>(representativesData[1]);

  const data1 = useMemo(() => ({
    rep: mp1,
    affidavit: getAffidavitData(mp1.id, mp1.name),
    attendance: getAttendanceData(mp1.id, mp1.name),
    questions: getQuestionsForMP(mp1.id, mp1.name)
  }), [mp1]);

  const data2 = useMemo(() => ({
    rep: mp2,
    affidavit: getAffidavitData(mp2.id, mp2.name),
    attendance: getAttendanceData(mp2.id, mp2.name),
    questions: getQuestionsForMP(mp2.id, mp2.name)
  }), [mp2]);

  const compareChartData = [
    { 
      name: mp1.name, 
      attendance: data1.attendance.percentage, 
      criminalCases: data1.affidavit.criminalCases, 
      questions: data1.questions.length,
      assets: parseAssets(data1.affidavit.totalAssets)
    },
    { 
      name: mp2.name, 
      attendance: data2.attendance.percentage, 
      criminalCases: data2.affidavit.criminalCases, 
      questions: data2.questions.length,
      assets: parseAssets(data2.affidavit.totalAssets)
    }
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <motion.div {...fadeUp} className="mb-12">
          <h1 className="text-5xl md:text-7xl font-serif tracking-tight text-white mb-6">
            Compare <em className="italic text-white/50">Representatives</em>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-2xl">
            Analyze performance, assets, and track records side-by-side to make informed decisions.
          </p>
        </motion.div>

        <motion.div {...fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 relative z-30">
           <MPSelector selected={mp1} onSelect={setMp1} placeholder="Select first representative" />
           <MPSelector selected={mp2} onSelect={setMp2} placeholder="Select second representative" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 relative z-10">
          <GlassChartContainer title="Legislative Performance (18th Session)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={compareChartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} />
                <Bar yAxisId="left" dataKey="questions" name="Questions Asked" fill="#ffffff" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="right" dataKey="attendance" name="Attendance %" fill="rgba(255,255,255,0.3)" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </GlassChartContainer>

          <GlassChartContainer title="Declared Assets (Crores)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={compareChartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                />
                <Bar dataKey="assets" name="Assets (Cr)" fill="#ffffff" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </GlassChartContainer>
        </div>

        <motion.div {...fadeUp} className="relative z-0">
           <h3 className="text-2xl font-serif text-white tracking-tight mb-6">Detailed Comparison</h3>
           <GlassTable>
              <GlassTableHeader>
                <GlassTableCell isHeader>Metric</GlassTableCell>
                <GlassTableCell isHeader>{mp1.name}</GlassTableCell>
                <GlassTableCell isHeader>{mp2.name}</GlassTableCell>
              </GlassTableHeader>
              <tbody>
                <GlassTableRow>
                  <GlassTableCell className="font-medium text-white/50 uppercase tracking-widest text-xs">Party</GlassTableCell>
                  <GlassTableCell>{mp1.party}</GlassTableCell>
                  <GlassTableCell>{mp2.party}</GlassTableCell>
                </GlassTableRow>
                <GlassTableRow>
                  <GlassTableCell className="font-medium text-white/50 uppercase tracking-widest text-xs">Constituency</GlassTableCell>
                  <GlassTableCell>{mp1.constituency}</GlassTableCell>
                  <GlassTableCell>{mp2.constituency}</GlassTableCell>
                </GlassTableRow>
                <GlassTableRow>
                  <GlassTableCell className="font-medium text-white/50 uppercase tracking-widest text-xs">Education</GlassTableCell>
                  <GlassTableCell>{data1.affidavit.education}</GlassTableCell>
                  <GlassTableCell>{data2.affidavit.education}</GlassTableCell>
                </GlassTableRow>
                <GlassTableRow>
                  <GlassTableCell className="font-medium text-white/50 uppercase tracking-widest text-xs">Criminal Cases</GlassTableCell>
                  <GlassTableCell>{data1.affidavit.criminalCases}</GlassTableCell>
                  <GlassTableCell>{data2.affidavit.criminalCases}</GlassTableCell>
                </GlassTableRow>
                <GlassTableRow>
                  <GlassTableCell className="font-medium text-white/50 uppercase tracking-widest text-xs">Total Days Attended</GlassTableCell>
                  <GlassTableCell>{data1.attendance.daysSigned} / {data1.attendance.totalDays} Days</GlassTableCell>
                  <GlassTableCell>{data2.attendance.daysSigned} / {data2.attendance.totalDays} Days</GlassTableCell>
                </GlassTableRow>
                <GlassTableRow>
                  <GlassTableCell className="font-medium text-white/50 uppercase tracking-widest text-xs">Questions Asked</GlassTableCell>
                  <GlassTableCell>{data1.questions.length}</GlassTableCell>
                  <GlassTableCell>{data2.questions.length}</GlassTableCell>
                </GlassTableRow>
                <GlassTableRow>
                  <GlassTableCell className="font-medium text-white/50 uppercase tracking-widest text-xs">Assets</GlassTableCell>
                  <GlassTableCell>{data1.affidavit.totalAssets}</GlassTableCell>
                  <GlassTableCell>{data2.affidavit.totalAssets}</GlassTableCell>
                </GlassTableRow>
                 <GlassTableRow>
                  <GlassTableCell className="font-medium text-white/50 uppercase tracking-widest text-xs">Liabilities</GlassTableCell>
                  <GlassTableCell>{data1.affidavit.liabilities}</GlassTableCell>
                  <GlassTableCell>{data2.affidavit.liabilities}</GlassTableCell>
                </GlassTableRow>
              </tbody>
           </GlassTable>
        </motion.div>

      </div>
    </MainLayout>
  );
}
