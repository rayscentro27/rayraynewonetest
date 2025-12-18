
import React, { useState, useEffect, useRef } from 'react';
import { Contact, InboxThread, UnifiedMessage } from '../types';
import { 
  Mail, MessageSquare, MessageCircle, Search, Filter, Archive, Send, 
  MoreVertical, User, Sparkles, RefreshCw, X, Instagram, Facebook, Zap, Bot,
  Paperclip, Tag, ArrowRight 
} from 'lucide-react';
import * as geminiService from '../services/geminiService';

interface UnifiedInboxProps {
  contacts: Contact[];
}

// Mock Data Generator for threads
const generateMockThreads = (contacts: Contact[]): InboxThread[] => {
  return [
    {
      id: 'th_1',
      contactId: contacts[0]?.id,
      contactName: contacts[0]?.name || 'Alice Freeman',
      contactAvatar: contacts[0]?.name.charAt(0) || 'A',
      subject: 'Inquiry: Term Sheet Revision',
      unreadCount: 1,
      channel: 'email',
      autoPilot: false,
      messages: [
        {
          id: 'm1', threadId: 'th_1', sender: 'client', senderName: contacts[0]?.name || 'Alice',
          content: 'Hi, I saw the offer but I have a question about the weekly payment structure. Is it flexible?',
          timestamp: '10:30 AM', channel: 'email', direction: 'inbound', read: true
        }
      ],
      lastMessage: {
          id: 'm1', threadId: 'th_1', sender: 'client', senderName: contacts[0]?.name || 'Alice',
          content: 'Hi, I saw the offer but I have a question about the weekly payment structure. Is it flexible?',
          timestamp: '10:30 AM', channel: 'email', direction: 'inbound', read: true
      }
    },
    {
      id: 'th_2',
      contactId: contacts[1]?.id,
      contactName: 'Instagram Lead',
      contactAvatar: 'I',
      unreadCount: 0,
      channel: 'instagram',
      autoPilot: true,
      messages: [
        {
          id: 'm4', threadId: 'th_2', sender: 'client', senderName: 'fitness_junkie',
          content: 'Hey, saw your story! Do you guys fund gym expansions?',
          timestamp: 'Yesterday', channel: 'instagram', direction: 'inbound', read: true
        }
      ],
      lastMessage: {
          id: 'm4', threadId: 'th_2', sender: 'client', senderName: 'fitness_junkie',
          content: 'Hey, saw your story! Do you guys fund gym expansions?',
          timestamp: 'Yesterday', channel: 'instagram', direction: 'inbound', read: true
      }
    }
  ];
};

