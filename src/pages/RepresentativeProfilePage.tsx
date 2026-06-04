import { useParams, Navigate } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { motion } from "motion/react";
import { fadeUp } from "../lib/animations";
import { ArrowUpRight, GraduationCap, Scale, Briefcase, User, Calendar, MapPin, ExternalLink, IndianRupee, MessageSquareQuote, Phone, Heart, Users } from "lucide-react";
import { GlassStatisticCard } from "../components/ui/GlassStatisticCard";
import { representativesData } from "../data/representatives";
import { rajyaSabhaData } from "../data/rajyaSabhaData";
import { getAddressForMP } from "../data/addressData";
import { getAffidavitData } from "../data/affidavitData";
import { getAttendanceData } from "../data/attendanceData";
import { getQuestionsForMP } from "../data/questionsData";

const allRepresentatives = [...representativesData, ...rajyaSabhaData];

import { useState, useEffect } from 'react';
import axios from 'axios';

export function RepresentativeProfilePage() {
  const { id } = useParams<{id: string}>();
  const [dbRep, setDbRep] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     if (id && id.length > 5) {
        axios.get(`/api/representative/${id}`)
           .then(res => {
               if (res.data && res.data.data) {
                  setDbRep(res.data.data);
               }
               setLoading(false);
           })
           .catch(() => setLoading(false));
     } else {
        setLoading(false);
     }
  }, [id]);
  
  const representative = allRepresentatives.find(rep => rep.id === id);

  if (loading) {
     return (
       <MainLayout>
         <div className="max-w-7xl mx-auto px-6 py-32 text-center">
           <h1 className="text-2xl text-white font-serif mb-4">Loading Profile...</h1>
         </div>
       </MainLayout>
     );
  }

  const isDbRep = !!dbRep;
  const safeName = isDbRep ? dbRep.name : (representative?.name || "Unknown");
  
  const formatCurrency = (val: number) => {
      if (val >= 10000000) return `₹${(val/10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹${(val/100000).toFixed(2)} L`;
      return `₹${val.toLocaleString()}`;
  };

  const repData = isDbRep ? {
      name: safeName,
      party: dbRep.party,
      constituency: dbRep.constituency?.name || '',
      state: dbRep.state?.name || '',
      status: dbRep.type || 'MLA',
      terms: 1,
      type: dbRep.type || 'MLA',
      criminalCasesCount: dbRep.criminalCasesCount,
      totalAssets: dbRep.totalAssets,
      totalLiabilities: dbRep.totalLiabilities,
      education: dbRep.education,
      image: dbRep.imageUrl,
      attendance: dbRep.attendance,
      questionsAsked: dbRep.questionsAsked
  } : representative;

  const addressInfo = representative ? getAddressForMP(representative.name) : {
      email: '', permanentAddress: '', delhiAddress: ''
  };
  const affidavitData = representative ? getAffidavitData(representative.id, representative.name) : {
      gender: 'N/A', age: 'N/A', guardianName: 'N/A', maritalStatus: 'N/A', 
      childrenDetails: 'N/A', phone: 'N/A', address: 'N/A',
      criminalCases: dbRep?.criminalCasesCount || 0,
      totalAssets: formatCurrency(dbRep?.totalAssets || 0),
      liabilities: formatCurrency(dbRep?.totalLiabilities || 0),
      education: dbRep?.education || 'N/A'
  };
  const attendanceData = representative ? getAttendanceData(representative.id, representative.name) : {
      percentage: repData?.attendance || 'N/A', daysSigned: 0, totalDays: 0, questionsAsked: repData?.questionsAsked || 0
  };
  const questions = representative ? getQuestionsForMP(representative.id, representative.name) : [];

  if (!repData) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-6 py-32 text-center">
          <h1 className="text-4xl text-white font-serif mb-4">Representative Profile Pending</h1>
          <p className="text-white/50">The requested profile might be an MLA loaded from DB or could not be found.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Cover Area */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-10" />
        <div className="absolute inset-0 bg-white/5" />
        
        {/* Content over hero cover */}
        <div className="absolute bottom-0 left-0 w-full z-20 pb-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end gap-8">
             <motion.div 
               {...fadeUp}
               className="w-32 h-32 md:w-48 md:h-48 rounded-3xl overflow-hidden bg-white/10 shrink-0 border-2 border-black relative"
             >
               {repData.image ? (
                 <img src={repData.image} alt={safeName} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center font-serif text-5xl text-white/30">
                   {safeName.charAt(0)}
                 </div>
               )}
             </motion.div>
             
             <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="flex-1">
               <div className="liquid-glass inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
                 {repData.status} • Lok Sabha terms: {repData.terms}
               </div>
               <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tight mb-2">{safeName}</h1>
               <p className="text-white/60 text-lg">{repData.party} • {repData.constituency}, {repData.state}</p>
             </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-12">
          
          <motion.section {...fadeUp}>
             <h2 className="text-2xl font-serif text-white mb-6 border-b border-white/10 pb-2 inline-block">Biography</h2>
             <p className="text-white/70 leading-relaxed text-lg">
               {safeName} is a member of the {repData.party} representing the {repData.constituency} constituency in {repData.state}. 
               Current status is {repData.status}. Total terms served: {repData.terms}.
             </p>
          </motion.section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <GlassStatisticCard 
              label="Attendance (Overall)" 
              value={attendanceData.percentage !== 'N/A' ? `${attendanceData.percentage}%` : 'N/A'} 
              trend={attendanceData.totalDays ? `${attendanceData.daysSigned} / ${attendanceData.totalDays} days` : undefined} 
            />
            <GlassStatisticCard 
              label="Questions Asked" 
              value={attendanceData.questionsAsked?.toString() || '0'} 
              trend={!isDbRep ? "In 18th Session" : undefined} 
            />
            <GlassStatisticCard label={`${repData.type} Terms`} value={repData.terms} />
            <GlassStatisticCard label="Constituency" value={repData.constituency} />
          </div>

          <motion.section {...fadeUp}>
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-serif text-white">Recent Parliamentary Questions</h2>
               <button className="text-white/50 hover:text-white uppercase tracking-widest text-xs flex items-center gap-1 transition-colors">
                  View All <ArrowUpRight className="w-4 h-4" />
               </button>
            </div>
            
            <div className="space-y-4">
              {questions.length > 0 ? questions.map((q, i) => (
                <div key={i} className="liquid-glass rounded-2xl p-6 flex justify-between items-center group cursor-pointer hover:bg-white/[0.02]">
                  <div className="flex-1 mr-4">
                    <div className="text-white/60 text-xs tracking-widest uppercase mb-2 flex items-center gap-3">
                      <span>{q.date}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                      <span className={q.type === 'Starred' ? "text-amber-400" : "text-white/60"}>{q.type}</span>
                    </div>
                    <h3 className="text-white text-lg font-medium group-hover:text-white/80 transition-colors mb-1">{q.subject}</h3>
                    <p className="text-white/50 text-sm">{q.ministry}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/50 group-hover:bg-white/5 group-hover:text-white transition-all shrink-0">
                    <MessageSquareQuote className="w-5 h-5" />
                  </div>
                </div>
              )) : (
                <div className="liquid-glass rounded-2xl p-8 text-center text-white/50">
                  No questions asked during this session.
                </div>
              )}
            </div>
          </motion.section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div {...fadeUp} className="liquid-glass rounded-3xl p-6 md:p-8">
            <h3 className="text-sm uppercase tracking-widest text-white/50 mb-6">Details</h3>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <User className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Gender & Age</div>
                  <div className="text-white text-sm">{affidavitData.gender}, {affidavitData.age} Years</div>
                </div>
              </li>
              <li className="flex gap-4">
                <User className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Guardian/Spouse Name</div>
                  <div className="text-white text-sm">{affidavitData.guardianName}</div>
                </div>
              </li>
              <li className="flex gap-4">
                <Heart className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Marital Status</div>
                  <div className="text-white text-sm">{affidavitData.maritalStatus}</div>
                </div>
              </li>
              <li className="flex gap-4">
                <Users className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Children</div>
                  <div className="text-white text-sm">{affidavitData.childrenDetails}</div>
                </div>
              </li>
              <li className="flex gap-4">
                <User className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">State</div>
                  <div className="text-white text-sm">{repData.state}</div>
                </div>
              </li>
              <li className="flex gap-4">
                <Briefcase className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Party Name</div>
                  <div className="text-white text-sm">{repData.party}</div>
                </div>
              </li>
              <li className="flex gap-4">
                <Calendar className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Terms</div>
                  <div className="text-white text-sm">{repData.terms}</div>
                </div>
              </li>
            </ul>
          </motion.div>

          <motion.div {...fadeUp} className="liquid-glass rounded-3xl p-6 md:p-8">
            <h3 className="text-sm uppercase tracking-widest text-white/50 mb-6">Portal Data (Directory)</h3>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center text-white/40 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Phone Number</div>
                  <div className="text-white text-sm leading-relaxed">{affidavitData.phone}</div>
                </div>
              </li>
              {addressInfo.email && (
                <li className="flex gap-4">
                  <div className="w-5 h-5 shrink-0 flex items-center justify-center text-white/40 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Email ID</div>
                    <div className="text-white text-sm leading-relaxed">{addressInfo.email.replace(/\[at\]/g, '@').replace(/\[dot\]/g, '.')}</div>
                  </div>
                </li>
              )}
              <li className="flex gap-4">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center text-white/40 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Election Affidavit Address</div>
                  <div className="text-white text-sm leading-relaxed">{affidavitData.address}</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center text-white/40 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Permanent Address</div>
                  <div className="text-white text-sm leading-relaxed">{addressInfo.permanentAddress}</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center text-white/40 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Delhi Address</div>
                  <div className="text-white text-sm leading-relaxed">{addressInfo.delhiAddress}</div>
                </div>
              </li>
            </ul>
          </motion.div>

          <motion.div {...fadeUp} className="liquid-glass rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm uppercase tracking-widest text-white/50">ECI Affidavit Data</h3>
              <a href="https://affidavit.eci.gov.in" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" title="View Source on ECI">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center text-emerald-400 mt-0.5">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Criminal Cases</div>
                  <div className="text-white text-sm leading-relaxed">{affidavitData.criminalCases} {affidavitData.criminalCases === 1 ? 'Case' : 'Cases'}</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center text-white/40 mt-0.5">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Total Assets</div>
                  <div className="text-white text-sm leading-relaxed">{affidavitData.totalAssets}</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center text-white/40 mt-0.5">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Liabilities</div>
                  <div className="text-white text-sm leading-relaxed">{affidavitData.liabilities}</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center text-white/40 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Education</div>
                  <div className="text-white text-sm leading-relaxed">{affidavitData.education}</div>
                </div>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
