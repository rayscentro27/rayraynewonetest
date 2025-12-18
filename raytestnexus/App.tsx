import React, { useState, useEffect } from 'react';
import Sidebar from './services/components/Sidebar';
import Dashboard from './services/components/Dashboard';
import CRMTable from './services/components/CRMTable';
import PortalView from './services/components/PortalView';
import AdminResources from './services/components/AdminResources';
import SignUp from './services/components/SignUp';
import Settings from './services/components/Settings';
import AICommandCenter from './services/components/AICommandCenter';
import DocumentQueue from './services/components/DocumentQueue';
import PartnerManager from './services/components/PartnerManager'; 
import MarketingCampaigns from './services/components/MarketingCampaigns';
import Login from './services/components/Login';
import LandingPage from './services/components/LandingPage';
import ClientLandingPage from './services/components/ClientLandingPage';
import UnifiedInbox from './services/components/UnifiedInbox';
import PowerDialer from './services/components/PowerDialer';
import SalesTrainer from './services/components/SalesTrainer';
import VoiceReceptionist from './services/components/VoiceReceptionist';
import LeadDiscoveryMap from './services/components/LeadDiscoveryMap';
import FormBuilder from './services/components/FormBuilder';
import MarketIntelligence from './services/components/MarketIntelligence';
import LenderMarketplace from './services/components/LenderMarketplace';
import DocumentGenerator from './services/components/DocumentGenerator';
import RenewalTracker from './services/components/RenewalTracker';
import SmartCalendar from './services/components/SmartCalendar';
import WorkflowAutomation from './services/components/WorkflowAutomation';
import SyndicationManager from './services/components/SyndicationManager';
import ApplicationSubmitter from './services/components/ApplicationSubmitter';
import CommandPalette from './services/components/CommandPalette';
import MobileNav from './services/components/MobileNav';
import ReputationManager from './services/components/ReputationManager';
import PGFundingFlow from './services/components/PGFundingFlow';
import ExpenseTracker from './services/components/ExpenseTracker';
import CommissionManager from './services/components/CommissionManager';
import RiskMonitor from './services/components/RiskMonitor';
import SalesLeaderboard from './services/components/SalesLeaderboard';
import GrantManager from './services/components/GrantManager';
import CourseBuilder from './services/components/CourseBuilder';
import SupabaseStatus from './services/components/SupabaseStatus';
import LoanServicing from './services/components/LoanServicing';
import CreditMemoBuilder from './services/components/CreditMemoBuilder';
import AdminCMS from './services/components/AdminCMS';
import SystemSitemap from './services/components/SystemSitemap';
import { ViewMode, Contact, AgencyBranding, Course } from './types';
import { Search, Bell, Zap, Command } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { useAuth } from './contexts/AuthContext';
import { processAutomations } from './services/automationEngine';
import PhoneNotification from './services/components/PhoneNotification';

const MOCK_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Alice Freeman',
    email: 'alice@techcorp.com',
    phone: '(555) 123-4567',
    company: 'TechCorp Solutions',
    status: 'Negotiation',
    lastContact: '2 hours ago',
    value: 150000,
    revenue: 45000,
    timeInBusiness: 24,
    source: 'LinkedIn',
    notes: 'Looking for expansion capital. Strong cash flow.',
    checklist: { 'comp_ein': true, 'comp_addr': true },
    clientTasks: [
      { id: 't1', title: 'Upload Bank Statements', status: 'pending', date: '2023-10-25', type: 'upload' },
      { id: 't2', title: 'Sign NDA', status: 'completed', date: '2023-10-20', type: 'action' }
    ],
    documents: [{ id: 'd1', name: 'Bank_Stmt_Oct.pdf', type: 'Financial', status: 'Pending Review', uploadDate: '2023-10-24', required: true }],
    fundingGoal: { targetAmount: 150000, targetDate: '2023-11-15', fundingType: 'Business Line of Credit' }
  },
  {
    id: '2',
    name: 'Bob Miller',
    email: 'bob@buildit.com',
    phone: '(555) 987-6543',
    company: 'BuildIt Construction',
    status: 'Active',
    lastContact: '1 day ago',
    value: 75000,
    revenue: 32000,
    timeInBusiness: 48,
    source: 'Referral',
    notes: 'Needs equipment financing for new crane.',
    checklist: {},
    clientTasks: [],
    fundingGoal: { targetAmount: 75000, targetDate: '2023-12-01', fundingType: 'Equipment Financing' }
  }
];

