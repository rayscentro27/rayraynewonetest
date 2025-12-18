
import React, { useState, useEffect } from 'react';
import { 
    CheckCircle, Clock, FileText, MessageSquare, PlayCircle, ExternalLink, CheckSquare, 
    Square, Target, Calendar, Wallet as WalletIcon, Edit2, Save, X, Receipt, CreditCard, 
    HelpCircle, Upload, Loader, FileSearch, Lock, ChevronRight, Info, LayoutDashboard, 
    GraduationCap, BookOpen, Play, Gauge, TrendingUp, Users, Bell, Building2, Award, 
    Gavel, Percent, Video, Download, MessageCircle, LogOut, Smartphone, Sparkles, 
    DollarSign, VideoOff, Layers, ArrowRight, ShieldCheck, Activity, BrainCircuit, RefreshCw 
} from 'lucide-react';
import { Contact, ClientTask, Invoice, ClientDocument, AgencyBranding, Course, FundingGoal, CreditAnalysis } from '../types';
import DocumentVault from './DocumentVault';
import ReferralHub from './ReferralHub';
import BusinessProfile from './BusinessProfile';
import OfferManager from './OfferManager';
import BankConnect from './BankConnect';
import MessageCenter from './MessageCenter';
import TierProgressWidget from './TierProgressWidget';
import LoyaltyLevelWidget from './LoyaltyLevelWidget';
import ClientCardSuggestions from './ClientCardSuggestions';
import { GoogleGenAI } from '@google/genai';

interface PortalViewProps {
  contact: Contact;
  onUpdateContact: (contact: Contact) => void;
  branding: AgencyBranding;
  onLogout: () => void;
  isAdminPreview?: boolean;
  availableCourses?: Course[];
}

