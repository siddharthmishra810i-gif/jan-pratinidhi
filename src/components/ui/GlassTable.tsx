import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { fadeUp } from '../../lib/animations';

interface Pillar {
  header: string;
  accessor: string;
}

interface GlassTableProps {
  columns?: Pillar[];
  data?: any[];
  children?: ReactNode;
}

export function GlassTable({ columns, data, children }: GlassTableProps) {
  if (children) {
     return (
       <div className="overflow-x-auto w-full border border-white/10 rounded-2xl liquid-glass">
         <table className="w-full text-left border-collapse">
            {children}
         </table>
       </div>
     );
  }

  return (
    <div className="overflow-x-auto w-full border border-white/10 rounded-2xl liquid-glass">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-white/50 text-sm tracking-wider uppercase bg-white/[0.02]">
            {columns?.map((col, idx) => (
              <th key={col.accessor + idx} className="py-4 px-6 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          {data?.map((row, rowIdx) => (
            <motion.tr 
              key={rowIdx} 
              variants={fadeUp}
              className="border-b border-white/5 hover:bg-white/[0.04] transition-colors"
            >
              {columns?.map((col, colIdx) => (
                <td key={colIdx} className="py-5 px-6 text-white text-base">
                  {row[col.accessor]}
                </td>
              ))}
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}

export function GlassTableHeader({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-white/10 bg-white/[0.02]">
        {children}
      </tr>
    </thead>
  );
}

export function GlassTableRow({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <tr className={`border-b border-white/5 hover:bg-white/[0.04] transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function GlassTableCell({ children, isHeader = false, className = "" }: { children: ReactNode, isHeader?: boolean, className?: string }) {
  if (isHeader) {
    return <th className={`py-4 px-6 font-medium text-white/50 text-sm tracking-wider uppercase ${className}`}>{children}</th>;
  }
  return <td className={`py-5 px-6 text-white text-base ${className}`}>{children}</td>;
}