export const App = () => {
  const { user, profile, loading, debugLogin } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.CLIENT_LANDING);
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [branding, setBranding] = useState<AgencyBranding>({ 
    name: 'Nexus Funding', 
    primaryColor: '#10b981',
    socialConnections: [
      { platform: 'LinkedIn', handle: '@nexus_funding', connected: true },
      { platform: 'TikTok', handle: '', connected: false },
      { platform: 'Instagram', handle: '', connected: false },
      { platform: 'Facebook', handle: 'NexusCapitalGroup', connected: true },
      { platform: 'X', handle: '', connected: false },
    ]
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [automationLog, setAutomationLog] = useState<{show: boolean, msg: string}>({show: false, msg: ''});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsCommandOpen(true); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateContact = async (updatedContact: Contact) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
    const result = await processAutomations(updatedContact);
    if (result.triggeredActions.length > 0) {
      setContacts(prev => prev.map(c => c.id === result.updatedContact.id ? result.updatedContact : c));
      setAutomationLog({ show: true, msg: `Neural Engine: ${result.triggeredActions.join(', ')}` });
    }
  };

  const addContact = (newContact: Partial<Contact>) => {
    const contact: Contact = {
      id: `c_${Date.now()}`,
      name: newContact.name || 'New Lead',
      company: newContact.company || 'Unknown Company',
      email: newContact.email || '',
      phone: newContact.phone || '',
      status: 'Lead',
      lastContact: 'Just now',
      value: 0,
      source: 'Manual',
      checklist: {},
      clientTasks: [],
      notes: newContact.notes || '',
      ...newContact
    } as Contact;
    setContacts(prev => [contact, ...prev]);
  };

  useEffect(() => {
    if (!loading && user) {
        if (profile?.role === 'client') setCurrentView(ViewMode.PORTAL);
        else if ([ViewMode.LANDING, ViewMode.CLIENT_LANDING, ViewMode.LOGIN, ViewMode.SIGNUP].includes(currentView)) setCurrentView(ViewMode.DASHBOARD);
    }
  }, [user, loading, profile, currentView]);

  const handleLogout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    window.location.reload();
  };

  const showNavigation = user && profile?.role !== 'client' && ![ViewMode.CLIENT_LANDING, ViewMode.LANDING, ViewMode.LOGIN, ViewMode.SIGNUP].includes(currentView);

  const renderContent = () => {
    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;

    if (currentView === ViewMode.CLIENT_LANDING) return <ClientLandingPage onNavigate={setCurrentView} />;
    if (currentView === ViewMode.LANDING) return <LandingPage onNavigate={setCurrentView} branding={branding} />;
    if (currentView === ViewMode.LOGIN) return <Login onLogin={(u) => debugLogin(u)} onBack={() => setCurrentView(ViewMode.CLIENT_LANDING)} />;
    if (currentView === ViewMode.SIGNUP) return <SignUp onRegister={addContact} />;

    if (profile?.role === 'client' || currentView === ViewMode.PORTAL) {
      const myContact = contacts.find(c => c.email === user?.email) || contacts[0]; 
      return <PortalView contact={myContact} branding={branding} onLogout={handleLogout} onUpdateContact={updateContact} availableCourses={courses} />;
    }

    switch (currentView) {
      case ViewMode.DASHBOARD: return <Dashboard contacts={contacts} />;
      case ViewMode.CRM: return <CRMTable contacts={contacts} onUpdateContact={updateContact} onAddContact={addContact} />;
      case ViewMode.SETTINGS: return <Settings branding={branding} onUpdateBranding={setBranding} />;
      case ViewMode.ADMIN_CMS: return <AdminCMS branding={branding} onUpdateBranding={setBranding} />;
      case ViewMode.INBOX: return <UnifiedInbox contacts={contacts} />;
      case ViewMode.MARKETING: return <MarketingCampaigns contacts={contacts} onUpdateContact={updateContact} branding={branding} />;
      case ViewMode.POWER_DIALER: return <PowerDialer queue={contacts} onUpdateContact={updateContact} onClose={() => setCurrentView(ViewMode.CRM)} />;
      case ViewMode.SALES_TRAINER: return <SalesTrainer />;
      case ViewMode.VOICE_RECEPTIONIST: return <VoiceReceptionist />;
      case ViewMode.LEAD_MAP: return <LeadDiscoveryMap onAddLead={addContact} />;
      case ViewMode.FORM_BUILDER: return <FormBuilder onAddLead={addContact} />;
      case ViewMode.MARKET_INTEL: return <MarketIntelligence />;
      case ViewMode.LENDERS: return <LenderMarketplace />;
      case ViewMode.DOC_GENERATOR: return <DocumentGenerator contacts={contacts} onUpdateContact={updateContact} />;
      case ViewMode.RENEWALS: return <RenewalTracker contacts={contacts} onUpdateContact={updateContact} />;
      case ViewMode.CALENDAR: return <SmartCalendar contacts={contacts} onUpdateContact={updateContact} />;
      case ViewMode.AUTOMATION: return <WorkflowAutomation />;
      case ViewMode.SYNDICATION: return <SyndicationManager contacts={contacts} onUpdateContact={updateContact} />;
      case ViewMode.SUBMITTER: return <ApplicationSubmitter contacts={contacts} onUpdateContact={updateContact} />;
      case ViewMode.REPUTATION: return <ReputationManager />;
      case ViewMode.FUNDING_FLOW: return <PGFundingFlow contact={contacts[0]} />;
      case ViewMode.EXPENSES: return <ExpenseTracker />;
      case ViewMode.COMMISSIONS: return <CommissionManager contacts={contacts} />;
      case ViewMode.RISK_MONITOR: return <RiskMonitor />;
      case ViewMode.LEADERBOARD: return <SalesLeaderboard contacts={contacts} onClose={() => setCurrentView(ViewMode.DASHBOARD)} />;
      case ViewMode.GRANTS: return <GrantManager contacts={contacts} onUpdateContact={updateContact} />;
      case ViewMode.COURSE_BUILDER: return <CourseBuilder courses={courses} onUpdateCourses={setCourses} />;
      case ViewMode.SERVICING: return <LoanServicing />;
      case ViewMode.CREDIT_MEMO: return <CreditMemoBuilder contacts={contacts} onUpdateContact={updateContact} />;
      case ViewMode.REVIEW_QUEUE: return <DocumentQueue contacts={contacts} onUpdateContact={updateContact} />;
      case ViewMode.RESOURCES: return <AdminResources />;
      case ViewMode.SITEMAP: return <SystemSitemap onNavigate={setCurrentView} />;
      default: return <Dashboard contacts={contacts} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {showNavigation && <Sidebar currentView={currentView} onViewChange={setCurrentView} onLogout={handleLogout} branding={branding} />}
      <main className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${showNavigation ? 'md:ml-64' : ''}`}>
        {showNavigation && (
          <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 sticky top-0 shadow-sm">
             <div onClick={() => setIsCommandOpen(true)} className="flex items-center gap-3 bg-slate-100 hover:bg-slate-200 transition-all px-5 py-2.5 rounded-2xl cursor-pointer text-slate-400 text-sm w-full max-w-lg border border-slate-100 group">
                <Search size={18} className="group-hover:text-indigo-500 transition-colors" /><span className="flex-1">Search anything...</span><kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-400"><Command size={10} /> K</kbd>
             </div>
             <div className="flex items-center gap-6">
               <div className="hidden lg:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100"><Zap size={14} className="fill-emerald-600" /> AI Link Active</div>
               <SupabaseStatus />
               <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
                 <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative"><Bell size={22} /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span></button>
                 <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white border border-white/10 flex items-center justify-center font-black text-sm shadow-xl transform hover:scale-105 transition-all cursor-pointer">{user?.email?.charAt(0).toUpperCase()}</div>
               </div>
             </div>
          </header>
        )}
        <div className={`flex-1 overflow-auto custom-scrollbar relative p-4 md:p-8 ${showNavigation ? 'pb-24 md:pb-8' : ''}`}>{renderContent()}</div>
        {showNavigation && <MobileNav currentView={currentView} onViewChange={setCurrentView} onToggleSidebar={() => {}} />}
        <AICommandCenter contacts={contacts} onUpdateContact={updateContact} />
        <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} contacts={contacts} onNavigate={setCurrentView} onSelectContact={(c) => { updateContact(c); setCurrentView(ViewMode.CRM); }} />
        <PhoneNotification show={automationLog.show} title="Neural Engine Active" message={automationLog.msg} type="success" onClose={() => setAutomationLog({show: false, msg: ''})} />
      </main>
    </div>
  );
};