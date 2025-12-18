
import React from 'react';
import { Hexagon, CheckCircle, ArrowRight, Zap, TrendingUp, ShieldCheck, DollarSign, Clock, LayoutDashboard, Sparkles, Smartphone, Award } from 'lucide-react';
import { ViewMode } from '../types';

interface ClientLandingPageProps {
  onNavigate: (view: ViewMode) => void;
}

const ClientLandingPage: React.FC<ClientLandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 scroll-smooth">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
              <Hexagon className="text-slate-950 fill-slate-950/10" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase">Nexus<span className="text-emerald-500">Capital</span></span>
          </div>
          <div className="hidden md:flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 items-center">
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">Infrastructure</a>
            <a href="#benefits" className="hover:text-emerald-400 transition-colors">Yield</a>
            <a href="#success-stories" className="hover:text-emerald-400 transition-colors">Vetted</a>
          </div>
          <div className="flex gap-6 items-center">
            <button 
              onClick={() => onNavigate(ViewMode.LOGIN)}
              className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => onNavigate(ViewMode.SIGNUP)}
              className="px-8 py-3 text-xs font-black uppercase tracking-widest bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10 transform active:scale-95"
            >
              Apply Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-48 pb-32 px-6 relative overflow-hidden">
        {/* High-End Background FX */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-500 rounded-full blur-[150px] opacity-10"></div>
          <div className="absolute bottom-0 left-[-5%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[150px] opacity-5"></div>
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-emerald-500/20">
              <Sparkles size={12} className="fill-emerald-400" /> V2.5 Neural Engine Active
            </div>
            <h1 className="text-6xl md:text-8xl font-black leading-[1] mb-8 tracking-tighter text-white">
              Capital at the speed of <span className="text-emerald-500">thought.</span>
            </h1>
            <p className="text-lg text-slate-400 mb-12 leading-relaxed max-w-lg font-medium">
              Enterprise-grade business funding powered by Nexus AI. Skip the legacy bank protocols and access high-limit capital in 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={() => onNavigate(ViewMode.SIGNUP)}
                className="px-12 py-6 bg-emerald-500 text-slate-950 rounded-2xl font-black text-xl hover:bg-emerald-400 shadow-[0_20px_50px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1"
              >
                Get Funded <ArrowRight size={24} />
              </button>
              <div className="flex items-center gap-6 px-4">
                 <div className="flex flex-col">
                    <span className="text-white font-black text-lg">$5M</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Max Limit</span>
                 </div>
                 <div className="w-px h-8 bg-white/10"></div>
                 <div className="flex flex-col">
                    <span className="text-white font-black text-lg">24H</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deployment</span>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="relative hidden lg:block animate-slide-in-right">
             <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp size={200} className="text-emerald-400" /></div>
                
                <div className="relative z-10">
                   <p className="text-emerald-500 text-xs font-black uppercase tracking-[0.2em] mb-4">Underwriting Scan</p>
                   <div className="space-y-6">
                      <div className="flex justify-between items-end border-b border-white/10 pb-6">
                         <div>
                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Approved Credit</p>
                            <h3 className="text-5xl font-black text-white">$450,000</h3>
                         </div>
                         <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <CheckCircle size={28} className="text-slate-950" />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                         <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Match Rating</p>
                            <div className="text-xl font-bold text-white">98.2%</div>
                         </div>
                         <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Risk Profile</p>
                            <div className="text-xl font-bold text-emerald-400">OPTIMIZED</div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             
             {/* Floating Badge */}
             <div className="absolute -bottom-6 -left-6 bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl animate-bounce-slow">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                      <Award size={24} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Awarded</p>
                      <p className="text-white font-bold text-xs">Best Tech Capital 2024</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="how-it-works" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter">The Modern Capital Stack.</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
              Legacy banks use outdated models. Nexus uses real-time neural analysis to unlock the highest funding tiers for your entity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm p-12 rounded-[2.5rem] border border-white/5 hover:border-emerald-500/30 transition-all group">
               <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Smartphone size={32} className="text-emerald-500" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-4">1. Smart Connect</h3>
               <p className="text-slate-400 leading-relaxed font-medium">Securely link your Primary Operating Account. Our AI spreads 12 months of data in seconds to find hidden equity.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-12 rounded-[2.5rem] border border-white/5 hover:border-emerald-500/30 transition-all group">
               <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={32} className="text-emerald-500" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-4">2. Tier Optimization</h3>
               <p className="text-slate-400 leading-relaxed font-medium">Nexus scans 75+ institutional lenders to match your profile with the lowest factor rates and longest terms.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-12 rounded-[2.5rem] border border-white/5 hover:border-emerald-500/30 transition-all group">
               <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <DollarSign size={32} className="text-emerald-500" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-4">3. Instant Liquidity</h3>
               <p className="text-slate-400 leading-relaxed font-medium">Electronic signatures and same-day wire transfers. Manage your entire repayment ledger from the mobile-first portal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-slate-950">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl">
                  <Hexagon className="text-slate-950 fill-slate-950/10" size={20} />
                </div>
                <span className="text-xl font-black text-white uppercase tracking-tighter">Nexus<span className="text-emerald-500">Capital</span></span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
               © 2024 Nexus Intelligence OS • Bank-Grade Security
            </div>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
               <a href="#" className="hover:text-emerald-400 transition-colors">Legal</a>
               <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
               <button onClick={() => onNavigate(ViewMode.LANDING)} className="hover:text-white transition-colors opacity-40">Broker Portal</button>
            </div>
         </div>
      </footer>

    </div>
  );
};

export default ClientLandingPage;
