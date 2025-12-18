import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, StopCircle, Play, Sparkles, Volume2, Award, AlertCircle, BarChart3, Target, MessageSquare, Lightbulb, RefreshCw, ChevronRight, BrainCircuit, Shield, Clock, Trophy, Activity, CheckCircle } from 'lucide-react';
import { SalesSession } from '../../types';
import * as geminiService from '../services/geminiService';

const SCENARIOS = [
  {
    id: 'cold_call',
    title: 'Cold Call: The Gatekeeper',
    description: 'You are calling a construction company. The receptionist is trying to block you from speaking to the owner.',
    systemInstruction: 'You are "Sarah", a busy and slightly annoyed receptionist at a construction firm. Your goal is to screen calls. Do not let the user speak to the owner unless they give a very compelling reason or sound like a partner. Be curt but professional.'
  },
  {
    id: 'objection_price',
    title: 'Objection: "Rates are too high"',
    description: 'The client has received an offer but thinks the 1.35 factor rate is a rip-off. Explain the value.',
    systemInstruction: 'You are "Mike", a business owner. You just saw the funding offer and you are angry about the cost. You think 35% interest is crazy. You are skeptical and thinking about walking away. Demand a lower rate.'
  },
  {
    id: 'closing',
    title: 'Closing: Urgency',
    description: 'The client is stalling on signing the contract. Create urgency without being pushy.',
    systemInstruction: 'You are "David", a hesitant client. You like the deal but you want to "think about it" for a week. You are afraid of the daily payments. You need reassurance and a reason to act now.'
  }
];

