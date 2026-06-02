import React, { InputHTMLAttributes } from "react";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function GlassInput({ icon, className = "", ...props }: GlassInputProps) {
  return (
    <div className={`liquid-glass rounded-full px-6 py-3 flex items-center gap-3 w-full ${className}`}>
      {icon && <div className="text-white/40">{icon}</div>}
      <input
        className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-white/40 w-full"
        {...props}
      />
    </div>
  );
}
