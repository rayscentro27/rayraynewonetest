import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Globe, Settings, LogOut, Hexagon, 
  Inbox, Calendar, GitBranch, Mic, Phone, Map, LayoutTemplate, 
  PieChart, Tv, FileText, Layout, List, FileCheck, Briefcase, 
  Menu, X, Megaphone, ChevronRight, Share2, Map as MapIcon, 
  Target, BarChart3, Star, CreditCard, ShieldCheck, GraduationCap, MapPinned
} from 'lucide-react';
import { ViewMode, AgencyBranding } from '../../types';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  pendingDocCount?: number; 
  onLogout: () => void;
  branding?: AgencyBranding;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, pendingDocCount = 0, onLogout, branding }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNav = (view: ViewMode) => {
    onViewChange(view);
    setIsMobileOpen(false);
  };

  const disconnectedSocials = branding?.socialConnections?.filter(s => !s.connected).length || 0;

  return (
    <>
      <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="md:hidden fixed top-4 left-4 z-[60] p-2.5 bg-slate-950 text-white rounded-xl shadow-lg border border-white/10 hover:bg-slate-900 transition-all active:scale-95">{isMobileOpen ? <X size={22} /> : <Menu size={22} />}</button>

      <div className={`fixed top-0 left-0 h-screen w-64 bg-slate-950 text-white flex flex-col shadow-2xl z-50 transition-transform duration-300 ease-in-out border-r border-white/5 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        <div className="p-6 flex items-center gap-3 border-b border-white/5 bg-slate-950 relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none"></div>
          <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-900/40 transform -rotate-3 group-hover:rotate-0 transition-transform">
            <Hexagon className="text-slate-950 fill-slate-950/10" size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tighter uppercase leading-none">{branding?.name || 'Nexus'}<span className="text-emerald-500">OS</span></span>
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Intelligence OS</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-7 overflow-y-auto custom-scrollbar scroll-smooth">
          <section className="space-y-1">
            <div className="px-3 mb-2 flex items-center justify-between"><span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Workspace</span></div>
            <SidebarItem id={ViewMode.DASHBOARD} label="Dashboard" icon={LayoutDashboard} currentView={currentView} onViewChange={handleNav} />
            <SidebarItem id={ViewMode.INBOX} label="Unified Inbox" icon={Inbox} currentView={currentView} onViewChange={handleNav} />
            <SidebarItem id={ViewMode.DOCUMENTS} label="Documents" icon={FileText} currentView={currentView} onViewChange={handleNav} />
            <SidebarItem id={ViewMode.ADMIN_CLIENTS} label="Invite Clients" icon={Users} currentView={currentView} onViewChange={handleNav} />
            <SidebarItem id={ViewMode.ADMIN_CMS} label="Site Builder" icon={Layout} currentView={currentView} onViewChange={handleNav} />
          </section>

          <section className="space-y-1">
            <div className="px-3 mb-2 flex items-center justify-between"><span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Sales Ops</span></div>
            <SidebarItem id={ViewMode.CRM} label="CRM Pipeline" icon={Users} currentView={currentView} onViewChange={handleNav} />
            <SidebarItem id={ViewMode.POWER_DIALER} label="Power Dialer" icon={Phone} currentView={currentView} onViewChange={handleNav} />
            <SidebarItem id={ViewMode.SALES_TRAINER} label="AI Sales Coach" icon={Mic} currentView={currentView} onViewChange={handleNav} />
            <SidebarItem id={ViewMode.MARKETING} label="AI Campaigns" icon={Megaphone} currentView={currentView} onViewChange={handleNav} />
          </section>

          <section className="space-y-1">
            <div className="px-3 mb-2 flex items-center justify-between"><span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Navigation</span></div>
            <SidebarItem id={ViewMode.SITEMAP} label="System Sitemap" icon={MapPinned} currentView={currentView} onViewChange={handleNav} />
            <SidebarItem id={ViewMode.SETTINGS} label="Global Settings" icon={Settings} currentView={currentView} onViewChange={handleNav} badge={disconnectedSocials > 0 ? disconnectedSocials : undefined} badgeColor="bg-amber-500" />
          </section>
        </nav>
        
        <div className="p-4 border-t border-white/5 bg-slate-950/50">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 transition-all w-full rounded-xl hover:bg-red-400/5 font-black text-xs uppercase tracking-[0.1em] group border border-transparent hover:border-red-400/20">
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      
      {isMobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/40 md:hidden backdrop-blur-[2px] transition-all" onClick={() => setIsMobileOpen(false)}></div>}
    </>
  );
};

interface SidebarItemProps {
  id: ViewMode;
  label: string;
  icon: React.ElementType;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  badge?: number;
  badgeColor?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ id, label, icon: Icon, currentView, onViewChange, badge, badgeColor = 'bg-red-500' }) => {
  const isActive = currentView === id;

  return (
    <button 
      onClick={() => onViewChange(id)}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isActive ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-emerald-400'}`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
          <Icon 
            size={18}
            strokeWidth={isActive ? 2.5 : 2}
            className={isActive ? 'text-slate-950' : 'text-slate-500 group-hover:text-emerald-400 transition-colors'} 
          />
        </div>
        <span className={`font-black text-[11px] uppercase tracking-wider truncate transition-all ${isActive ? 'translate-x-0.5' : 'translate-x-0'}`}>{label}</span>
      </div>
      {badge !== undefined ? (
        <div className={`px-1.5 py-0.5 rounded-md text-[10px] font-black min-w-[1.25rem] text-center shadow-sm ${isActive ? 'bg-slate-950 text-emerald-400' : `${badgeColor} text-white`}`}>{badge}</div>
      ) : (
        <ChevronRight size={12} className={`opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 ${isActive ? 'text-slate-950' : 'text-emerald-500/50'}`} />
      )}
    </button>
  );
};

export default Sidebar;
