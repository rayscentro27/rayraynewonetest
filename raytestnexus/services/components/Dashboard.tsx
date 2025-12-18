
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Activity, Sparkles, RefreshCw, 
  History, Zap, CheckCircle, ArrowRight, Lightbulb, Target, 
  ShieldAlert, MessageSquare 
} from 'lucide-react';
import { Contact } from '../../types';
import AdminSetupWizard from './AdminSetupWizard';
import { GoogleGenAI } from '@google/genai';

interface DashboardProps {
  contacts?: Contact[];
}

const Dashboard: React.FC<DashboardProps> = ({ contacts = [] }) => {
  const [briefing, setBriefing] = useState<string>('');
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const runNeuralBriefing = async () => {
      if (contacts.length === 0) {
        setBriefing("Nexus Initialized. Ready for primary lead injection.");
        setIsLoadingBriefing(false);
        return;
      }
      setIsLoadingBriefing(true);
      try {
        // ALWAYS create a new instance before making an API call
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Analyze these business funding leads and provide a 3-sentence high-impact briefing. Focus on revenue opportunities and pipeline conversion. Leads: ${JSON.stringify(contacts.map(c => ({ company: c.company, status: c.status, value: c.value, lastContact: c.lastContact })))}`
        });
        setBriefing(response.text || "Handshake established. Awaiting lead updates.");
        
        const suggestionList = [
            "Hot Lead: Alice Freeman is 72h stagnant. Trigger follow-up sequence.",
            "Pipeline Alert: 3 deals ready for Battle Card synthesis.",
            "Market Opportunity: Interest rates for Trucking niche decreased by 1.2%."
        ];
        setSuggestions(suggestionList);
      } catch (e) {
        setBriefing("AI Protocol offline. Awaiting neural link establishment.");
      } finally {
        setIsLoadingBriefing(false);
      }
    };
    runNeuralBriefing();
  }, [contacts]);

  const totalValue = contacts.reduce((sum, c) => sum + (c.value || 0), 0);
  const fundedCount = contacts.filter(c => c.status === 'Closed').length;

  const activities = contacts.flatMap(c => 
    (c.activities || []).map(a => ({ ...a, contactCompany: c.company }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  const chartData = [
    { name: 'Mon', leads: 4 },
    { name: 'Tue', leads: 7 },
    { name: 'Wed', leads: 5 },
    { name: 'Thu', leads: 12 },
    { name: 'Fri', leads: 8 },
    { name: 'Sat', leads: 2 },
    { name: 'Sun', leads: 1 },
  ];

  if (contacts.length < 2) {
    return <AdminSetupWizard onNavigate={() => {}} />;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-7xl mx-auto">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-all rotate-12 -translate-y-10 translate-x-10"><Zap size={300} /></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
               <div className="flex items-center gap-3 mb-8">
                  <div className="bg-emerald-500 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20 transform -rotate-3"><Sparkles size={24} className="text-slate-950" /></div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Neural Executive Briefing</h2>
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] mt-1">Intelligence Protocol v2.5</p>
                  </div>
               </div>
               
               {isLoadingBriefing ? (
                 <div className="space-y-4 animate-pulse max-w-lg">
                    <div className="h-4 bg-white/10 rounded w-full"></div>
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                 </div>
               ) : (
                 <p className="text-2xl font-medium leading-relaxed text-slate-100 italic">
                    "{briefing}"
                 </p>
               )}
            </div>

            <div className="lg:col-span-4 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] h-full flex flex-col justify-center">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Lightbulb size={16} className="text-yellow-400"/> AI Suggestions</h3>
                <div className="space-y-5">
                    {suggestions.map((s, i) => (
                        <div key={i} className="flex gap-4 group/item cursor-pointer">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 group-hover/item:scale-150 transition-transform"></div>
                            <p className="text-xs font-bold text-slate-300 group-hover/item:text-white transition-colors leading-relaxed">{s}</p>
                        </div>
                    ))}
                </div>
                <button className="mt-8 text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 hover:text-emerald-300 transition-colors">Execute Recommendations <ArrowRight size={12}/></button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Total Pipeline" value={`$${(totalValue/1e6).toFixed(1)}M`} sub={`Across ${contacts.length} Deals`} icon={<Activity size={20}/>} color="blue" />
              <StatCard label="Funded Deals" value={fundedCount.toString()} sub="Lifetime Performance" icon={<CheckCircle size={20}/>} color="emerald" />
              <StatCard label="At Risk" value="3" sub="Stale > 72 Hours" icon={<ShieldAlert size={20}/>} color="red" />
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Lead Influx Trend</h3>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">7 Day Capture Rate</p>
                </div>
              </div>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        cursor={{stroke: '#3b82f6', strokeWidth: 2}}
                      />
                      <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={3} fill="url(#colorLeads)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col shadow-sm overflow-hidden h-[fit-content]">
           <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                 <History size={20} className="text-blue-600" /> Recent Activity
              </h3>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           </div>
           <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
              {activities.length === 0 ? (
                <div className="text-center py-20 text-slate-300 flex flex-col items-center">
                   <MessageSquare size={48} className="opacity-10 mb-4" />
                   <p className="text-sm font-bold uppercase tracking-widest">No activities detected</p>
                </div>
              ) : (
                activities.map((act, idx) => (
                  <div key={idx} className="flex gap-4 group cursor-pointer relative">
                     <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110 shadow-sm shrink-0 ${
                           act.type === 'call' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                           act.type === 'email' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                           act.type === 'meeting' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                           'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                           {act.type === 'call' ? <Target size={18}/> : act.type === 'email' ? <MessageSquare size={18}/> : <RefreshCw size={18}/>}
                        </div>
                        {idx !== activities.length - 1 && <div className="w-px h-full bg-slate-100 mt-2"></div>}
                     </div>
                     <div className="flex-1 pb-6 border-b border-slate-50 last:border-0">
                        <div className="flex justify-between items-start mb-1">
                           <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors uppercase tracking-tight">{act.contactCompany}</h4>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{act.date.split(',')[0]}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">{act.description}</p>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, color }: any) => {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        red: 'bg-red-50 text-red-600 border-red-100'
    };
    return (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorClasses[color]} transition-transform group-hover:scale-110`}>{icon}</div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter mt-1">{value}</h3>
                </div>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">{sub}</p>
        </div>
    );
};

export default Dashboard;
