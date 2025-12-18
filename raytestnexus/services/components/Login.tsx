
import React, { useState } from 'react';
/* Added X to the lucide-react import list */
import { Hexagon, Lock, Mail, ArrowRight, User, ShieldCheck, Fingerprint, Building2, Phone, UserPlus, ChevronLeft, Sparkles, AlertCircle, Info, Code, Database, X } from 'lucide-react';
import { User as UserType, Contact, ClientTask } from '../../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import PhoneNotification from './PhoneNotification';

interface LoginProps {
  onLogin: (user: UserType) => void;
  onBack?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Sign Up Fields
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState({ show: false, message: '', title: '', type: 'info' as 'info' | 'success' | 'error' });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!isSupabaseConfigured) {
      setTimeout(() => {
        if (isSignUp) {
            setNotify({ show: true, title: 'Demo Mode', message: 'Account created locally.', type: 'success' });
            setIsSignUp(false);
        } else {
            onLogin({ id: 'demo_user', name: 'Reviewer', email: email || 'admin@nexus.funding', role: 'admin' });
        }
        setLoading(false);
      }, 800);
      return;
    }

    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: fullName, role: 'client' } }
        });

        if (authError) throw authError;

        const initialTasks: ClientTask[] = [
          { id: `t_1_${Date.now()}`, title: 'Watch: Personal Credit Guide', status: 'pending', date: new Date().toISOString().split('T')[0], type: 'education', link: 'https://www.youtube.com/watch?v=EPGPgDS0pg0' },
          { id: `t_2_${Date.now()}`, title: 'Upload Credit Report', status: 'pending', date: new Date().toISOString().split('T')[0], type: 'upload' }
        ];

        const newContact: Contact = {
          id: authData.user?.id || `temp_${Date.now()}`,
          name: fullName,
          email: email,
          phone: phone,
          company: companyName,
          status: 'Lead',
          lastContact: 'Just now',
          notes: 'Registered via Login Screen',
          value: 0,
          source: 'Web Sign-Up',
          checklist: {},
          clientTasks: initialTasks,
          invoices: [],
          // Fixed missing fundingGoal
          fundingGoal: { targetAmount: 50000, targetDate: new Date().toISOString().split('T')[0], fundingType: 'Business Line of Credit' }
        };

        await supabase.from('contacts').insert([newContact]);
        setNotify({ show: true, title: 'Success', message: 'Account created! Please sign in.', type: 'success' });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setNotify({ show: true, title: 'Auth Failed', message: err.message || 'Authentication failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'admin' | 'client') => {
    setLoading(true);
    setTimeout(() => {
      if (role === 'admin') {
        onLogin({ id: 'u_admin', name: 'John Doe', email: 'admin@nexus.funding', role: 'admin' });
      } else {
        onLogin({ id: 'u_client', name: 'Alice Freeman', email: 'alice@techcorp.com', role: 'client', contactId: '1' });
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[120px] opacity-10"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900 rounded-full blur-[120px] opacity-20"></div>
      </div>

      <div className="bg-white/5 backdrop-blur-3xl w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden z-10 flex flex-col animate-fade-in border border-white/10 relative">
        {!isSupabaseConfigured && (
          <div className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] py-2 text-center flex items-center justify-center gap-2">
            <Sparkles size={12} /> Emerald Tier Active (Demo)
          </div>
        )}

        <div className="p-8 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4 shadow-lg shadow-emerald-500/20 transform rotate-3">
            <Hexagon className="text-slate-950 fill-slate-950/10" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Nexus Funding</h1>
          <p className="text-emerald-500/70 mt-2 text-sm font-bold uppercase tracking-widest">
            {isSignUp ? 'New Capital Account' : 'Secure Operating System'}
          </p>
        </div>

        <div className="px-8 pb-8">
          {!isSignUp && (
            <div className="mb-6">
              <button 
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-all mb-4"
              >
                {showSetupGuide ? <X size={14}/> : <Info size={14} />} 
                {showSetupGuide ? 'Close Setup Guide' : 'How to Create Admin Account'}
              </button>

              {showSetupGuide && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 animate-fade-in text-xs space-y-3">
                   <p className="text-slate-300 font-medium">To grant yourself Admin privileges:</p>
                   <ol className="list-decimal list-inside space-y-2 text-slate-400">
                      <li>Sign up normally using the "Apply" link below.</li>
                      <li>Go to your <span className="text-white font-bold underline">Supabase Dashboard</span>.</li>
                      <li>Open the <span className="text-emerald-400 font-bold">SQL Editor</span>.</li>
                      <li>Run the following command:</li>
                   </ol>
                   <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-emerald-300 text-[10px] break-all select-all">
                      UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
                   </div>
                </div>
              )}
            </div>
          )}

          {!isSignUp && !showSetupGuide && (
            <div className="mb-8 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Instant Access</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleDemoLogin('admin')} className="group flex flex-col items-center justify-center p-4 bg-white/5 text-emerald-400 border border-white/10 rounded-2xl transition-all hover:bg-white/10 hover:border-emerald-500/50">
                  <ShieldCheck size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                  <span className="font-black text-[10px] uppercase tracking-widest">Admin Demo</span>
                </button>
                <button onClick={() => handleDemoLogin('client')} className="group flex flex-col items-center justify-center p-4 bg-white/5 text-emerald-400 border border-white/10 rounded-2xl transition-all hover:bg-white/10 hover:border-emerald-500/50">
                  <User size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                  <span className="font-black text-[10px] uppercase tracking-widest">Client Demo</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-4 animate-fade-in">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50" size={18} />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" required={isSignUp} className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50" size={18} />
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company" required={isSignUp} className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white text-sm" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50" size={18} />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" required={isSignUp} className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white text-sm" />
                  </div>
                </div>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50" size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white text-sm" />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50" size={18} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white text-sm" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/10 disabled:opacity-70 mt-4 uppercase tracking-widest text-xs">
              {loading ? 'Processing...' : isSignUp ? <>Create Account <UserPlus size={18} /></> : <>Enter Portal <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-slate-400 hover:text-emerald-400 font-bold uppercase tracking-widest transition-colors">
              {isSignUp ? 'Existing user? Sign In' : "New client? Apply Now"}
            </button>
          </div>
        </div>
      </div>
      <PhoneNotification show={notify.show} title={notify.title} message={notify.message} type={notify.type} onClose={() => setNotify({...notify, show: false})} />
    </div>
  );
};

export default Login;
