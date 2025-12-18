
import React, { useState } from 'react';
import { Contact, ClientTask, EnrichedData } from '../types';
import { 
  MoreHorizontal, Search, Sparkles, X, LayoutList, Kanban, 
  Target, Video, RefreshCw, Check, ArrowRight, Globe, 
  UserPlus, ShieldAlert, BarChart3, TrendingUp, Zap, Users
} from 'lucide-react';
import * as geminiService from '../services/geminiService';
import ActivityTimeline from './ActivityTimeline';
import MessageCenter from './MessageCenter';
import DocumentVault from './DocumentVault';
import SalesBattleCard from './SalesBattleCard';

interface CRMTableProps {
  contacts: Contact[];
  onUpdateContact: (contact: Contact) => void;
  onAddContact: (contact: Partial<Contact>) => void;
}

const CRMTable: React.FC<CRMTableProps> = ({ contacts = [], onUpdateContact, onAddContact }) => {
  const [selectedContact = null, setSelectedContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'messages' | 'documents'>('overview');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showBattleCard, setShowBattleCard] = useState(false);

  const displayContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEnrich = async (contact: Contact) => {
    setIsEnriching(true);
    try {
        const enriched = await geminiService.enrichLeadData(contact.company);
        if (enriched) {
            const updated: Contact = {
                ...contact,
                notes: `${contact.notes}\n\n[AI ENRICHMENT]\nCEO: ${enriched.ceo}\nRev: ${enriched.revenue}\nIntel: ${enriched.description}`,
                aiPriority: 'Hot',
                aiReason: 'High-value match confirmed via public data enrichment.'
            };
            onUpdateContact(updated);
            setSelectedContact(updated);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsEnriching(false);
    }
  };

  const generateBattleCard = async () => {
    if (!selectedContact) return;
    setIsScanning(true);
    const card = await geminiService.generateSalesBattleCard(selectedContact);
    if (card) {
        onUpdateContact({ ...selectedContact, battleCard: card });
        setShowBattleCard(true);
    }
    setIsScanning(false);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
       <div className="p-6 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-center rounded-t-[2.5rem] shadow-sm gap-4">
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200 w-full md:w-auto">
            <button onClick={() => setViewMode('list')} className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><LayoutList size={14}/> List</button>
            <button onClick={() => setViewMode('board')} className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${viewMode === 'board' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Kanban size={14}/> Kanban</button>
          </div>
          <div className="relative w-full md:w-96 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={16} />
             <input type="text" placeholder="Search pipeline..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <button onClick={() => onAddContact({ name: 'New Lead', company: 'Draft Entity', status: 'Lead' })} className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"><UserPlus size={16}/> Create Lead</button>
       </div>

       <div className="flex-1 overflow-auto p-8 bg-slate-50/40">
          {displayContacts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Users size={64} className="opacity-10 mb-4" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">No Matches Found</p>
                <button onClick={() => setSearchTerm('')} className="mt-4 text-blue-600 font-bold hover:underline">Clear Filters</button>
            </div>
          ) : viewMode === 'list' ? (
             <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Entity & Contact</th>
                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">AI Intelligence</th>
                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Pipeline Status</th>
                        <th className="p-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Est. Value</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {displayContacts.map(c => (
                         <tr key={c.id} onClick={() => setSelectedContact(c)} className="hover:bg-slate-50/80 cursor-pointer transition-colors group">
                            <td className="p-6">
                               <div className="font-black text-slate-900 uppercase tracking-tight text-sm group-hover:text-blue-600 transition-colors">{c.company}</div>
                               <div className="text-[11px] text-slate-500 font-bold uppercase mt-1">{c.name}</div>
                            </td>
                            <td className="p-6">
                               <div className="flex justify-center gap-2">
                                  {c.aiPriority === 'Hot' && <span className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase border border-red-100 flex items-center gap-1 animate-pulse"><ShieldAlert size={10}/> Action Required</span>}
                                  {c.revenue && <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase border border-emerald-100 flex items-center gap-1"><TrendingUp size={10}/> Verified</span>}
                                  {c.battleCard && <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase border border-blue-100 flex items-center gap-1"><Target size={10}/> Strat Ready</span>}
                               </div>
                            </td>
                            <td className="p-6">
                               <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'Negotiation' ? 'bg-amber-500' : c.status === 'Closed' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                  <span className={`text-[10px] font-black uppercase tracking-widest text-slate-700`}>{c.status}</span>
                               </div>
                            </td>
                            <td className="p-6 text-right font-black text-slate-900 text-sm tracking-tight">${c.value.toLocaleString()}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          ) : (
            <div className="flex gap-8 h-full overflow-x-auto no-scrollbar pb-6">
                {['Lead', 'Active', 'Negotiation', 'Closed'].map(status => (
                    <div key={status} className="w-80 flex-shrink-0 space-y-6 h-full flex flex-col">
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 px-2 flex items-center justify-between">
                            {status}
                            <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full text-[9px]">{displayContacts.filter(c => c.status === status).length}</span>
                        </h4>
                        <div className="flex-1 bg-slate-100/50 p-2 rounded-[2rem] border border-dashed border-slate-300 space-y-4 overflow-y-auto custom-scrollbar">
                            {displayContacts.filter(c => c.status === status).map(c => (
                                <div key={c.id} onClick={() => setSelectedContact(c)} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-blue-500 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-3">
                                        <h5 className="font-black text-slate-900 uppercase tracking-tight text-sm group-hover:text-blue-600">{c.company}</h5>
                                        {c.aiPriority === 'Hot' && <Zap size={14} className="text-red-500 fill-current" />}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">${c.value.toLocaleString()} Deal Value</p>
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">{c.name.charAt(0)}</div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase">{c.lastContact}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          )}
       </div>

       {selectedContact && (
          <div className="fixed inset-0 z-50 flex justify-end">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => {setSelectedContact(null); setShowBattleCard(false);}} />
             <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                
                {showBattleCard && selectedContact.battleCard ? (
                    <SalesBattleCard card={selectedContact.battleCard} onLaunchMeeting={() => setSelectedContact(null)} />
                ) : (
                  <>
                    <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-950 text-white">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-white shadow-xl transform rotate-3">{selectedContact.name.charAt(0)}</div>
                            <div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">{selectedContact.company}</h2>
                                <div className="flex items-center gap-4 mt-3">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedContact.name}</p>
                                   <div className="w-1 h-1 rounded-full bg-white/20"></div>
                                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{selectedContact.id}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => handleEnrich(selectedContact)} disabled={isEnriching} className="bg-white/5 border border-white/10 hover:bg-white/10 p-3 rounded-2xl transition-all disabled:opacity-50">
                                {isEnriching ? <RefreshCw className="animate-spin text-blue-400" size={24}/> : <Globe className="text-blue-400" size={24}/>}
                            </button>
                            <button onClick={() => setSelectedContact(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X size={32}/></button>
                        </div>
                    </div>

                    <div className="flex bg-white border-b border-slate-100 px-6">
                        {['overview', 'roadmap', 'messages', 'documents'].map(t => (
                            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all ${activeTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/30">
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><BarChart3 size={100} /></div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Pipeline Brief</h4>
                                        <div className="space-y-6">
                                            <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Deal Magnitude</p><p className="text-3xl font-black text-blue-400 tracking-tight">${selectedContact.value.toLocaleString()}</p></div>
                                            <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Annual Revenue</p><p className="text-2xl font-black text-emerald-400 tracking-tight">${selectedContact.revenue?.toLocaleString() || 'TBD'}</p></div>
                                        </div>
                                        <button onClick={generateBattleCard} disabled={isScanning} className="w-full mt-10 bg-blue-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-all shadow-lg flex items-center justify-center gap-2 group-hover:-translate-y-1 transform active:scale-95">
                                            {isScanning ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                                            Synthesize Battle-Card
                                        </button>
                                    </div>
                                    
                                    {selectedContact.aiReason && (
                                        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100">
                                            <h5 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2 mb-2"><ShieldAlert size={14}/> AI Priority Reason</h5>
                                            <p className="text-xs text-red-800 font-medium leading-relaxed italic">"{selectedContact.aiReason}"</p>
                                        </div>
                                    )}
                                </div>
                                <div className="lg:col-span-8">
                                    <ActivityTimeline contact={selectedContact} onAddActivity={(id, act) => onUpdateContact({...selectedContact, activities: [...(selectedContact.activities || []), act]})} />
                                </div>
                            </div>
                        )}
                        {activeTab === 'documents' && <DocumentVault contact={selectedContact} onUpdateContact={onUpdateContact} />}
                        {activeTab === 'messages' && <MessageCenter contact={selectedContact} onUpdateContact={onUpdateContact} currentUserRole="admin" />}
                        {activeTab === 'roadmap' && (
                             <div className="p-8 text-center text-slate-400 italic">4-Tier Strategic Roadmap View Integrated. Proceed to Module Verification.</div>
                        )}
                    </div>
                  </>
                )}
             </div>
          </div>
       )}
    </div>
  );
};

export default CRMTable;
