
import React, { useState, useEffect } from 'react';
import { Globe, Save, CheckCircle, Shield, Layers, Server, Key, ShieldCheck, Image, Share2, Database, HardDrive, Cpu, Zap, Wifi, AlertTriangle, RefreshCw, Trash2, Linkedin, Instagram, Facebook, Twitter, Smartphone, ExternalLink } from 'lucide-react';
import { AuditLog, Integration, AgencyBranding } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SettingsProps {
  branding: AgencyBranding;
  onUpdateBranding: (branding: AgencyBranding) => void;
}

const Settings: React.FC<SettingsProps> = ({ branding, onUpdateBranding }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [successMsg, setSuccessMsg] = useState('');
  const [hasSelectedKey, setHasSelectedKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

  useEffect(() => {
    const check = async () => {
      if ((window as any).aistudio) {
        setHasSelectedKey(await (window as any).aistudio.hasSelectedApiKey());
      }
      setIsCheckingKey(false);
    };
    check();
  }, []);

  const handleOpenKeyPicker = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasSelectedKey(true);
      setSuccessMsg('Neural core linked.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSave = () => {
    setSuccessMsg('Environment updated.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const auditLogs: AuditLog[] = [
    { id: 'log_1', action: 'System Deployment', target: 'Production', user: 'Admin', timestamp: 'Today, 10:42 AM', ipAddress: '192.168.1.1' },
    { id: 'log_2', action: 'API Key Handshake', target: 'Gemini-3-Pro', user: 'System', timestamp: 'Today, 09:15 AM', ipAddress: 'Localhost' },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage infrastructure, security, and neural connections.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-slate-950 text-emerald-400 shadow-lg' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}><Globe size={18} /> Branding</button>
            <button onClick={() => setActiveTab('ai')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'ai' ? 'bg-slate-950 text-emerald-400 shadow-lg' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}><Zap size={18} /> AI Layer</button>
            <button onClick={() => setActiveTab('infrastructure')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'infrastructure' ? 'bg-slate-950 text-emerald-400 shadow-lg' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}><Server size={18} /> Infrastructure</button>
            <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-slate-950 text-emerald-400 shadow-lg' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}><Shield size={18} /> Security</button>
          </nav>
        </div>

        <div className="flex-1">
          {successMsg && <div className="mb-6 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-bold border border-emerald-200 animate-fade-in shadow-sm"><CheckCircle size={16} /> {successMsg}</div>}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
            {activeTab === 'general' && (
              <div className="p-8 space-y-8">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Agency Identity</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Agency Name</label>
                        <input type="text" value={branding.name} onChange={e => onUpdateBranding({...branding, name: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Brand Accent</label>
                        <input type="color" value={branding.primaryColor} onChange={e => onUpdateBranding({...branding, primaryColor: e.target.value})} className="w-full h-12 p-1 rounded-xl border border-slate-200 cursor-pointer" />
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button onClick={handleSave} className="bg-slate-950 hover:bg-slate-900 text-emerald-400 font-black py-3 px-8 rounded-xl transition-all flex items-center gap-2"><Save size={18} /> Save</button>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
                <div className="p-8 flex flex-col items-center text-center animate-fade-in">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl transition-all ${hasSelectedKey ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-200 text-slate-400'}`}>
                        {isCheckingKey ? <RefreshCw className="animate-spin" size={32} /> : hasSelectedKey ? <ShieldCheck size={40} /> : <Key size={40} />}
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2">{hasSelectedKey ? 'Neural Engine Active' : 'AI Bridge Required'}</h4>
                    <p className="text-sm text-slate-600 max-w-sm mb-8">Nexus uses Gemini 3 for strategic underwriting and voice-based closing coaching.</p>
                    <button onClick={handleOpenKeyPicker} className="bg-slate-900 text-white py-4 px-10 rounded-xl font-black text-sm hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl"><Key size={18} className="text-emerald-400" /> {hasSelectedKey ? 'Manage Secure Enclave' : 'Connect API Key'}</button>
                </div>
            )}

            {activeTab === 'infrastructure' && (
              <div className="p-8 space-y-8 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">System Health</h3>
                        <p className="text-xs text-slate-500 font-medium">Real-time status of the Nexus Intelligence core.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <Wifi size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Operational</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3"><Database size={20} className="text-blue-600" /><h4 className="font-black text-slate-800 text-sm">PostgreSQL</h4></div>
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between"><span className="text-slate-500">Latency</span><span className="font-bold">12ms</span></div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden"><div className="bg-blue-600 h-full w-[15%]"></div></div>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3"><Cpu size={20} className="text-purple-600" /><h4 className="font-black text-slate-800 text-sm">Neural Core</h4></div>
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between"><span className="text-slate-500">Daily Tokens</span><span className="font-bold">14.2k / 1M</span></div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden"><div className="bg-purple-600 h-full w-[2%]"></div></div>
                        </div>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
               <div className="p-8 space-y-8 animate-fade-in">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <tr><th className="px-6 py-4">Action</th><th className="px-6 py-4">Target</th><th className="px-6 py-4 text-right">Time</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                           {auditLogs.map(log => (
                              <tr key={log.id} className="text-slate-600 hover:bg-slate-50 transition-colors">
                                 <td className="px-6 py-4 font-bold text-slate-800">{log.action}</td>
                                 <td className="px-6 py-4">{log.target}</td>
                                 <td className="px-6 py-4 text-right font-medium">{log.timestamp}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
