
import React, { useState } from 'react';
import { Contact, Lender, ApplicationSubmission } from '../types';
/* Added ArrowRight to imports */
import { Send, CheckCircle, Clock, AlertTriangle, FileText, Upload, RefreshCw, Briefcase, ChevronRight, Play, Check, ArrowRight } from 'lucide-react';
import * as geminiService from '../services/geminiService';

const MOCK_LENDERS: Lender[] = [
  { id: 'l_bluevine', name: 'Bluevine', logo: '🟦', type: 'Fintech', minScore: 625, minRevenue: 10000, minTimeInBusinessMonths: 6, maxAmount: 250000, description: 'Fast LOC', applicationLink: '#' },
  { id: 'l_chase', name: 'Chase Ink', logo: '🏦', type: 'Bank', minScore: 700, minRevenue: 0, minTimeInBusinessMonths: 0, maxAmount: 100000, description: 'Business Credit Card', applicationLink: '#' },
  { id: 'l_ondeck', name: 'OnDeck', logo: '🟧', type: 'Fintech', minScore: 600, minRevenue: 8500, minTimeInBusinessMonths: 12, maxAmount: 150000, description: 'Term Loans', applicationLink: '#' },
  { id: 'l_kapitus', name: 'Kapitus', logo: '🟩', type: 'Fintech', minScore: 550, minRevenue: 25000, minTimeInBusinessMonths: 24, maxAmount: 500000, description: 'Flexible Funding', applicationLink: '#' }
];

interface ApplicationSubmitterProps {
  contacts: Contact[];
  onUpdateContact: (contact: Contact) => void;
}

