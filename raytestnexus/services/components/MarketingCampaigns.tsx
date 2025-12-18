
import React, { useState, useEffect } from 'react';
import { Contact, MarketingAutomation, SocialPost, AgencyBranding } from '../types';
import { 
  Zap, Mail, Sparkles, Video, Instagram, Linkedin, Smartphone, 
  RefreshCw, Film, Wand2, CheckCircle, Share2, Play, 
  AlertCircle, Layout, Plus, Trash2, Calendar, Smartphone as TikTokIcon, Key, ExternalLink,
  AlertTriangle
} from 'lucide-react';
import * as geminiService from '../services/geminiService';

interface MarketingCampaignsProps {
  contacts: Contact[];
  branding: AgencyBranding;
  onUpdateContact?: (contact: Contact) => void;
}

const MarketingCampaigns: React.FC<MarketingCampaignsProps> = ({ contacts, branding, onUpdateContact }) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'automation' | 'gallery'>('studio');
  
  // Studio State
  const [videoPrompt, setVideoPrompt] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'TikTok' | 'Instagram' | 'LinkedIn' | 'Facebook'>('TikTok');
  const [isGenerating, setIsGenerating] = useState(false);
  const [neuralStatus, setNeuralStatus] = useState('');
  const [generatedPost, setGeneratedPost] = useState<SocialPost | null>(null);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyPicker = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleGenerateContent = async () => {
    if (!videoPrompt) return;
    
    // Mandatory Key Check for Veo
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      if (!selected) {
        await window.aistudio.openSelectKey();
        setHasKey(true);
        // Assume success and proceed as per instructions
      }
    }
    
    setIsGenerating(true);
    setGeneratedPost(null);
    
    const aspectRatio = ['TikTok', 'Instagram'].includes(selectedPlatform) ? '9:16' : '16:9';
    
    const statusCycle = [
      "Connecting to Neural Core...",
      "Synthesizing Visual Narrative...",
      "Rendering Cinematic Frames (Veo 3.1)...",
      "Drafting Strategic Caption...",
      "Finalizing Visual Enclave..."
    ];
    
    let i = 0;
    const interval = setInterval(() => {
      setNeuralStatus(statusCycle[i % statusCycle.length]);
      i++;
    }, 5000);

    try {
      const videoUrl = await geminiService.generateSocialVideo(videoPrompt, aspectRatio);
      const caption = await geminiService.generateSocialCaption(selectedPlatform, videoPrompt);

      if (videoUrl) {
        const newPost: SocialPost = {
          id: `post_${Date.now()}`,
          platform: selectedPlatform,
          content: caption,
          videoUrl,
          status: 'Ready',
          aspectRatio
        };
        setGeneratedPost(newPost);
      }
    } catch (e: any) {
      if (e.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        alert("Session expired. Please re-select your API key.");
        await window.aistudio?.openSelectKey();
      } else {
        alert("Neural synthesis failed. Ensure you have a paid GCP project linked.");
      }
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
      setNeuralStatus('');
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
            <Film className="text-blue-600" size={36} /> Content Engine
          </h1>
          <p className="text-slate-500 font-medium mt-1">Autonomous text-to-video studio and social automations.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200">
           {[
             { id: 'studio', label: 'AI Studio', icon: <Wand2 size={16}/> },
             { id: 'automation', label: 'Workflows', icon: <Zap size={16}/> },
             { id: 'gallery', label: 'Vault', icon: <Layout size={16}/> }
           ].map(tab => (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
                {tab.icon} {tab.label}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
           <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col h-fit">
              <div className="mb-8">
                 <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-100">
                    <Sparkles size={12} /> Powered by Veo 3.1
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Cinematic Synthesis</h2>
                 {!hasKey && (
                   <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                      <p className="text-xs text-amber-800 font-bold flex items-center gap-2 mb-2">
                        {/* Fix: Added AlertTriangle to imports from lucide-react */}
                        <AlertTriangle size={14} /> Paid API Key Required
                      </p>
                      <p className="text-[10px] text-amber-700 leading-relaxed mb-3">
                        Veo video generation requires a paid Google Cloud project. 
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline ml-1 inline-flex items-center gap-0.5">Billing Docs <ExternalLink size={8}/></a>
                      </p>
                      <button onClick={handleOpenKeyPicker} className="w-full py-2 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2">
                        <Key size={12} /> Select API Key
                      </button>
                   </div>
                 )}
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Platform</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['TikTok', 'Instagram', 'LinkedIn', 'Facebook'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setSelectedPlatform(p)}
                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex flex-col items-center gap-2 ${selectedPlatform === p ? 'bg-slate-950 text-white border-slate-950 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                            >
                                {p === 'TikTok' && <TikTokIcon size={16}/>}
                                {p === 'Instagram' && <Instagram size={16}/>}
                                {p === 'LinkedIn' && <Linkedin size={16}/>}
                                {p === 'Facebook' && <Share2 size={16}/>}
                                {p}
                            </button>
                        ))}
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Creative Prompt</label>
                    <textarea 
                        value={videoPrompt} 
                        onChange={(e) => setVideoPrompt(e.target.value)} 
                        placeholder="e.g. A high-end montage of a successful business owner signing a major contract..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 h-32 resize-none text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    />
                 </div>

                 <button 
                    onClick={handleGenerateContent}
                    disabled={isGenerating || !videoPrompt}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 transform active:scale-95"
                 >
                    {isGenerating ? <RefreshCw className="animate-spin" size={20}/> : <Film size={20} />}
                    {isGenerating ? 'Synthesizing...' : 'Render AI Video'}
                 </button>
              </div>
           </div>

           <div className="lg:col-span-7 flex flex-col gap-6 h-full">
              <div className="flex-1 bg-slate-950 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
                 {isGenerating ? (
                    <div className="text-center animate-fade-in px-10">
                       <div className="relative mb-10 inline-block">
                          <RefreshCw size={100} className="text-blue-500 animate-spin opacity-20" />
                          <Film size={40} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                       </div>
                       <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Neural Synthesis in Progress</h3>
                       <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                          <p className="text-blue-400 font-mono text-xs tracking-widest uppercase">{neuralStatus}</p>
                       </div>
                       <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mt-8">Estimated render time 60s</p>
                    </div>
                 ) : generatedPost ? (
                    <div className="w-full h-full flex flex-col animate-fade-in">
                        <div className="flex-1 bg-black flex items-center justify-center p-8">
                            <div className={`${generatedPost.aspectRatio === '9:16' ? 'w-64 aspect-[9/16]' : 'w-full max-w-lg aspect-video'} bg-slate-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative group`}>
                                <video 
                                    src={generatedPost.videoUrl} 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <p className="text-xs text-white line-clamp-3 font-medium opacity-90">{generatedPost.content}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-slate-900 border-t border-white/10">
                           <div className="flex justify-between items-center mb-4">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={12}/> AI-Crafted Caption
                              </h4>
                           </div>
                           <textarea 
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 h-24 resize-none outline-none focus:border-blue-500 transition-all font-medium"
                              value={generatedPost.content}
                              readOnly
                           />
                           <div className="mt-6 flex gap-4">
                              <button onClick={() => alert("Scheduled!")} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest border border-white/10 transition-all flex items-center justify-center gap-2">
                                 <Calendar size={14}/> Schedule
                              </button>
                              <button onClick={() => alert("Posted!")} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-xl">
                                 <Share2 size={14}/> Post to {generatedPost.platform}
                              </button>
                           </div>
                        </div>
                    </div>
                 ) : (
                    <div className="text-center text-slate-800">
                       <Wand2 size={80} className="mx-auto mb-6 opacity-10" />
                       <p className="text-sm font-black uppercase tracking-widest opacity-30">Studio Awaiting Input</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="space-y-8 animate-fade-in">
           <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Zap size={280} /></div>
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase leading-none">Autonomous Social Ops</h2>
                    <p className="text-slate-400 text-lg leading-relaxed mb-8 font-medium">
                        Automatically generate and post marketing content when major deal milestones are reached.
                    </p>
                    <button className="bg-emerald-500 text-slate-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl">
                        <Plus size={20} /> Create New Workflow
                    </button>
                </div>
           </div>
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
            <button 
                onClick={() => setActiveTab('studio')}
                className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 p-10 text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all group min-h-[300px]"
            >
                <Plus size={32} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">New Synthesis</span>
            </button>
        </div>
      )}
    </div>
  );
};

export default MarketingCampaigns;
