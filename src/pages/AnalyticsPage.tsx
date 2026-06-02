import { useState, useMemo } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { GlassChartContainer } from "../components/ui/GlassChartContainer";
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, BarChart, Bar } from "recharts";
import { motion } from "motion/react";
import { fadeUp } from "../lib/animations";
import { representativesData } from "../data/representatives";
import { rajyaSabhaData } from "../data/rajyaSabhaData";

const FUND_UTILIZATION_DATA = [
  { year: '2020', allotted: 5, utilized: 3.2 },
  { year: '2021', allotted: 5, utilized: 4.1 },
  { year: '2022', allotted: 5, utilized: 4.8 },
  { year: '2023', allotted: 5, utilized: 4.5 },
  { year: '2024', allotted: 5, utilized: 2.1 }, // Ongoing
];

const GENDER_RATIO_DATA = [
  { name: 'Male', value: 78, color: '#ffffff' },
  { name: 'Female', value: 22, color: 'rgba(255,255,255,0.3)' },
];

const ATTENDANCE_DISTRIBUTION = [
  { range: '0-50%', count: 12 },
  { range: '51-70%', count: 45 },
  { range: '71-85%', count: 180 },
  { range: '86-100%', count: 306 },
];

export function AnalyticsPage() {
  const [house, setHouse] = useState<"lok_sabha" | "rajya_sabha" | "both">("both");

  const partyStats = useMemo(() => {
    let sourceData = representativesData;
    if (house === "both") {
        sourceData = [...representativesData, ...rajyaSabhaData];
    } else if (house === "rajya_sabha") {
        sourceData = rajyaSabhaData;
    }

    const counts: Record<string, number> = {};
    sourceData.forEach((rep) => {
      if (rep.party) {
        counts[rep.party] = (counts[rep.party] || 0) + 1;
      }
    });

    const total = sourceData.filter(rep => rep.party).length;

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(2) : "0.00",
      }))
      .sort((a, b) => b.count - a.count);
  }, [house]);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <motion.div {...fadeUp} className="mb-16">
          <h1 className="text-5xl md:text-7xl font-serif tracking-tight text-white mb-6">
            National <em className="italic text-white/50">Analytics</em>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-2xl">
            Macro-level insights into political demographics, fund utilization, and legislative performance across the country.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <GlassChartContainer title="MPLADS Fund Utilization (Average Cr)">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={FUND_UTILIZATION_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUtilized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                />
                <Area type="monotone" dataKey="allotted" stroke="rgba(255,255,255,0.2)" fill="none" strokeWidth={2} />
                <Area type="monotone" dataKey="utilized" stroke="#ffffff" fillOpacity={1} fill="url(#colorUtilized)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </GlassChartContainer>

          <GlassChartContainer title="Lok Sabha Gender Representation">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={GENDER_RATIO_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {GENDER_RATIO_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                />
              </PieChart>
            </ResponsiveContainer>
             <div className="flex justify-center gap-6 mt-4">
                {GENDER_RATIO_DATA.map(item => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-white/60 text-sm tracking-widest uppercase">{item.name} ({item.value}%)</span>
                  </div>
                ))}
             </div>
          </GlassChartContainer>
        </div>

        <div className="grid grid-cols-1 gap-8">
           <GlassChartContainer title="Attendance Distribution (Lok Sabha)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ATTENDANCE_DISTRIBUTION} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                />
                <Bar dataKey="count" fill="#ffffff" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </GlassChartContainer>
        </div>

        <motion.div {...fadeUp} className="mt-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="text-3xl font-serif text-white tracking-tight">Party Statistics</h2>
            <div className="flex gap-2 p-1 bg-white/5 rounded-full backdrop-blur-sm self-start">
              <button 
                onClick={() => setHouse("both")}
                className={`px-4 py-2 rounded-full text-xs tracking-widest uppercase transition-all whitespace-nowrap ${house === "both" ? "bg-white text-black font-medium" : "text-white/60 hover:text-white"}`}
              >
                All MPs
              </button>
              <button 
                onClick={() => setHouse("lok_sabha")}
                className={`px-4 py-2 rounded-full text-xs tracking-widest uppercase transition-all whitespace-nowrap ${house === "lok_sabha" ? "bg-white text-black font-medium" : "text-white/60 hover:text-white"}`}
              >
                Lok Sabha
              </button>
              <button 
                onClick={() => setHouse("rajya_sabha")}
                className={`px-4 py-2 rounded-full text-xs tracking-widest uppercase transition-all whitespace-nowrap ${house === "rajya_sabha" ? "bg-white text-black font-medium" : "text-white/60 hover:text-white"}`}
              >
                Rajya Sabha
              </button>
            </div>
          </div>
          <div className="liquid-glass rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 uppercase tracking-widest text-xs text-white/50">
                    <th className="px-6 py-4 font-normal">S.No</th>
                    <th className="px-6 py-4 font-normal">Party Name</th>
                    <th className="px-6 py-4 font-normal text-right">No. of Members</th>
                    <th className="px-6 py-4 font-normal text-right">Percentage (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {partyStats.map((stat, i) => (
                    <tr key={stat.name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-white/50 w-16">{i + 1}</td>
                      <td className="px-6 py-4 text-white/90">{stat.name}</td>
                      <td className="px-6 py-4 text-white/70 text-right">{stat.count}</td>
                      <td className="px-6 py-4 text-white/70 text-right">{stat.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

      </div>
    </MainLayout>
  );
}
