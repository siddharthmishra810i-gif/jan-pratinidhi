import React from "react";

export function GlassTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="liquid-glass rounded-3xl overflow-hidden w-full overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[600px]">
        {children}
      </table>
    </div>
  );
}

export function GlassTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-white/5 border-b border-white/10 uppercase tracking-widest text-[10px] sm:text-xs text-white/50">
      <tr>{children}</tr>
    </thead>
  );
}

export function GlassTableCell({ children, className = "", isHeader = false }: { children: React.ReactNode; className?: string; isHeader?: boolean }) {
  const Component = isHeader ? "th" : "td";
  return (
    <Component className={`p-4 md:p-6 align-middle ${isHeader ? 'font-medium' : 'text-white/80'} ${className}`}>
      {children}
    </Component>
  );
}

export function GlassTableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`border-b border-white/5 last:border-none hover:bg-white/[0.02] transition-colors ${className}`}>
      {children}
    </tr>
  );
}
