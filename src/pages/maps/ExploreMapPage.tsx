import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Layers, Shield, Activity, Users, ChevronRight, 
  MapPin, X, BarChart3, TrendingUp, Filter, CheckCircle2, 
  Clock, Play, Sparkles, Building2, Briefcase, IndianRupee, Globe2, Crosshair
} from 'lucide-react';
import clsx from 'clsx';
import { representativesData } from '../../data/representatives';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// -------------------------------------------------------------------------------- //
// STYLES & CONTROLLERS
// -------------------------------------------------------------------------------- //

function MapStyleController() {
  return (
    <style>
      {`
        .leaflet-container {
          background: #000 !important;
          font-family: 'Instrument Serif', serif;
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.5) !important;
          color: rgba(255,255,255,0.4) !important;
        }
        .constituency-path {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .constituency-hover {
          filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.8)) !important;
          stroke: #ffffff !important;
          stroke-width: 3px !important;
          z-index: 1000 !important;
        }
        .glass-panel {
          background: rgba(10, 10, 10, 0.7);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .glass-panel-light {
          background: rgba(25, 25, 25, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .text-gradient {
          background: linear-gradient(135deg, #fff 0%, #888 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.4);
        }
      `}
    </style>
  );
}

// -------------------------------------------------------------------------------- //
// DATA & MOCKS
// -------------------------------------------------------------------------------- //

const PARTY_COLORS: Record<string, string> = {
  'BJP': '#ff9933',
  'BHARATIYA JANATA PARTY': '#ff9933',
  'INC': '#19aaed',
  'INDIAN NATIONAL CONGRESS': '#19aaed',
  'AAP': '#6f42c1',
  'AAM AADMI PARTY': '#6f42c1',
  'TMC': '#20C646',
  'ALL INDIA TRINAMOOL CONGRESS': '#20C646',
  'DMK': '#dd2d23',
  'DRAVIDA MUNNETRA KAZHAGAM': '#dd2d23',
  'YSRCP': '#1569C7',
  'YUVAAJANA SRAMIKA RYTHU CONGRESS PARTY': '#1569C7',
  'TDP': '#FCE700',
  'TELUGU DESAM PARTY': '#FCE700',
  'SP': '#FF2222',
  'SAMAJWADI PARTY': '#FF2222',
  'BSP': '#22409A',
  'BAHUJAN SAMAJ PARTY': '#22409A',
  'SHIV SENA': '#ff6600',
  'SHIV SENA (UDDHAV BALASAHEB THACKREY)': '#ff6600',
  'BJD': '#006400',
  'BIJU JANATA DAL': '#006400',
  'JDU': '#003366',
  'JANATA DAL (UNITED)': '#003366',
  'CPI(M)': '#cc0000',
  'COMMUNIST PARTY OF INDIA (MARXIST)': '#cc0000',
  'DEFAULT': '#444444'
};

const getPartyColor = (party: string) => {
  for (const key in PARTY_COLORS) {
    if (party.toUpperCase().includes(key)) return PARTY_COLORS[key];
  }
  return PARTY_COLORS.DEFAULT;
};

// Map Center: Central India
const INDIA_CENTER: [number, number] = [22.5, 79.0];

type MapLevel = 'india' | 'district' | 'lok_sabha' | 'assembly' | 'projects';

// -------------------------------------------------------------------------------- //
// MAIN COMPONENT
// -------------------------------------------------------------------------------- //