const PortalView: React.FC<PortalViewProps> = ({ contact, onUpdateContact, branding, onLogout, isAdminPreview, availableCourses = [] }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'roadmap' | 'vault' | 'offers' | 'messages' | 'cards'>('dashboard');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  if (!contact) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white"><Loader className="animate-spin text-emerald-500" /></div>;
  
  useEffect(() => {
    const runPortalAnalysis = async () => {
        if (activeTab !== 'dashboard') return;
        setIsAiLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const res = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Analyze this client's business funding profile and give a 1-sentence supportive 'AI Insight' on what they should do next to reach Tier 4: ${JSON.stringify({ 
                    score: contact.creditAnalysis?.score,
                    rev: contact.revenue,
                    docs: contact.documents?.length,
                    status: contact.status
                })}`
            });
            setAiAnalysis(res.text || "Your profile is healthy. Keep building trade lines.");
        } catch (e) {
            setAiAnalysis("Underwriting engine active. Complete your checklist items below.");
        } finally {
            setIsAiLoading(false);
        }
    };
    runPortalAnalysis();
  }, [contact.id, activeTab]);

  const verifiedDocs = contact.documents?.filter(d => d.status === 'Verified').length || 0;
  const readiness = Math.min(100, (verifiedDocs / 4) * 100);

  const roadmapSteps = [
    { id: 0, label: 'Compliance', icon: <ShieldCheck size={14}/> },
    { id: 1, label: 'Tier 1: Net 30', icon: <Activity size={14}/> },
    { id: 2, label: 'Tier 2: Store', icon: <Building2 size={14}/> },
    { id: 3, label: 'Tier 3: Fleet', icon: <Smartphone size={14}/> },
    { id: 4, label: 'Tier 4: Cash', icon: <DollarSign size={14}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-10 font-sans text-slate-900">
       
       <div className="bg-slate-950 text-white px-8 py-10 md:rounded-b-[3rem] shadow-2xl relative overflow-hidden flex-shrink-0">
          <div className="absolute top-[-50%] right-[-10%] w-full h-[200%] bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full"></div>
          
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
            <div className="flex items-center gap-4">
               <div className="bg-emerald-500 p-3 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] transform rotate-3">
                  <Building2 size={28} className="text-slate-950" />
               </div>
               <div>
                  <span className="text-3xl font-black tracking-tighter uppercase leading-none block">
                     {branding.name.split(' ')[0]}<span className="text-emerald-500">{branding.name.split(' ')[1] || 'Capital'}</span>
                  </span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 block">Secured Workspace</span>
               </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-6 overflow-x-auto no-scrollbar w-full md:w-auto">
               {roadmapSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 flex-shrink-0 group">
                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all border-2 ${contact.checklist?.[`tier_${idx}`] || idx <= 1 ? 'bg-emerald-50 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-slate-600'}`}>
                        {(contact.checklist?.[`tier_${idx}`] || idx <= 0) ? <CheckCircle size={18}/> : idx}
                     </div>
                     <div className="hidden lg:block">
                        <span className={`text-[10px] font-black uppercase tracking-widest block ${idx <= 1 ? 'text-white' : 'text-slate-600'}`}>{step.label}</span>
                     </div>
                     {idx < roadmapSteps.length - 1 && <div className="w-6 h-0.5 bg-white/5 rounded-full mx-1"></div>}
                  </div>
               ))}
            </div>

            <button 
              onClick={onLogout} 
              className="flex items-center gap-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all border border-white/10"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
       </div>

       <div className="max-w-7xl mx-auto w-full px-6 -mt-8 z-30">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-2 shadow-2xl flex overflow-x-auto no-scrollbar gap-2">
             {[
               { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={18}/> },
               { id: 'profile', label: 'Identity', icon: <ShieldCheck size={18}/> },
               { id: 'roadmap', label: 'Tiers', icon: <Layers size={18}/> },
               { id: 'vault', label: 'Vault', icon: <FileText size={18}/> },
               { id: 'offers', label: 'Funding', icon: <DollarSign size={18}/> },
               { id: 'cards', label: 'Cards', icon: <CreditCard size={18}/> },
               { id: 'messages', label: 'Secure Support', icon: <MessageCircle size={18}/> },
             ].map(tab => (
               <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
               >
                 {tab.icon} {tab.label}
               </button>
             ))}
          </div>
       </div>

       <div className="flex-1 max-w-7xl mx-auto w-full px-8 pt-12 pb-20">
          {activeTab === 'dashboard' && (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                
                <div className="lg:col-span-8 space-y-8">
                   <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm relative overflow-hidden group">
                      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                         <div>
                            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-100 shadow-sm">
                               {isAiLoading ? <RefreshCw className="animate-spin" size={12}/> : <BrainCircuit size={12}/>} 
                               AI Status: {contact.status === 'Closed' ? 'Funding Secured' : 'Optimal'}
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 uppercase leading-none">Your Business is <span className="text-emerald-500">Fundable.</span></h2>
                            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-sm italic">
                                "{isAiLoading ? 'Analyzing your latest activities...' : aiAnalysis}"
                            </p>
                         </div>
                         <div className="flex justify-center">
                            <div className="relative w-48 h-48">
                               <div className="absolute inset-0 rounded-full border-8 border-slate-100"></div>
                               <div className="absolute inset-0 rounded-full border-8 border-emerald-500 transition-all duration-1000" style={{ clipPath: `inset(0 0 0 ${100-readiness}%)`, transform: 'rotate(-90deg)' }}></div>
                               <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-4xl font-black text-slate-900">{readiness}%</span>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Readiness</span>
                               </div>
                            </div>
                         </div>
                      </div>
                      <div className="absolute right-0 bottom-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={240} /></div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <TierProgressWidget contact={contact} />
                      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500"/> Critical Path</h3>
                         <div className="space-y-6">
                            {(contact.clientTasks?.length || 0) > 0 ? contact.clientTasks.slice(0, 3).map(t => (
                              <div key={t.id} className="flex items-center justify-between group cursor-pointer" onClick={() => t.link && window.open(t.link, '_blank')}>
                                 <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${t.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                                       {t.type === 'meeting' ? <Video size={20}/> : <Layers size={20}/>}
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-slate-800 uppercase tracking-widest">{t.title}</p>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase">{t.status}</p>
                                    </div>
                                 </div>
                                 <ChevronRight size={18} className="text-slate-300" />
                              </div>
                            )) : (
                                <p className="text-sm text-slate-400 italic">Complete your profile to unlock tasks.</p>
                            )}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                   <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                      <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">Goal Amount</p>
                      <h3 className="text-5xl font-black text-white mb-8 tracking-tighter">${contact.fundingGoal?.targetAmount?.toLocaleString() || '150,000'}</h3>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Filing Status</p>
                            <p className="text-xs font-bold text-emerald-400">ACTIVE</p>
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Target</p>
                            <p className="text-xs font-bold text-blue-400">Tier 4 Cash</p>
                         </div>
                      </div>
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform"><Sparkles size={120}/></div>
                   </div>
                   <BankConnect contact={contact} onUpdateContact={onUpdateContact} />
                   <LoyaltyLevelWidget contact={contact} />
                </div>
             </div>
          )}

          {activeTab === 'vault' && <DocumentVault contact={contact} onUpdateContact={onUpdateContact} readOnly={true} />}
          {activeTab === 'profile' && <BusinessProfile contact={contact} onUpdateContact={onUpdateContact} />}
          {activeTab === 'offers' && <OfferManager contact={contact} onUpdateContact={onUpdateContact} />}
          {activeTab === 'cards' && <ClientCardSuggestions contact={contact} />}
          {activeTab === 'messages' && <MessageCenter contact={contact} onUpdateContact={onUpdateContact} currentUserRole="client" />}
          
          {activeTab === 'roadmap' && (
             <div className="space-y-8 animate-fade-in">
                <div className="bg-slate-900 rounded-[3rem] p-16 text-white shadow-2xl relative overflow-hidden border border-white/5">
                   <div className="absolute top-0 right-0 p-20 opacity-10 rotate-12"><GraduationCap size={280} /></div>
                   <div className="relative z-10 max-w-3xl">
                      <h2 className="text-5xl font-black mb-6 tracking-tighter uppercase leading-none">The Path to <span className="text-emerald-500">Tier 4</span></h2>
                      <p className="text-slate-400 text-xl leading-relaxed mb-0 font-medium">Follow this protocol to build institutional-grade business credit. Each phase represents a leap in capital access.</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {roadmapSteps.map((step, idx) => (
                      <div key={idx} className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col justify-between group ${idx <= 1 ? 'bg-white border-emerald-500/20 shadow-xl' : 'bg-slate-100 border-transparent opacity-60'}`}>
                         <div>
                            <div className="flex justify-between items-start mb-8">
                               <div className={`p-5 rounded-2xl transition-transform group-hover:scale-110 ${idx <= 1 ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'bg-white text-slate-400'}`}>
                                  {step.icon}
                               </div>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase 0{idx + 1}</span>
                            </div>
                            <h3 className={`text-2xl font-black uppercase mb-4 tracking-tight ${idx <= 1 ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                               {idx === 0 ? "Establish legal identity. We verify your SOS standing, EIN CP575, and 411 directories." : 
                                idx === 1 ? "Launch Net-30 trade lines with reporting vendors to generate your first Paydex score." :
                                idx === 2 ? "Unlock store-specific revolvers with high limits ($5k-$15k) using your Tier 1 history." :
                                "Access 0% interest bank lines and institutional term loans without personal guarantees."}
                            </p>
                         </div>
                         <button className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 ${idx <= 1 ? 'bg-slate-950 text-white hover:bg-indigo-600' : 'bg-white border border-slate-200 text-slate-300'} transition-all`}>
                            {idx <= 1 ? 'Module Complete' : 'Locked'} <ArrowRight size={14}/>
                         </button>
                      </div>
                   ))}
                </div>
             </div>
          )}
       </div>
       
       <div className="fixed bottom-28 right-8 z-[40]">
          <button className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-indigo-500/40">
             <MessageCircle size={32} />
          </button>
       </div>
    </div>
  );
};

export default PortalView;
