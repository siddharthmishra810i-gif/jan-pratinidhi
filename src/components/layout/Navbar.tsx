import { Globe } from "lucide-react";
import { Link } from "react-router-dom";

export function Navbar({ className = "" }: { className?: string }) {
  return (
    <nav className={`w-full z-50 transition-all duration-300 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-6 w-full">
        <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Globe className="w-6 h-6 text-white mr-2 shrink-0" />
              <span className="text-white font-semibold text-lg tracking-tight truncate hidden sm:block">Jan-Pratinidhi</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 ml-8">
              <Link to="/explore" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Portal</Link>
              <Link to="/states" className="text-white/80 hover:text-white text-sm font-medium transition-colors">States</Link>
              <Link to="/compare" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Compare</Link>
              <Link to="/map" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Map</Link>
              <Link to="/analytics" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Analytics</Link>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/states" className="md:hidden text-white/80 hover:text-white text-sm font-medium transition-colors">States</Link>
            <Link to="/map" className="md:hidden text-white/80 hover:text-white text-sm font-medium transition-colors">Map</Link>
            <Link to="/login" className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/5 transition-colors">Login</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
