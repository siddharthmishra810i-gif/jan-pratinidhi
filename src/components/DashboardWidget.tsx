import React from 'react';
import { GlassChartContainer } from './ui/GlassChartContainer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardWidgetProps {
  partyDominance: { party: string; lokSabha: number; rajyaSabha: number; assembly: number; total: number }[];
}

export function DashboardWidget({ partyDominance }: DashboardWidgetProps) {
  return (
    <div className="mb-16">
      <div className="space-y-4">
        <h3 className="text-xl font-serif text-white px-2">Party Dominance (Lok Sabha, Rajya Sabha & Assembly)</h3>
        <GlassChartContainer title="">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={partyDominance} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="party" 
                stroke="rgba(255,255,255,0.4)" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val: string) => val.split(' ').map(w => w[0]).join('')} 
              />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="lokSabha" stackId="a" name="Lok Sabha" fill="#ff9933" radius={[0, 0, 0, 0]} />
              <Bar dataKey="rajyaSabha" stackId="a" name="Rajya Sabha" fill="#19aaed" radius={[0, 0, 0, 0]} />
              <Bar dataKey="assembly" stackId="a" name="Assembly" fill="#215B30" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassChartContainer>
      </div>
    </div>
  );
}
