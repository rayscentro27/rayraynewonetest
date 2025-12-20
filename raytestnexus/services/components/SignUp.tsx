
import React, { useState } from 'react';
import { Hexagon, ArrowRight, CheckCircle, Shield, TrendingUp, AlertCircle, Loader, Sparkles } from 'lucide-react';
import { Contact, ClientTask } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

interface SignUpProps {
  onRegister: (contact: Contact) => void;
}

const SignUp: React.FC<SignUpProps> = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    password: '',
    targetAmount: '50000',
    fundingType: 'Business Line of Credit'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // AUTOMATION: Smart Onboarding
    const initialTasks: ClientTask[] = [
      { 
        id: `t_init_1_${Date.now()}`, 
        title: 'Watch: Personal Credit Guide', 
        status: 'pending', 
        date: new Date().toISOString().split('T')[0], 
        type: 'education', 
        link: 'https://www.youtube.com/watch?v=EPGPgDS0pg0',
        description: 'Start here! Understanding the basics of personal credit is crucial for funding approval.'
      },
      { 
        id: `t_init_2_${Date.now()}`, 
        title: 'Sign up for Credit Monitoring', 
        status: 'pending', 
        date: new Date().toISOString().split('T')[0], 
        type: 'action', 
        link: 'https://www.identityiq.com',
        description: 'We need to see your full report to identify negative items.'
      }
    ];

    if (!isSupabaseConfigured) {
        setTimeout(() => {
            // Fix: satisfy the Contact type requirements by providing a default 'notes' string and source
            onRegister({
                id: `demo_${Date.now()}`,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                company: formData.company,
                status: 'Lead',
                lastContact: 'Just now',
                value: 0,
                source: 'Demo Registration',
                checklist: {},
                clientTasks: initialTasks,
                notes: '',
                // Fixed missing fundingGoal
                fundingGoal: {
                    targetAmount: Number(formData.targetAmount),
                    targetDate: '',
                    fundingType: formData.fundingType as any
                }
            } as Contact);
            setIsSubmitted(true);
            setLoading(false);
        }, 1000);
        return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name, role: 'client' }
        }
      });

      if (authError) throw authError;

      const profileId = authData.user?.id || `temp_${Date.now()}`;

      // Create profile record
      const { error: profileError } = await supabase.from('profiles').insert({
        id: profileId,
        role: 'client',
        name: formData.name,
        email: formData.email,
        settings: { company: formData.company }
      });
      if (profileError) throw profileError;

      // Create CRM contact record
      const newContact: Contact = {
        id: profileId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        status: 'Lead',
        lastContact: 'Just now',
        notes: 'Registered via Public Sign-Up Page',
        value: 0,
        source: 'Web Sign-Up',
        checklist: {},
        clientTasks: initialTasks,
        invoices: [],
        fundingGoal: {
          targetAmount: Number(formData.targetAmount),
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          fundingType: formData.fundingType as any
        }
      };

      const { error: contactError } = await supabase.from('contacts').insert([newContact]);
      if (contactError) throw contactError;

      onRegister(newContact);
      setIsSubmitted(true);
    } catch (err: any) {
      const msg = err?.message || err?.error_description || 'Registration failed. Please try again.';
      console.error('Supabase signup error', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
          <p className="text-slate-600 mb-6">
            Welcome to Nexus Funding. You can now log in to access your portal.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      
      {/* Left Panel */}
      <div className="md:w-1/2 bg-slate-900 text-white p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Hexagon size={400} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <Hexagon className="text-blue-500 fill-blue-500" size={32} />
            <span className="text-2xl font-bold tracking-wide">Nexus Funding</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Secure the Capital Your Business Deserves.
          </h1>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            Our AI-powered platform guides you through every step of building corporate credit and securing tier-1 funding.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Shield className="text-blue-400" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Guaranteed Compliance</h3>
                <p className="text-slate-400 text-sm">We ensure your entity meets all 20+ lender compliance points.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-green-400" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Fast-Track Paydex 80</h3>
                <p className="text-slate-400 text-sm">Proprietary vendor strategies to build your score in 30 days.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 mt-12">
          © 2024 Nexus Funding Inc. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="md:w-1/2 p-8 md:p-16 overflow-y-auto bg-slate-50 flex flex-col items-center justify-center">
        <div className="max-w-md w-full">
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Just reviewing?</span>
             </div>
             <button 
                onClick={() => window.location.reload()} 
                className="text-xs font-black text-blue-600 hover:underline"
             >
                SKIP TO DEMO LOGIN →
             </button>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Create your account</h2>
          <p className="text-slate-500 mb-8">Start your funding journey today.</p>

          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input 
                  required
                  type="tel" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="(555) 000-0000"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="TechCorp Inc."
                value={formData.company}
                onChange={e => setFormData({...formData, company: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Work Email</label>
              <input 
                required
                type="email" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="you@company.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                required
                type="password" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                minLength={6}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : <>Get Started Now <ArrowRight size={20} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
