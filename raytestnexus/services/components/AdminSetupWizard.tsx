
import React from 'react';
import { Rocket, BrainCircuit, Layout, Briefcase, Users, Layers, ArrowRight, CheckCircle, Clock, ShieldCheck, Key, Globe, Plus } from 'lucide-react';
import { ViewMode } from '../../types';

interface AdminSetupWizardProps {
  onNavigate: (view: ViewMode) => void;
  setupProgress?: number;
}

const AdminSetupWizard: React.FC<AdminSetupWizardProps> = ({ onNavigate, setupProgress = 0 }) => {
  const steps = [
    {
      id: 'ai',
      title: 'Initialize AI Intelligence',
      desc: 'Connect your Google Gemini API Key to enable automated underwriting and voice coaching.',
      icon: BrainCircuit,
      action: () => onNavigate(ViewMode.SETTINGS),
      required: true,
      label: 'AI Core',
      color: 'text-purple-500'
    },
    {
      id: 'branding',
      title: 'Configure Agency Identity',
      desc: 'Set your logo, brand colors, and landing page headlines in the Site Builder.',
      icon: Layout,
      action: () => onNavigate(ViewMode.ADMIN_CMS),
      required: true,
      label: 'Branding',
      color: 'text-blue-500'
    },
    {
      id: 'lenders',
      title: 'Build Lender Marketplace',
      desc: 'Upload your first rate sheet or add lending partners to start matching deals.',
      icon: Briefcase,
      action: () => onNavigate(ViewMode.LENDERS),
      required: true,
      label: 'Marketplace',
      color: 'text-emerald-500'
    },
    {
      id: 'crm',
      title: 'Seed Your Pipeline',
      desc: 'Import your existing contacts via CSV or use Lead Scout to find new opportunities.',
      icon: Users,
      action: () => onNavigate(ViewMode.CRM),
      required: true,
      label: 'Pipeline',
      color: 'text-orange-500'
    },
    {
      id: 'integrations',
      title: 'Connect CRM Bridges',
      desc: 'Sync data with HubSpot or Salesforce to centralize your entire operations.',
      icon: Layers,
      action: () => onNavigate(ViewMode.SETTINGS),
      required: false,
      label: 'Integrations',
      color: 'text-indigo-500'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 animate-fade-in">
      <div className="bg-slate-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden mb-8 border border-white/5">
         <div className="absolute top-0 right-0 p-8 opacity-10"><Rocket size={200} /></div>
         <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-emerald-500/20">
               Nexus OS Onboarding
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase">Launch Your Agency</h1>
            <p className="text-slate-400 max-w-xl text-lg leading-relaxed font-medium">
               Welcome, Operator. Follow these critical paths to initialize your funding platform and activate the AI Intelligence Layer.
            </p>
         </div>
      </div>

      <div className="space-y-4">
         {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.id} 
                onClick={step.action}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group"
              >
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                       <Icon size={28} className={step.color} />
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Step {idx + 1}</span>
                          <h3 className="font-bold text-slate-900">{step.title}</h3>
                          {step.required && <span className="text-[10px] font-black text-red-500 uppercase">Required</span>}
                       </div>
                       <p className="text-sm text-slate-500 max-w-lg">{step.desc}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
                       <ArrowRight size={24} />
                    </div>
                 </div>
              </div>
            );
         })}
      </div>

      <div className="mt-12 bg-blue-50 rounded-2xl p-6 border border-blue-100 flex items-start gap-4">
         <ShieldCheck className="text-blue-600 mt-1" size={24} />
         <div>
            <h4 className="font-bold text-blue-900">Operator Tip: Secure Enclaves</h4>
            <p className="text-sm text-blue-800 leading-relaxed mt-1">
               Your API keys are never stored as plain text. Once you set your Gemini key in Settings, the platform creates a hardware-level secure session that persists only for your authenticated agency environment.
            </p>
         </div>
      </div>
    </div>
  );
};

export default AdminSetupWizard;
