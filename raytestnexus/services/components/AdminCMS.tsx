
import React, { useState } from 'react';
import { AgencyBranding, ViewMode } from '../types';
import { Layout, Palette, Type, Globe, Save, CheckCircle, RefreshCw, Smartphone, Monitor, Code, Settings, Share2, ArrowRight } from 'lucide-react';

interface AdminCMSProps {
  branding: AgencyBranding;
  onUpdateBranding: (branding: AgencyBranding) => void;
}

const AdminCMS: React.FC<AdminCMSProps> = ({ branding, onUpdateBranding }) => {
  const [localBranding, setLocalBranding] = useState<AgencyBranding>(branding);
  const [successMsg, setSuccessMsg] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const handleSave = () => {
    onUpdateBranding(localBranding);
    setSuccessMsg('Website content published successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Layout className="text-blue-600" size={32} /> No-Code Site Builder
          </h1>
          <p className="text-slate-500 mt-2">Manage your marketing presence and portal branding.</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 transition-all transform hover:scale-105"
        >
          <Save size={18} /> Publish Changes
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-bold border border-emerald-200 animate-fade-in">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-4 mb-4">
              <Palette size={20} className="text-blue-500" /> Branding & Style
            </h3>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Agency Name</label>
              <input 
                type="text" 
                value={localBranding.name} 
                onChange={(e) => setLocalBranding({ ...localBranding, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Brand Accent Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={localBranding.primaryColor} 
                  onChange={(e) => setLocalBranding({ ...localBranding, primaryColor: e.target.value })}
                  className="w-12 h-12 rounded border border-slate-300 cursor-pointer p-1"
                />
                <span className="text-sm font-mono text-slate-500">{localBranding.primaryColor}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-4 mb-4">
              <Type size={20} className="text-purple-500" /> Landing Page Content
            </h3>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Hero Headline</label>
              <textarea 
                value={localBranding.heroHeadline || "The Operating System for Business Funding."}
                onChange={(e) => setLocalBranding({ ...localBranding, heroHeadline: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 h-24 resize-none text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Hero Subheadline</label>
              <textarea 
                value={localBranding.heroSubheadline || "Nexus consolidates your CRM, Marketing, and Underwriting into one platform."}
                onChange={(e) => setLocalBranding({ ...localBranding, heroSubheadline: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 h-24 resize-none text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 text-white space-y-4 shadow-xl">
             <h3 className="font-bold flex items-center gap-2 text-blue-400"><Code size={18} /> SEO & Global</h3>
             <p className="text-xs text-slate-400">Configure search engine metadata and analytics scripts.</p>
             <button className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-bold transition-colors">Edit Sitemap</button>
             <button className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-bold transition-colors">Google Analytics Config</button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
           <div className="flex justify-between items-center bg-slate-100 p-2 rounded-lg border border-slate-200">
              <div className="flex gap-2">
                 <button 
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                 >
                   <Monitor size={18} />
                 </button>
                 <button 
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                 >
                   <Smartphone size={18} />
                 </button>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Preview</span>
              <div className="w-20"></div>
           </div>

           <div className={`bg-slate-200 rounded-2xl border-4 border-slate-300 overflow-hidden shadow-inner flex justify-center transition-all duration-500 ${previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : 'w-full'}`}>
              <div className="w-full bg-white min-h-[600px] overflow-y-auto pointer-events-none origin-top scale-95">
                 {/* Mini Landing Page Preview */}
                 <nav className="p-4 flex justify-between items-center border-b">
                    <div className="font-bold flex items-center gap-1">
                       <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-[10px]">N</div>
                       {localBranding.name}
                    </div>
                    <div className="flex gap-4 text-[10px] font-bold text-slate-500">
                       <span>Features</span>
                       <span>Pricing</span>
                       <span className="bg-blue-600 text-white px-2 py-0.5 rounded">Sign Up</span>
                    </div>
                 </nav>
                 <div className="p-12 text-center bg-slate-50 border-b">
                    <h1 className="text-4xl font-black mb-4 leading-tight text-slate-900">
                       {localBranding.heroHeadline || "The Operating System for Business Funding."}
                    </h1>
                    <p className="text-lg text-slate-500 mb-8 max-w-lg mx-auto">
                       {localBranding.heroSubheadline || "Nexus consolidates your CRM, Marketing, and Underwriting into one platform."}
                    </p>
                    <button className="px-8 py-3 rounded-xl font-bold text-white shadow-lg" style={{ backgroundColor: localBranding.primaryColor }}>
                       Get Started Now
                    </button>
                 </div>
                 <div className="p-8 grid grid-cols-3 gap-4">
                    {[1,2,3].map(i => (
                       <div key={i} className="p-4 border rounded-xl bg-white shadow-sm text-center">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 mx-auto mb-2"></div>
                          <div className="h-2 bg-slate-100 rounded mb-1"></div>
                          <div className="h-2 bg-slate-100 rounded w-1/2 mx-auto"></div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCMS;
