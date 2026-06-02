import { ReactNode } from "react";
import { Navbar } from "./Navbar";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-white/30 flex flex-col">
      <Navbar className="sticky top-0 backdrop-blur-sm" />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