// Audio Utils
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const SalesTrainer: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [status, setStatus] = useState<'idle' | 'prepping' | 'connecting' | 'active' | 'analyzing' | 'feedback'>('idle');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);
  const [feedback, setFeedback] = useState<SalesSession | null>(null);
  
  // AI Objection State
  const [objections, setObjections] = useState<{objection: string, rebuttal?: string}[]>([]);
  const [isGettingRebuttal, setIsGettingRebuttal] = useState<number | null>(null);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const handlePrepSession = async () => {
    setStatus('prepping');
    try {
        const mockContact = { 
            company: activeScenario.title, 
            revenue: 50000, 
            timeInBusiness: 24, 
            notes: activeScenario.description 
        } as any;
        
        const predicted = await geminiService.predictCommonObjections(mockContact);
        setObjections(predicted.map(o => ({ objection: o })));
    } catch (e) {
        console.error("Prep failed", e);
    } finally {
        setStatus('idle');
    }
  };

  const fetchRebuttal = async (index: number) => {
    setIsGettingRebuttal(index);
    try {
        const mockContact = { company: activeScenario.title } as any;
        const rebuttal = await geminiService.generateObjectionResponse(mockContact, objections[index].objection);
        const newObjections = [...objections];
        newObjections[index].rebuttal = rebuttal;
        setObjections(newObjections);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGettingRebuttal(null);
    }
  };

  const startSession = async () => {
    setStatus('connecting');
    setTranscript([]);
    setFeedback(null);
    currentInputTranscription.current = '';
    currentOutputTranscription.current = '';

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 24000 }); 
      audioContextRef.current = ctx;
      nextStartTimeRef.current = ctx.currentTime;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000 } });
      streamRef.current = stream;

      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const enhancedInstruction = `
        ${activeScenario.systemInstruction}
        
        STRICT PROTOCOL: During the conversation, you MUST try to work in these specific objections naturally:
        ${objections.map(o => `- ${o.objection}`).join('\n')}
        
        If the user gives a poor rebuttal, stay firm and defensive. 
        If they give a high-impact rebuttal, soften your stance and move towards a close.
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: enhancedInstruction,
          inputAudioTranscription: { model: "google-1" },
          outputAudioTranscription: { model: "google-1" }
        },
        callbacks: {
          onopen: () => {
            setStatus('active');
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolumeLevel(Math.sqrt(sum / inputData.length) * 50);

              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const buffer = await decodeAudioData(decode(audioData), audioContextRef.current, 24000, 1);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              
              const now = audioContextRef.current.currentTime;
              const start = Math.max(nextStartTimeRef.current, now);
              source.start(start);
              nextStartTimeRef.current = start + buffer.duration;
              
              source.onended = () => sourcesRef.current.delete(source);
              sourcesRef.current.add(source);
            }

            if (msg.serverContent?.outputTranscription?.text) {
               currentOutputTranscription.current += msg.serverContent.outputTranscription.text;
            }
            if (msg.serverContent?.inputTranscription?.text) {
               currentInputTranscription.current += msg.serverContent.inputTranscription.text;
            }

            if (msg.serverContent?.turnComplete) {
               if (currentInputTranscription.current) {
                 setTranscript(prev => [...prev, { role: 'user', text: currentInputTranscription.current }]);
                 currentInputTranscription.current = '';
               }
               if (currentOutputTranscription.current) {
                 setTranscript(prev => [...prev, { role: 'ai', text: currentOutputTranscription.current }]);
                 currentOutputTranscription.current = '';
               }
            }
          },
          onclose: () => setStatus('idle'),
          onerror: (err) => { console.error(err); stopSession(); }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setStatus('idle');
      alert("Session failed. Ensure mic access and API key are valid.");
    }
  };

  const stopSession = async () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (sessionRef.current) {
        try {
            const session = await sessionRef.current;
            session.close();
        } catch(e) {}
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    if (audioContextRef.current) audioContextRef.current.close();

    if (transcript.length > 0) {
      generateFeedback();
    } else {
      setStatus('idle');
    }
  };

  const generateFeedback = async () => {
    setStatus('analyzing');
    const fullText = transcript.map(t => `${t.role}: ${t.text}`).join('\n');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze this roleplay session. Goal: Handle these objections: ${objections.map(o=>o.objection).join(',')}. Transcript: ${fullText}. Return JSON: {score: number, feedback: string, duration: string}`,
        config: { responseMimeType: "application/json" }
      });
      
      const json = JSON.parse(res.text || "{}");
      setFeedback({
        id: `sess_${Date.now()}`,
        date: new Date().toLocaleDateString(),
        scenario: activeScenario.title,
        duration: json.duration || '2 mins',
        score: json.score || 75,
        feedback: json.feedback || 'Review complete.'
      });
      setStatus('feedback');
    } catch (e) {
      setStatus('idle');
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col animate-fade-in px-4">
      
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
            <Target className="text-blue-600" size={36} /> AI Combat Trainer
          </h1>
          <p className="text-slate-500 font-medium mt-1">Master objection handling with real-time neural simulation.</p>
        </div>
        {status === 'active' && (
           <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-xl border border-red-100 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-red-600 font-black text-xs uppercase tracking-widest">Live Combat</span>
           </div>
        )}
      </div>

      {(status === 'idle' || status === 'prepping') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Select Operation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SCENARIOS.map(scen => (
                <div 
                  key={scen.id} 
                  onClick={() => { setActiveScenario(scen); setObjections([]); }}
                  className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all hover:shadow-2xl relative overflow-hidden group ${activeScenario.id === scen.id ? 'border-blue-600 bg-white shadow-xl' : 'border-slate-100 bg-slate-50/50 grayscale hover:grayscale-0'}`}
                >
                  <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity ${activeScenario.id === scen.id ? 'opacity-10' : ''}`}>
                     <BrainCircuit size={100} />
                  </div>
                  <h3 className={`font-black text-xl mb-3 tracking-tight ${activeScenario.id === scen.id ? 'text-slate-900' : 'text-slate-500'}`}>{scen.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{scen.description}</p>
                  
                  {activeScenario.id === scen.id && (
                    <div className="mt-6 flex justify-end">
                      <div className="bg-blue-600 text-white rounded-full p-2 shadow-lg shadow-blue-200"><Play size={16} fill="currentColor" /></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
             <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-white/5 h-full flex flex-col">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120} /></div>
                
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Target size={18} /> Call Preparation</h3>
                
                <div className="flex-1 space-y-6">
                    {objections.length === 0 ? (
                        <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                            <BrainCircuit size={48} className="text-slate-700 mb-4" />
                            <p className="text-slate-400 text-sm font-medium mb-8">Analyze scenario to predict obstacles.</p>
                            <button 
                                onClick={handlePrepSession}
                                disabled={status === 'prepping'}
                                className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-xl active:scale-95"
                            >
                                {status === 'prepping' ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                                Analyze Scenario
                            </button>
                        </div>
                    ) : (
                        <div className="animate-fade-in space-y-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Predicted Objections</p>
                            {objections.map((obj, i) => (
                                <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3 group hover:bg-white/10 transition-all">
                                    <div className="w-5 h-5 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-[10px] shrink-0">{i+1}</div>
                                    <p className="text-sm font-bold text-slate-200 leading-tight">"{obj.objection}"</p>
                                </div>
                            ))}
                            
                            <button 
                                onClick={startSession}
                                className="w-full mt-10 bg-emerald-500 text-slate-950 px-8 py-5 rounded-[2rem] font-black uppercase text-sm tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20 transform hover:-translate-y-1 active:scale-95"
                            >
                                <Mic size={24} /> Launch Session
                            </button>
                        </div>
                    )}
                </div>
             </div>
          </div>
        </div>
      )}

      {status === 'active' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden pb-8">
          
          <div className="lg:col-span-8 bg-slate-950 rounded-[3rem] p-12 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl border border-white/5">
             <div className="relative mb-16">
                <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center shadow-[0_0_80px_rgba(79,70,229,0.5)] transition-transform duration-100 relative z-10`} style={{ transform: `scale(${1 + volumeLevel/100})` }}>
                    <Volume2 size={80} className="text-white opacity-90" />
                </div>
                <div className="absolute inset-[-20px] rounded-full border border-white/10 animate-pulse-slow"></div>
                <div className="absolute inset-[-40px] rounded-full border border-white/5 animate-pulse-slow delay-75"></div>
             </div>

             <div className="text-center max-w-md">
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">{activeScenario.title}</h2>
                <p className="text-emerald-500 text-sm font-black uppercase tracking-[0.4em] animate-pulse">Neural Link Active</p>
             </div>

             <div className="w-full mt-16 max-h-32 overflow-y-auto custom-scrollbar px-10 text-center">
                 {transcript.slice(-2).map((t, i) => (
                    <p key={i} className={`text-lg font-bold mb-3 ${t.role === 'user' ? 'text-slate-400' : 'text-blue-400'}`}>
                        {t.text}
                    </p>
                 ))}
             </div>

             <button 
                onClick={stopSession}
                className="mt-12 bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95 flex items-center gap-3"
             >
                <StopCircle size={20} /> Terminate Link
             </button>
          </div>

          <div className="lg:col-span-4 space-y-4 flex flex-col h-full overflow-y-auto custom-scrollbar">
             <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl flex-1 flex flex-col">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <BrainCircuit size={16} className="text-blue-600"/> Intel Battle-Card
                </h3>
                
                <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                   {objections.map((obj, i) => (
                      <div key={i} className={`p-4 rounded-2xl border transition-all ${obj.rebuttal ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}>
                         <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-bold text-slate-800 leading-tight">"{obj.objection}"</p>
                            {!obj.rebuttal && (
                                <button 
                                    onClick={() => fetchRebuttal(i)}
                                    disabled={isGettingRebuttal !== null}
                                    className="p-2 bg-white text-blue-600 rounded-lg shadow-sm border border-slate-200 hover:scale-110 transition-all shrink-0"
                                >
                                    {isGettingRebuttal === i ? <RefreshCw className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                                </button>
                            )}
                         </div>
                         
                         {obj.rebuttal && (
                            <div className="mt-4 pt-3 border-t border-emerald-200 animate-fade-in">
                               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                   <Lightbulb size={10} /> Neural Rebuttal
                               </p>
                               <p className="text-xs text-emerald-800 font-medium leading-relaxed italic">"{obj.rebuttal}"</p>
                            </div>
                         )}
                      </div>
                   ))}
                </div>

                <div className="mt-8 p-4 bg-slate-950 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Real-time Insight</p>
                    <div className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 animate-pulse"></div>
                        <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                            {transcript.length < 4 ? "Build rapport. Mirror the client's tone." : "Address the objection before they repeat it."}
                        </p>
                    </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {status === 'analyzing' && (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 rounded-[3rem] text-white">
           <div className="relative mb-8">
              <RefreshCw className="animate-spin text-blue-500" size={80} />
              <Sparkles size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
           </div>
           <h3 className="text-3xl font-black tracking-tight uppercase">Quantifying Performance...</h3>
           <p className="text-slate-500 font-mono mt-4">Running sentiment audit and objection score...</p>
        </div>
      )}

      {status === 'feedback' && feedback && (
        <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-2xl p-12 overflow-y-auto animate-fade-in">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8 border-b border-slate-100 pb-8">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{feedback.scenario} Review</h2>
                <div className="flex gap-4 mt-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> {feedback.duration}</span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle size={14}/> {feedback.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                 <div className="text-center">
                    <div className={`text-6xl font-black ${feedback.score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{feedback.score}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Combat Rating</div>
                 </div>
                 <div className={`p-4 rounded-2xl ${feedback.score > 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {feedback.score > 80 ? <Trophy size={40} /> : <BarChart3 size={40} />}
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 relative overflow-hidden h-full">
                 <div className="absolute top-0 right-0 p-8 opacity-10"><MessageSquare size={100} className="text-emerald-600" /></div>
                 <h4 className="text-lg font-black text-emerald-900 mb-6 flex items-center gap-3 tracking-tight uppercase"><Award size={24} /> Executive Summary</h4>
                 <div className="prose prose-sm prose-emerald max-w-none">
                    <p className="text-emerald-800 text-lg font-medium leading-relaxed italic">"{feedback.feedback}"</p>
                 </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col h-full">
                 <h4 className="text-lg font-black text-blue-400 mb-6 flex items-center gap-3 tracking-tight uppercase"><Activity size={24} /> Objections Managed</h4>
                 <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {objections.map((obj, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">{i+1}</div>
                                <span className="text-sm font-bold text-slate-200">"{obj.objection}"</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-emerald-400">Addressed</span>
                                <CheckCircle size={16} className="text-emerald-500" />
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="flex justify-center gap-4 no-print">
              <button onClick={() => setStatus('idle')} className="px-10 py-5 border-2 border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Exit Review</button>
              <button onClick={startSession} className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-3 transform active:scale-95">
                 <RefreshCw size={18} /> Relaunch Session
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default SalesTrainer;