const UnifiedInbox: React.FC<UnifiedInboxProps> = ({ contacts }) => {
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [inputText, setInputText] = useState('');
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAutoResponding, setIsAutoResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = generateMockThreads(contacts);
    setThreads(data);
  }, [contacts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThreadId, threads]);

  // AI SUGGESTION LOGIC
  useEffect(() => {
    const generateSuggestions = async () => {
        const thread = threads.find(t => t.id === selectedThreadId);
        if (thread && thread.messages.length > 0) {
            setIsAiLoading(true);
            setSmartReplies([]);
            try {
                const replies = await geminiService.generateSmartReplies(thread.messages);
                setSmartReplies(replies);
            } catch (e) {
                setSmartReplies(["Yes, we are flexible.", "I'll check with underwriting.", "Let's hop on a call."]);
            } finally {
                setIsAiLoading(false);
            }
        }
    };
    if (selectedThreadId) generateSuggestions();
  }, [selectedThreadId, threads]);

  const handleSendMessage = (text: string, isAutomated = false) => {
    if (!text.trim() || !selectedThreadId) return;
    
    const thread = threads.find(t => t.id === selectedThreadId);
    if (!thread) return;

    const newMessage: UnifiedMessage = {
        id: `msg_${Date.now()}`,
        threadId: selectedThreadId,
        sender: 'me',
        senderName: 'Admin',
        content: text,
        timestamp: 'Just now',
        channel: thread.channel,
        direction: 'outbound',
        read: true,
        isAutomated
    };

    setThreads(prev => prev.map(t => {
        if (t.id === selectedThreadId) {
            return {
                ...t,
                messages: [...t.messages, newMessage],
                lastMessage: newMessage,
                unreadCount: 0
            };
        }
        return t;
    }));
    setInputText('');
  };

  const selectedThread = threads.find(t => t.id === selectedThreadId);
  const filteredThreads = threads.filter(t => filter === 'all' || t.channel === filter);

  return (
    <div className="flex h-[calc(100vh-100px)] bg-slate-50 animate-fade-in overflow-hidden rounded-[2rem] border border-slate-200 shadow-sm">
      
      {/* Thread List Area */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
         <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-4">Messages</h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" placeholder="Search threads..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredThreads.map(thread => (
                <div 
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`p-5 border-b border-slate-50 cursor-pointer transition-all ${selectedThreadId === thread.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-black text-xs uppercase text-slate-900 truncate pr-2">{thread.contactName}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase whitespace-nowrap">{thread.lastMessage.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 font-medium">{thread.lastMessage.content}</p>
                    <div className="flex gap-1 mt-2">
                        <span className="text-[8px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded border text-slate-500">{thread.channel}</span>
                        {thread.autoPilot && <span className="text-[8px] font-black uppercase bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-700 flex items-center gap-1"><Zap size={8} fill="currentColor"/> AI</span>}
                    </div>
                </div>
            ))}
         </div>
      </div>

      {/* Main Chat Pane */}
      {selectedThread ? (
          <div className="flex-1 flex flex-col min-w-0 bg-white relative">
              {/* Header */}
              <div className="h-16 border-b border-slate-200 flex justify-between items-center px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs uppercase">{selectedThread.contactAvatar}</div>
                      <div>
                          <h3 className="font-black text-xs uppercase text-slate-900">{selectedThread.contactName}</h3>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedThread.channel} session active</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <button className="text-[9px] font-black uppercase text-blue-600 hover:underline">View CRM Profile</button>
                     <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"><MoreVertical size={18}/></button>
                  </div>
              </div>

              {/* Chat View */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                  {selectedThread.messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-4 rounded-3xl text-xs font-medium leading-relaxed shadow-sm relative ${
                              msg.direction === 'outbound' ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                          }`}>
                              {msg.isAutomated && (
                                  <div className="flex items-center gap-1 text-[8px] font-black uppercase opacity-60 mb-1 border-b border-white/10 pb-0.5"><Bot size={10}/> Autonomous Reply</div>
                              )}
                              <p>{msg.content}</p>
                          </div>
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
              </div>

              {/* AI SUGGESTION BAR */}
              <div className="px-8 py-3 bg-white border-t border-slate-100 flex items-center gap-4 overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase text-indigo-500 shrink-0">
                      {isAiLoading ? <RefreshCw className="animate-spin" size={12}/> : <Sparkles size={14}/>} 
                      AI Suggests:
                  </div>
                  <div className="flex gap-2">
                      {smartReplies.map((reply, i) => (
                          <button 
                            key={i} 
                            onClick={() => setInputText(reply)}
                            className="whitespace-nowrap px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-95"
                          >
                            {reply}
                          </button>
                      ))}
                      {!isAiLoading && smartReplies.length === 0 && <span className="text-[9px] text-slate-400 uppercase font-black">Scanning context...</span>}
                  </div>
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-slate-100">
                  <div className="flex gap-3 items-center">
                      <button className="p-3 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all shrink-0"><Paperclip size={20}/></button>
                      <div className="flex-1 relative">
                          <input 
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                            placeholder="Type a high-converting reply..."
                            className="w-full pl-5 pr-14 py-4 bg-slate-100 border-none rounded-[1.5rem] text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                          />
                          <button onClick={() => handleSendMessage(inputText)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                              <Send size={18} />
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50">
              <div className="w-20 h-20 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center mb-6 border border-slate-100"><Archive size={40} className="opacity-20" /></div>
              <p className="text-sm font-black uppercase tracking-widest opacity-40">Select a Secure Thread</p>
          </div>
      )}

    </div>
  );
};

export default UnifiedInbox;