export function ExploreMapPage() {
  const mapRef = useRef<L.Map | null>(null);
  
  // App State
  const [mapLevel, setMapLevel] = useState<MapLevel>('lok_sabha');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  
  // Data State
  const [geoData, setGeoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Interaction State
  const [hoveredFeature, setHoveredFeature] = useState<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // -------------------------------------------------------------------------------- //
  // MAP DATA FETCHING (Dynamic GeoJSON + DB Analytics Cache)
  // -------------------------------------------------------------------------------- //
  
  useEffect(() => {
    async function loadBoundaries() {
      setIsLoading(true);
      setErrorMsg("");
      setGeoData(null);
      
      try {
        const res = await fetch(`/api/boundaries?level=${mapLevel}`);
        if (!res.ok) throw new Error("Failed to fetch map data");
        const data = await res.json();
        setGeoData(data);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load boundaries");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadBoundaries();
  }, [mapLevel, selectedYear]);

  // -------------------------------------------------------------------------------- //
  // LEAFLET EVENT HANDLERS
  // -------------------------------------------------------------------------------- //

  // Track mouse for custom tooltip (60 FPS Performance)
  useEffect(() => {
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
        mousePosRef.current = { x: e.clientX, y: e.clientY };
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(updateTooltipPosition);
        }
    };
    
    const updateTooltipPosition = () => {
        if (tooltipRef.current) {
            tooltipRef.current.style.transform = `translate3d(${mousePosRef.current.x + 20}px, ${mousePosRef.current.y + 20}px, 0)`;
        }
        animationFrameId = 0;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const styleGeoJSON = (feature: any) => {
    return {
      fillColor: getPartyColor(feature.properties.party),
      weight: 1,
      opacity: 0.4,
      color: 'rgba(255,255,255,0.3)',
      fillOpacity: 0.3,
      className: 'constituency-path' // for transitions
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on({
      mouseover: (e: any) => {
        const target = e.target;
        target.setStyle({ weight: 3, color: '#ffffff', fillOpacity: 0.7 });
        if (target._path) target._path.classList.add('constituency-hover');
        target.bringToFront();
        setHoveredFeature(feature.properties);
      },
      mouseout: (e: any) => {
        const target = e.target;
        target.setStyle(styleGeoJSON(feature));
        if (target._path) target._path.classList.remove('constituency-hover');
        setHoveredFeature(null);
      },
      click: (e: any) => {
        if (mapRef.current) {
           mapRef.current.flyToBounds(e.target.getBounds(), { duration: 1.2, easeLinearity: 0.25, maxZoom: 7 });
        }
        setSelectedFeature(feature.properties);
      }
    });
  };

  // -------------------------------------------------------------------------------- //
  // RENDER
  // -------------------------------------------------------------------------------- //

  return (
    <MainLayout>
      <MapStyleController />
      <div className="relative w-full h-[calc(100vh-4rem)] bg-black overflow-hidden flex flex-col md:flex-row font-sans">
        
        {/* ========================================================= */}
        {/* LEFT PANEL: DASHBOARD & CONTROLS                          */}
        {/* ========================================================= */}
        <motion.div 
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute z-[400] top-4 left-4 bottom-4 w-96 glass-panel rounded-3xl flex flex-col overflow-hidden shadow-2xl border-white/10"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Globe2 className="w-24 h-24" />
             </div>
             <h1 className="text-3xl font-serif text-white tracking-tight mb-2 relative z-10 text-gradient">
               Jan-Pratinidhi
             </h1>
             <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] font-mono relative z-10 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               Live Intelligence Map
             </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
            
            {/* AI Mode Toggle */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-1 flex">
               <button 
                 onClick={() => setIsAIMode(false)}
                 className={clsx("flex-1 py-3 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2", !isAIMode ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/70")}
               >
                 <Layers className="w-4 h-4" /> Standard Map
               </button>
               <button 
                 onClick={() => setIsAIMode(true)}
                 className={clsx("flex-1 py-3 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2", isAIMode ? "bg-white/10 text-white shadow-sm border border-purple-500/30" : "text-white/40 hover:text-white/70")}
               >
                 <Sparkles className="w-4 h-4 text-purple-400" /> AI Assistant
               </button>
            </div>

            {/* Content Switcher */}
            <AnimatePresence mode="wait">
              {isAIMode ? (
                <motion.div 
                  key="ai"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-white/60 font-light leading-relaxed">
                    Ask questions about political data. The AI will auto-configure the map and highlight insights.
                  </p>
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-4 w-4 h-4 text-purple-400/50" />
                    <textarea 
                      placeholder="e.g., Show BJP strongholds in Uttar Pradesh..."
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-purple-500/50 transition-colors resize-none h-24"
                    />
                  </div>
                  <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors">
                    Analyze Map
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="standard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Smart Search */}
                  <div>
                    <h3 className="text-[10px] uppercase font-mono text-white/40 tracking-widest mb-3">Target Coordinate</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input 
                        type="text" 
                        placeholder="Search MP, MLA, Const..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Map Levels */}
                  <div>
                    <h3 className="text-[10px] uppercase font-mono text-white/40 tracking-widest mb-3">Resolution Level</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'india', label: 'India View', icon: Globe2 },
                        { id: 'district', label: 'District View', icon: Crosshair },
                        { id: 'lok_sabha', label: 'Lok Sabha', icon: Shield },
                        { id: 'assembly', label: 'State Assembly', icon: Users },
                      ].map(level => (
                        <button
                          key={level.id}
                          onClick={() => setMapLevel(level.id as MapLevel)}
                          className={clsx(
                            "py-3 px-4 rounded-xl text-xs font-medium transition-all flex items-center justify-between border",
                            mapLevel === level.id 
                              ? "bg-white text-black border-white" 
                              : "bg-black/40 text-white/60 border-white/5 hover:border-white/20 hover:text-white"
                          )}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Project Intelligence */}
                  <div>
                    <h3 className="text-[10px] uppercase font-mono text-white/40 tracking-widest mb-3">Infrastructure Layer</h3>
                    <div className="space-y-2">
                      {[
                        { id: 'schools', label: 'Educational Institutions', color: 'bg-blue-500' },
                        { id: 'hospitals', label: 'Healthcare Facilities', color: 'bg-red-500' },
                        { id: 'roads', label: 'Highway & Roads', color: 'bg-amber-500' },
                      ].map(layer => (
                        <label key={layer.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-black/40 cursor-pointer transition-colors">
                          <div className="flex items-center gap-3">
                            <input type="checkbox" className="rounded bg-black/50 border-white/20 text-white focus:ring-0 focus:ring-offset-0" />
                            <span className="text-sm text-white/80">{layer.label}</span>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${layer.color}`}></div>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* CENTER: LEAFLET MAP                                       */}
        {/* ========================================================= */}
        <div className="w-full h-full relative z-0">
          <MapContainer 
            center={INDIA_CENTER} 
            zoom={5} 
            maxZoom={12}
            minZoom={4}
            style={{ height: "100%", width: "100%", background: "#060606" }} 
            zoomControl={false}
            ref={mapRef}
          >
            {/* Custom high-contrast dark tiles mimicking Bloomberg/CartoDB */}
            <TileLayer
              attribution=""
              url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            />
            
            {/* GeoJSON Rendering Layer */}
            {geoData && (
              <GeoJSON 
                key={`geojson-${mapLevel}-${selectedYear}`}
                data={geoData} 
                style={styleGeoJSON}
                onEachFeature={onEachFeature}
              />
            )}
          </MapContainer>

          {/* Central Map Overlay: Loading/Error Messages */}
          <AnimatePresence>
            {(isLoading || errorMsg) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none"
              >
                <div className="glass-panel p-8 rounded-3xl max-w-md text-center border-white/10 shadow-2xl">
                  {isLoading ? (
                    <>
                      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto mb-6"></div>
                      <h3 className="text-xl font-serif text-white mb-2">Compiling Map Geometries</h3>
                      <p className="text-white/50 text-sm">Loading authentic bounding polygons from GeoJSON databases...</p>
                    </>
                  ) : (
                    <>
                      <Shield className="w-10 h-10 text-white/20 mx-auto mb-6" />
                      <h3 className="text-xl font-serif text-white mb-3">Database Disconnected</h3>
                      <p className="text-white/50 text-sm whitespace-pre-line leading-relaxed">
                        {errorMsg}
                      </p>
                      <p className="text-white/30 text-xs mt-4 pt-4 border-t border-white/5">
                        In a full deployment, this layer streams real GeoJSON boundaries. Switch to "India View" to see fallback state definitions.
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL: CONSTITUENCY DETAILS                         */}
        {/* ========================================================= */}
        <AnimatePresence>
          {selectedFeature && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-[400] top-4 right-4 bottom-4 w-96 glass-panel rounded-3xl flex flex-col shadow-2xl border-white/10"
            >
              <div className="p-6 border-b border-white/10 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-serif text-white tracking-tight mb-1">{selectedFeature.name || "Unknown"}</h2>
                  <p className="text-white/50 text-xs font-mono uppercase tracking-widest">{mapLevel.replace('_', ' ')}</p>
                </div>
                <button 
                  onClick={() => setSelectedFeature(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {/* Premium Profile Section */}
                 <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center overflow-hidden">
                     <Users className="w-8 h-8 text-white/30" />
                   </div>
                   <div>
                     <h3 className="text-lg text-white font-medium mb-1">{selectedFeature.representative || "Incumbent Rep"}</h3>
                     <div className="flex items-center gap-2">
                       <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wider font-bold" style={{ backgroundColor: `${getPartyColor(selectedFeature.party || 'DEFAULT')}30`, color: getPartyColor(selectedFeature.party || 'DEFAULT') }}>
                         {selectedFeature.party || "IND"}
                       </span>
                       <span className="text-white/40 text-xs">Margin: {selectedFeature.margin || "12.4%"}</span>
                     </div>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                   <div className="glass-panel-light p-4 rounded-2xl">
                     <div className="text-white/40 text-[10px] uppercase font-mono tracking-widest mb-1">Development</div>
                     <div className="text-2xl text-white font-serif">{selectedFeature.developmentScore || 78}<span className="text-sm text-white/30">/100</span></div>
                   </div>
                   <div className="glass-panel-light p-4 rounded-2xl">
                     <div className="text-white/40 text-[10px] uppercase font-mono tracking-widest mb-1">Population</div>
                     <div className="text-2xl text-white font-serif">{selectedFeature.population || "2.1M"}</div>
                   </div>
                 </div>

                 {/* Simulated Analytics */}
                 <div className="space-y-4 pt-4 border-t border-white/10">
                   <h3 className="text-[10px] uppercase font-mono text-white/40 tracking-widest">Key Infrastructure Indexes</h3>
                   {[
                     { label: 'Literacy Rate', val: 82, color: 'bg-emerald-400' },
                     { label: 'Urbanization', val: 45, color: 'bg-blue-400' },
                     { label: 'Healthcare Access', val: 68, color: 'bg-rose-400' }
                   ].map((stat, i) => (
                     <div key={i} className="space-y-2">
                       <div className="flex justify-between text-xs">
                         <span className="text-white/70">{stat.label}</span>
                         <span className="text-white">{stat.val}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                         <div className={`h-full ${stat.color} rounded-full`} style={{ width: `${stat.val}%` }}></div>
                       </div>
                     </div>
                   ))}
                 </div>
                 
                 {/* Fast Action */}
                 <div className="pt-4">
                   <button className="w-full py-3.5 bg-white text-black hover:bg-white/90 rounded-xl text-sm font-medium transition-all shadow-lg flex items-center justify-center gap-2">
                     View Full Dossier <ChevronRight className="w-4 h-4" />
                   </button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* BOTTOM PANEL: TIMELINE SLIDER                             */}
        {/* ========================================================= */}
        <motion.div
           initial={{ y: 100, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ duration: 0.8, delay: 0.2 }}
           className="absolute z-[400] bottom-6 left-1/2 -translate-x-1/2 glass-panel rounded-2xl p-4 flex items-center gap-6 shadow-2xl border-white/5"
        >
           <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white">
             <Play className="w-4 h-4 ml-0.5" />
           </button>
           
           <div className="flex items-center gap-8">
             {[2004, 2009, 2014, 2019, 2024, 2029].map((yr) => (
               <button 
                 key={yr}
                 onClick={() => setSelectedYear(yr)}
                 className={clsx(
                   "relative font-mono text-xs transition-all duration-300",
                   selectedYear === yr ? "text-white text-lg" : "text-white/40 hover:text-white/70"
                 )}
               >
                 {yr}
                 {selectedYear === yr && (
                   <motion.div layoutId="timeline-indicator" className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_#fff]" />
                 )}
               </button>
             ))}
           </div>
        </motion.div>

        {/* ========================================================= */}
        {/* BOTTOM RIGHT: LEGEND                                      */}
        {/* ========================================================= */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="absolute z-[400] bottom-4 right-4 w-48 glass-panel rounded-2xl p-4 shadow-2xl pointer-events-none"
        >
          <h3 className="text-[9px] uppercase font-mono text-white/40 tracking-widest mb-3">Political Control</h3>
          <div className="space-y-2.5">
            {[
              { label: 'BJP+', color: '#ff9933' },
              { label: 'INC+', color: '#19aaed' },
              { label: 'Regional', color: '#20C646' },
              { label: 'Other', color: '#6f42c1' }
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white/80">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }}></div>
                  <span className="font-medium font-sans">{p.label}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* FLOATING HOVER TOOLTIP (PREMIUM LIQUID GLASS TERMINAL)    */}
        {/* ========================================================= */}
        <div 
          ref={tooltipRef}
          style={{ position: 'fixed', top: 0, left: 0, willChange: 'transform', pointerEvents: 'none' }}
          className="z-[500]"
        >
          <AnimatePresence>
            {hoveredFeature && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="w-96 rounded-2xl overflow-hidden glass-panel border border-white/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-3xl bg-black/60"
              >
                {/* Header & Score */}
                <div className="p-4 border-b border-white/10 flex justify-between items-start relative overflow-hidden">
                   <div 
                     className="absolute inset-x-0 top-0 h-1 opacity-60"
                     style={{ backgroundColor: getPartyColor(hoveredFeature.party || 'DEFAULT') }}
                   />
                   <div className="flex gap-4">
                     <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                       <Users className="w-8 h-8 text-white/50" />
                     </div>
                     <div>
                       <h4 className="text-xl text-white font-serif tracking-tight leading-none mb-1">{hoveredFeature.representative || "Incumbent"}</h4>
                       <div className="flex items-center gap-2 mb-2">
                         <div 
                           className="w-2 h-2 rounded-full"
                           style={{ backgroundColor: getPartyColor(hoveredFeature.party || 'DEFAULT'), boxShadow: `0 0 10px ${getPartyColor(hoveredFeature.party || 'DEFAULT')}` }}
                         />
                         <span className="text-[10px] font-mono text-white/70 uppercase tracking-wider">{hoveredFeature.party || "IND"}</span>
                         <span className="text-white/30 text-[10px]">|</span>
                         <span className="text-[10px] font-mono text-white/50 uppercase">{hoveredFeature.name}</span>
                       </div>
                     </div>
                   </div>
                   
                   {/* Health Score Hexagon Sim */}
                   <div className="flex flex-col items-center justify-center w-12 h-12 bg-white/5 rounded-lg border border-white/10">
                     <span className="text-[10px] uppercase font-mono text-white/40 tracking-tighter">Score</span>
                     <span className={clsx("text-lg font-serif leading-none", hoveredFeature.developmentScore > 75 ? 'text-emerald-400' : hoveredFeature.developmentScore > 50 ? 'text-amber-400' : 'text-rose-400')}>
                       {hoveredFeature.developmentScore || 0}
                     </span>
                   </div>
                </div>

                {/* Profile Meta Data */}
                <div className="grid grid-cols-2 text-xs divide-x divide-white/5 border-b border-white/5 bg-white/5">
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/40">Age</span>
                      <span className="text-white font-mono">{hoveredFeature.age || 45}</span>
                    </div>
                    <div className="flex justify-between relative group">
                      <span className="text-white/40">Education</span>
                      <span className="text-white truncate max-w-[80px]" title={hoveredFeature.education}>{hoveredFeature.education || 'Graduate'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Profession</span>
                      <span className="text-white truncate max-w-[80px]">{hoveredFeature.profession || 'Social Worker'}</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/40">Assets</span>
                      <span className="text-emerald-400 font-mono">{hoveredFeature.assets || '₹2.1 Cr'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Liabilities</span>
                      <span className="text-rose-400 font-mono">{hoveredFeature.liabilities || '₹0.0 Cr'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">Criminal</span>
                      {hoveredFeature.criminalCases > 0 ? (
                        <span className="bg-rose-500/20 text-rose-300 px-1.5 rounded font-mono text-[10px] border border-rose-500/30">
                          {hoveredFeature.criminalCases} Cases
                        </span>
                      ) : (
                        <span className="bg-emerald-500/20 text-emerald-300 px-1.5 rounded font-mono text-[10px] border border-emerald-500/30">
                          Clean
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity & Utilisation Metrics */}
                <div className="p-4 grid grid-cols-2 gap-4 border-b border-white/5">
                  <div className="space-y-1">
                     <span className="text-[10px] text-white/40 font-mono uppercase">Fund Utilization</span>
                     <div className="flex items-end gap-2">
                       <span className="text-lg text-white font-mono leading-none">{hoveredFeature.fundUtilization || '85%'}</span>
                     </div>
                     <div className="h-1 bg-white/10 rounded-full w-full overflow-hidden mt-1">
                       <div className="h-full bg-blue-400 rounded-full" style={{ width: hoveredFeature.fundUtilization || '85%' }} />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[10px] text-white/40 font-mono uppercase">Parliament Attendance</span>
                     <div className="flex items-end gap-2">
                       <span className="text-lg text-white font-mono leading-none">{hoveredFeature.attendance || '78%'}</span>
                     </div>
                     <div className="h-1 bg-white/10 rounded-full w-full overflow-hidden mt-1">
                       <div className="h-full bg-purple-400 rounded-full" style={{ width: hoveredFeature.attendance || '78%' }} />
                     </div>
                  </div>
                </div>

                {/* Info Text & Timeline */}
                <div className="p-4 bg-black/40">
                  <p className="text-xs text-white/60 leading-relaxed mb-3 italic">
                    "{hoveredFeature.wikipediaSummary}"
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase bg-white/5 border border-white/10 px-2 py-1 rounded text-white/80">
                      Margin: <strong className="text-white">{hoveredFeature.margin || '10.5%'}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase bg-white/5 border border-white/10 px-2 py-1 rounded text-white/80">
                      Projects: <strong className="text-white">{hoveredFeature.projectsCompleted || 45}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase bg-white/5 border border-white/10 px-2 py-1 rounded text-white/80">
                      Experience: <strong className="text-white">{hoveredFeature.politicalExperience || '10 Yrs'}</strong>
                    </span>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </MainLayout>
  );
}