const ApplicationSubmitter: React.FC<ApplicationSubmitterProps> = ({ contacts, onUpdateContact }) => {
  const [activeTab, setActiveTab] = useState<'new' | 'tracker'>('new');
  const [step, setStep] = useState(1);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedLenderIds, setSelectedLenderIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPackets, setGeneratedPackets] = useState<ApplicationSubmission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allSubmissions = contacts.flatMap(c => c.submissions || []);
  const selectedContact = contacts.find(c => c.id === selectedContactId);

  const handleToggleLender = (id: string) => {
    setSelectedLenderIds(prev => prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]);
  };

  const handleGeneratePackets = async () => {
    if (!selectedContact || selectedLenderIds.length === 0) return;
    setIsGenerating(true);
    const newPackets: ApplicationSubmission[] = [];
    for (const lenderId of selectedLenderIds) {
      const lender = MOCK_LENDERS.find(l => l.id === lenderId);
      if (lender) {
        const coverLetter = await geminiService.generateApplicationCoverLetter(selectedContact, lender.name);
        newPackets.push({
          id: `sub_${Date.now()}_${lenderId}`,
          contactId: selectedContact.id,
          contactName: selectedContact.company,
          lenderId: lender.id,
          lenderName: lender.name,
          status: 'Draft',
          dateSent: new Date().toLocaleDateString(),
          coverLetter: coverLetter
        });
      }
    }
    setGeneratedPackets(newPackets);
    setIsGenerating(false);
    setStep(3);
  };

  const handleSubmitAll = () => {
    if (!selectedContact) return;
    setIsSubmitting(true);
    setTimeout(() => {
        const sentPackets = generatedPackets.map(p => ({ ...p, status: 'Sent' as const }));
        onUpdateContact({
            ...selectedContact,
            submissions: [...(selectedContact.submissions || []), ...sentPackets],
            status: 'Active',
            activities: [...(selectedContact.activities || []), { id: `act_sub_${Date.now()}`, type: 'system', description: `Submitted applications to ${selectedLenderIds.length} lenders.`, date: new Date().toLocaleString(), user: 'Admin' }]
        });
        setIsSubmitting(false);
        alert("Applications submitted!");
        setStep(1);
        setSelectedContactId('');
        setSelectedLenderIds([]);
        setGeneratedPackets([]);
        setActiveTab('tracker');
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="p-4 md:p-0 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">App Submitter</h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">Multi-lender Submission Engine</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto shadow-inner">
           <button onClick={() => setActiveTab('new')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>New Application</button>
           <button onClick={() => setActiveTab('tracker')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tracker' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Tracker</button>
        </div>
      </div>

      {activeTab === 'new' && (
        <div className="bg-white md:border md:border-slate-200 rounded-3xl md:shadow-sm overflow-hidden flex flex-col md:flex-row flex-1">
           <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-4 overflow-x-auto no-scrollbar">
              <div className="flex md:flex-col items-center md:items-start gap-6">
                 <StepIndicator n={1} label="Deal" current={step} />
                 <StepDivider />
                 <StepIndicator n={2} label="Lenders" current={step} />
                 <StepDivider />
                 <StepIndicator n={3} label="Review" current={step} />
              </div>
           </div>

           <div className="flex-1 p-6 md:p-10 overflow-y-auto">
              {step === 1 && (
                 <div className="space-y-6 animate-fade-in">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Select Target Deal</h3>
                    <div className="grid grid-cols-1 gap-3">
                       {contacts.filter(c => ['Lead', 'Active', 'Negotiation'].includes(c.status)).map(contact => (
                          <button 
                            key={contact.id}
                            onClick={() => setSelectedContactId(contact.id)}
                            className={`w-full p-5 rounded-2xl border-2 text-left transition-all relative ${selectedContactId === contact.id ? 'border-blue-500 bg-blue-50/50 shadow-lg' : 'border-slate-100 hover:border-slate-300'}`}
                          >
                             <div className="flex justify-between items-center">
                                <h3 className="font-black text-slate-900 uppercase tracking-tight">{contact.company}</h3>
                                {selectedContactId === contact.id && <div className="bg-blue-600 text-white rounded-full p-1"><Check size={12}/></div>}
                             </div>
                             <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">${contact.revenue?.toLocaleString()}/mo Revenue</p>
                          </button>
                       ))}
                    </div>
                    <div className="pt-8">
                       <button disabled={!selectedContactId} onClick={() => setStep(2)} className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2">Next Step <ArrowRight size={16} /></button>
                    </div>
                 </div>
              )}

              {step === 2 && (
                 <div className="space-y-6 animate-fade-in">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Choose Funding Partners</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {MOCK_LENDERS.map(lender => (
                          <button 
                            key={lender.id}
                            onClick={() => handleToggleLender(lender.id)}
                            className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${selectedLenderIds.includes(lender.id) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-300'}`}
                          >
                             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm border border-slate-100">{lender.logo}</div>
                             <div className="flex-1">
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">{lender.name}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lender.type}</p>
                             </div>
                             {selectedLenderIds.includes(lender.id) && <CheckCircle size={20} className="text-emerald-500" />}
                          </button>
                       ))}
                    </div>
                    <div className="flex gap-4 pt-8">
                       <button onClick={() => setStep(1)} className="px-6 text-xs font-black uppercase tracking-widest text-slate-400">Back</button>
                       <button disabled={selectedLenderIds.length === 0 || isGenerating} onClick={handleGeneratePackets} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                          {isGenerating ? <RefreshCw className="animate-spin" size={16}/> : 'Generate AI Cover Letters'}
                       </button>
                    </div>
                 </div>
              )}

              {step === 3 && (
                 <div className="space-y-6 animate-fade-in">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Underwriter Review</h3>
                    <div className="space-y-4">
                       {generatedPackets.map((packet, idx) => (
                          <div key={idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                             <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                               {MOCK_LENDERS.find(l=>l.id===packet.lenderId)?.logo} {packet.lenderName} Packet
                             </h4>
                             <textarea className="w-full h-32 p-4 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-emerald-500 outline-none" defaultValue={packet.coverLetter} />
                          </div>
                       ))}
                    </div>
                    <div className="flex gap-4 pt-8">
                       <button onClick={() => setStep(2)} className="px-6 text-xs font-black uppercase tracking-widest text-slate-400">Back</button>
                       <button onClick={handleSubmitAll} disabled={isSubmitting} className="flex-1 bg-emerald-500 text-slate-950 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95">
                          {isSubmitting ? <RefreshCw className="animate-spin" size={16}/> : <Send size={16}/>} Submit All
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'tracker' && (
        <div className="bg-white md:border md:border-slate-200 rounded-3xl overflow-hidden shadow-sm flex-1">
           <div className="p-6 border-b border-slate-100 bg-slate-50"><h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Active Submissions</h3></div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <tr><th className="px-6 py-4">Borrower</th><th className="px-6 py-4">Lender</th><th className="px-6 py-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {allSubmissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-5 font-black text-slate-800 text-xs uppercase">{sub.contactName}</td>
                         <td className="px-6 py-5 text-slate-500 text-[10px] font-black uppercase">{sub.lenderName}</td>
                         <td className="px-6 py-5">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${sub.status === 'Sent' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{sub.status}</span>
                         </td>
                      </tr>
                   ))}
                   {allSubmissions.length === 0 && <tr><td colSpan={3} className="p-20 text-center text-xs font-black text-slate-300 uppercase tracking-widest">No active submissions</td></tr>}
                </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

const StepIndicator = ({ n, label, current }: any) => (
  <div className={`flex items-center gap-3 shrink-0 ${current >= n ? 'text-slate-900' : 'text-slate-300'}`}>
     <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border-2 transition-all ${current >= n ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-300'}`}>{n}</div>
     <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">{label}</span>
  </div>
);

const StepDivider = () => <div className="hidden md:block w-px h-8 bg-slate-200 ml-4"></div>;

export default ApplicationSubmitter;
