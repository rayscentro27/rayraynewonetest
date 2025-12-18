
import React, { useState, useEffect, useRef } from 'react';
import { Contact, Activity, ClientTask } from '../../types';
import { Phone, PhoneOff, Mic, StopCircle, User, FileText, ChevronRight, X, Clock, Play, SkipForward, CheckCircle, AlertTriangle, Calendar, MessageSquare, BarChart2, Zap, BrainCircuit, RefreshCw, Volume2, ArrowRight } from 'lucide-react';
import * as geminiService from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

const calendarTool: FunctionDeclaration = {
  name: 'schedule_meeting',
  parameters: {
    type: Type.OBJECT,
    description: 'Schedules a follow-up meeting with the borrower.',
    properties: {
      meetingTime: { type: Type.STRING, description: 'Requested time (e.g. tomorrow at 2pm)' },
      meetingType: { type: Type.STRING, enum: ['Underwriting Review', 'Closing Call'], description: 'Purpose of session.' }
    },
    required: ['meetingTime', 'meetingType']
  }
};

interface PowerDialerProps {
  queue: Contact[];
  onUpdateContact: (contact: Contact) => void;
  onClose: () => void;
}

const PowerDialer: React.FC<PowerDialerProps> = ({ queue, onUpdateContact, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'wrapping'>('idle');
  const [mode, setMode] = useState<'manual' | 'neural'>('manual');
  const [duration, setDuration] = useState(0);
  const [script, setScript] = useState('Generating intelligent script...');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState<{role: string, text: string}[]>([]);

  const currentContact = queue[currentIndex];
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptBuffer = useRef({ input: '', output: '' });

  useEffect(() => {
    if (currentContact) {
      setScript('Synthesizing lead intelligence...');
      geminiService.generateSalesScript(currentContact, 'Outreach').then(setScript);
    }
  }, [currentIndex, currentContact]);

  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
    } else {
        if (timerRef.current) clearInterval(timerRef.current);
        setDuration(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callStatus]);

  const startNeuralCall = async () => {
    if (!currentContact) return;
    setCallStatus('calling');
    setLiveTranscript([]);
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      nextStartTimeRef.current = audioContextRef.current.currentTime;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000 } });
      streamRef.current = stream;

      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);

      const instruction = `Autonomous Agent "Nexus". Calling ${currentContact.name} from ${currentContact.company}. 
      GOAL: Book a closing call. SCRIPT: ${script}. 
      TOOLS: Use schedule_meeting if they express interest.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: instruction,
          tools: [{ functionDeclarations: [calendarTool] }],
          inputAudioTranscription: { model: "google-1" },
          outputAudioTranscription: { model: "google-1" }
        },
        callbacks: {
          onopen: () => {
            setCallStatus('connected');
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolumeLevel(Math.sqrt(sum / inputData.length) * 80);
              sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(inputData) }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const buffer = await decodeAudioData(decode(audioData), audioContextRef.current, 24000, 1);
              const audioSource = audioContextRef.current.createBufferSource();
              audioSource.buffer = buffer;
              audioSource.connect(audioContextRef.current.destination);
              const start = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              audioSource.start(start);
              nextStartTimeRef.current = start + buffer.duration;
              sourcesRef.current.add(audioSource);
            }
            if (msg.serverContent?.inputTranscription?.text) transcriptBuffer.current.input += msg.serverContent.inputTranscription.text;
            if (msg.serverContent?.outputTranscription?.text) transcriptBuffer.current.output += msg.serverContent.outputTranscription.text;
            if (msg.serverContent?.turnComplete) {
                if (transcriptBuffer.current.input) setLiveTranscript(p => [...p, {role: 'Lead', text: transcriptBuffer.current.input}]);
                if (transcriptBuffer.current.output) setLiveTranscript(p => [...p, {role: 'AI', text: transcriptBuffer.current.output}]);
                transcriptBuffer.current = { input: '', output: '' };
            }
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'schedule_meeting') {
                  const args = fc.args as any;
                  handleAutoBook(args.meetingTime, args.meetingType);
                  sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "Meeting Booked." } } }));
                }
              }
            }
          },
          onclose: () => setCallStatus('wrapping'),
          onerror: () => stopNeuralSession()
        }
      });
      sessionRef.current = sessionPromise;
    } catch (e) { setCallStatus('idle'); }
  };

  const handleAutoBook = (time: string, type: string) => {
    onUpdateContact({
        ...currentContact,
        clientTasks: [{ id: `auto_${Date.now()}`, title: `${type} (AI Booked)`, status: 'pending', date: new Date().toISOString().split('T')[0], meetingTime: time, type: 'meeting' }, ...(currentContact.clientTasks || [])],
        activities: [...(currentContact.activities || []), { id: `act_b_${Date.now()}`, type: 'meeting', description: `AI autonomously booked ${type} for ${time}.`, date: new Date().toLocaleString(), user: 'Nexus AI' }]
    });
  };

  const stopNeuralSession = async () => {
    if (sessionRef.current) try { (await sessionRef.current).close(); } catch(e){}
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setCallStatus('wrapping');
  };

  const handleDisposition = (outcome: string) => {
    onUpdateContact({ ...currentContact, activities: [...(currentContact.activities || []), { id: `call_${Date.now()}`, type: 'call', description: `Outcome: ${outcome}`, date: new Date().toLocaleString(), user: mode === 'neural' ? 'Nexus AI' : 'Admin' }] });
    if (currentIndex < queue.length - 1) setCurrentIndex(prev => prev + 1); else onClose();
  };

  if (!currentContact) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-fade-in text-slate-100 font-sans">
      <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-2xl shadow-2xl ${mode === 'neural' ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>
            {mode === 'neural' ? <BrainCircuit size={28}/> : <Phone size={28}/>}
          </div>
          <div>
            <h2 className="font-black text-xl uppercase tracking-tighter">{mode === 'neural' ? 'Neural Link' : 'Dialer'}</h2>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{currentIndex + 1} / {queue.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="bg-slate-800 p-1 rounded-xl border border-white/5 flex shadow-inner">
                <button onClick={() => setMode('manual')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'manual' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Human</button>
                <button onClick={() => setMode('neural')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${mode === 'neural' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}><Zap size={10} fill="currentColor"/> AI</button>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X size={28}/></button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        <div className="col-span-3 border-r border-white/5 bg-slate-900/40 p-10 overflow-y-auto custom-scrollbar">
           <div className="text-center mb-10">
              <div className="w-28 h-28 bg-gradient-to-br from-slate-800 to-slate-700 rounded-[3rem] mx-auto flex items-center justify-center text-4xl font-black mb-6 border-2 border-white/10 shadow-2xl transform hover:rotate-3 transition-transform">
                {currentContact.name.charAt(0)}
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-1">{currentContact.company}</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{currentContact.name}</p>
           </div>
           <div className="p-6 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Underwriting Scan</p>
                <div className="space-y-4">
                    <div><p className="text-[10px] text-slate-500 uppercase font-bold">Revenue</p><p className="font-black text-emerald-400">${currentContact.revenue?.toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-slate-500 uppercase font-bold">Credit</p><p className="font-black text-blue-400">{currentContact.creditAnalysis?.score || '---'}</p></div>
                </div>
           </div>
        </div>

        <div className="col-span-6 p-12 flex flex-col items-center justify-center relative overflow-hidden bg-slate-950">
           {callStatus === 'idle' ? (
              <div className="text-center animate-fade-in max-w-sm">
                 <div className="w-32 h-32 bg-slate-900 rounded-[3rem] flex items-center justify-center border-4 border-white/5 mb-10 shadow-[0_0_80px_rgba(0,0,0,0.5)] mx-auto">
                    <Phone size={56} className="text-slate-800" />
                 </div>
                 <h2 className="text-xl font-black mb-4 tracking-tight uppercase">Ready to Connect</h2>
                 <button 
                    onClick={mode === 'neural' ? startNeuralCall : () => setCallStatus('connected')}
                    className={`px-12 py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 ${mode === 'neural' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                 >
                    {mode === 'neural' ? 'Establish Neural Link' : 'Manual Call'}
                 </button>
              </div>
           ) : (
              <div className="w-full flex flex-col items-center max-w-2xl animate-fade-in">
                 <div className="relative mb-20 group">
                    <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-100 ${mode === 'neural' ? 'bg-gradient-to-tr from-indigo-600 to-emerald-600 shadow-[0_0_80px_rgba(79,70,229,0.5)]' : 'bg-blue-600'}`} style={{ transform: `scale(${1 + volumeLevel/100})` }}>
                       <Volume2 size={64} className="text-white opacity-90 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border border-emerald-500/20 shadow-xl animate-pulse">Live Link</div>
                 </div>
                 <div className="w-full bg-black/40 rounded-[3rem] p-10 border border-white/5 h-64 overflow-y-auto custom-scrollbar shadow-inner relative">
                    {liveTranscript.map((t, i) => (
                        <div key={i} className={`flex ${t.role === 'AI' ? 'justify-start' : 'justify-end'} mb-4`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${t.role === 'AI' ? 'bg-indigo-600 text-white rounded-tl-none' : 'bg-slate-800 text-slate-300 rounded-tr-none border border-white/5'}`}>
                                <span className="text-[8px] font-black uppercase block opacity-50 mb-1">{t.role}</span>
                                {t.text}
                            </div>
                        </div>
                    ))}
                    {liveTranscript.length === 0 && <p className="text-center text-slate-700 italic text-sm mt-12 animate-pulse font-mono tracking-widest">Awaiting neural voice handshake...</p>}
                 </div>
                 <button onClick={stopNeuralSession} className="mt-12 bg-red-600/10 border border-red-600/30 hover:bg-red-600 text-red-500 hover:text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-2xl">Terminate Session</button>
              </div>
           )}
        </div>

        <div className="col-span-3 border-l border-white/5 bg-slate-900/40 p-10 flex flex-col">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Dispositions</p>
           <div className="grid grid-cols-1 gap-3 mb-10">
                {['Interested', 'Meeting Booked', 'Follow Up', 'Unqualified'].map(opt => (
                    <button key={opt} onClick={() => handleDisposition(opt)} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-slate-300 hover:bg-indigo-600 hover:text-white transition-all text-left uppercase tracking-widest flex items-center justify-between group">
                        {opt} <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all"/>
                    </button>
                ))}
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Neural Playbook</p>
           <div className="flex-1 bg-slate-800/50 border border-white/5 rounded-3xl p-6 text-xs text-slate-400 italic leading-relaxed overflow-y-auto custom-scrollbar shadow-inner">
                {script}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PowerDialer;
