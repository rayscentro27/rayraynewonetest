
import React from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client' | 'partner' | 'sales' | 'user';
  contactId?: string;
}

export interface SalesBattleCard {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  predictedObjections: { objection: string; rebuttal: string }[];
  closingStrategy: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'system';
  description: string;
  date: string;
  user?: string;
  contactName?: string;
  company?: string;
  value?: number;
}

export interface ClientTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  date: string;
  type: 'upload' | 'action' | 'education' | 'review' | 'meeting';
  link?: string;
  meetingTime?: string;
  linkedToGoal?: boolean;
}

export interface Invoice {
  id: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'Pending' | 'Paid';
  description: string;
}

export interface ClientDocument {
  id: string;
  name: string;
  type: 'Legal' | 'Financial' | 'Identification' | 'Credit' | 'Contract' | 'Other';
  status: 'Verified' | 'Pending Review' | 'Rejected' | 'Missing' | 'Signed';
  uploadDate?: string;
  required?: boolean;
  fileUrl?: string;
  isEsed?: boolean;
}

export interface BusinessProfile {
  legalName: string;
  dba?: string;
  taxId: string;
  structure: 'LLC' | 'C-Corp' | 'S-Corp' | 'Sole Prop' | 'Partnership';
  industry: string;
  ownershipPercentage: number;
  establishedDate: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'Lead' | 'Active' | 'Negotiation' | 'Closed';
  lastContact: string;
  value: number;
  revenue?: number;
  timeInBusiness?: number;
  source: string;
  notes: string;
  checklist: Record<string, boolean>;
  clientTasks: ClientTask[];
  documents?: ClientDocument[];
  activities?: Activity[];
  invoices?: Invoice[];
  businessProfile?: BusinessProfile;
  creditAnalysis?: CreditAnalysis;
  messageHistory?: Message[];
  connectedBanks?: BankAccount[];
  offers?: FundingOffer[];
  submissions?: ApplicationSubmission[];
  battleCard?: SalesBattleCard;
  meetingLink?: string;
  meetingStatus?: 'scheduled' | 'active' | 'completed';
  fundingGoal?: FundingGoal;
  financialSpreading?: FinancialSpreading;
  referralData?: any;
  notifications?: Notification[];
  ledger?: LedgerEntry[];
  negativeItems?: NegativeItem[];
  subscription?: Subscription;
  compliance?: ComplianceRecord;
  stipulations?: Stipulation[];
  fundedDeals?: FundedDeal[];
  rescuePlan?: RescuePlan;
  creditMemo?: CreditMemo;
  businessPlan?: BusinessPlan;
  callReady?: boolean;
  aiPriority?: 'Hot' | 'Warm' | 'Cold';
  aiReason?: string;
}

export interface CreditAnalysis {
  analyzedDate: string;
  score: number;
  utilization: number;
  inquiries: number;
  derogatoryMarks: number;
  openAccounts: number;
  status: string;
  extractedName?: string;
  extractedAddress?: string;
}

export interface Message {
  id: string;
  sender: 'admin' | 'client' | 'system';
  content: string;
  timestamp: string;
  read: boolean;
}

export interface BankAccount {
  id: string;
  institutionName: string;
  last4: string;
  status: 'Connected' | 'Error';
  lastSynced: string;
  balance: number;
}

export interface FundingOffer {
  id: string;
  lenderName: string;
  amount: number;
  term: string;
  rate: string;
  payment: string;
  paymentAmount: number;
  status: 'Sent' | 'Accepted' | 'Declined';
  dateSent: string;
  stips?: string;
  signature?: string;
  signedDate?: string;
  aiAnalysis?: any;
}

export interface ApplicationSubmission {
  id: string;
  contactId: string;
  contactName: string;
  lenderId: string;
  lenderName: string;
  status: 'Draft' | 'Sent' | 'Approved' | 'Declined';
  dateSent: string;
  coverLetter: string;
}

export interface FundingGoal {
  targetAmount: number;
  targetDate: string;
  fundingType: 'Business Line of Credit' | 'SBA Loan' | 'Equipment Financing' | 'Term Loan';
}

export interface FinancialMonth {
  month: string;
  revenue: number;
  expenses: number;
  endingBalance: number;
  nsfCount: number;
  negativeDays: number;
}

export interface FinancialSpreading {
  months: FinancialMonth[];
  lastUpdated: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'success' | 'alert' | 'info';
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'Repayment' | 'Draw' | 'Funding' | 'Interest' | 'Fee';
  amount: number;
  description: string;
  status: 'Posted' | 'Pending';
}

export interface NegativeItem {
  id: string;
  creditor: string;
  accountNumber: string;
  bureau: string;
  status: string;
  dateReported: string;
  reasonForDispute?: string;
  isSelected: boolean;
}

export interface Subscription {
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: string;
  renewalDate: string;
  price: number;
  features: string[];
}

export interface ComplianceRecord {
  kycStatus: string;
  kybStatus: string;
  ofacCheck: string;
  lastCheckDate: string;
  riskScore: 'Low' | 'Medium' | 'High';
  flags: string[];
}

export interface Stipulation {
  id: string;
  name: string;
  description: string;
  status: 'Pending' | 'Uploaded' | 'Verified';
  uploadDate?: string;
  fileUrl?: string;
  aiVerification?: {
    isMatch: boolean;
    confidence: number;
    reason: string;
  };
}

export interface FundedDeal {
  id: string;
  lenderName: string;
  fundedDate: string;
  originalAmount: number;
  currentBalance: number;
  termLengthMonths: number;
  paymentFrequency: string;
  paymentAmount: number;
  totalPayback: number;
  status: 'Active' | 'Paid';
  renewalEligibleDate: string;
  paymentsMade: number;
}

export interface RescuePlan {
  approvalProbability: number;
  estimatedRecoveryTime: string;
  dealKillers: { issue: string; impact: 'High' | 'Medium' | 'Low' }[];
  diagnosis: string;
  prescription: { step: string; timeframe: string }[];
}

export interface CreditMemo {
  id: string;
  dateCreated: string;
  summary: string;
  recommendation: 'Approve' | 'Decline' | 'Condition';
  conditions?: string;
  strengths: string[];
  weaknesses: string[];
  mitigants: string[];
  metrics: {
    dscr: number;
    monthlyFreeCashFlow: number;
  };
}

export interface BusinessPlan {
  id: string;
  companyName: string;
  lastUpdated: string;
  sections: {
    executiveSummary: string;
    companyOverview: string;
    marketAnalysis: string;
    productsServices: string;
    marketingStrategy: string;
    financialPlan: string;
  };
}

export interface MarketingAutomation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  promptTemplate: string;
  isActive: boolean;
}

export interface SocialPost {
  id: string;
  platform: 'TikTok' | 'Instagram' | 'LinkedIn' | 'Facebook';
  content: string;
  videoUrl?: string;
  status: 'Draft' | 'Generating' | 'Ready' | 'Posted';
  scheduledDate?: string;
  aspectRatio: '16:9' | '9:16';
}

export interface AgencyBranding {
  name: string;
  primaryColor: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  socialConnections?: { platform: string; handle: string; connected: boolean }[];
}

export interface EnrichedData {
  company: string;
  description: string;
  ceo: string;
  revenue: string;
  phone: string;
  address: string;
  industry: string;
  icebreakers: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  modules: any[];
}

export interface Grant {
  id: string;
  name: string;
  provider: string;
  amount: number;
  deadline: string;
  description: string;
  status: 'Identified' | 'Drafting' | 'Submitted' | 'Won' | 'Lost';
  matchScore: number;
  requirements: string[];
  url: string;
}

export interface Lender {
  id: string;
  name: string;
  logo: string;
  type: 'Fintech' | 'Bank' | 'Credit Union' | 'SBA';
  minScore: number;
  minRevenue: number;
  minTimeInBusinessMonths: number;
  maxAmount: number;
  description: string;
  applicationLink: string;
  matchCriteria?: any;
  /* Added lastUpdated to Lender interface */
  lastUpdated?: string;
}

export interface PipelineRule {
  id: string;
  name: string;
  isActive: boolean;
  trigger: { type: string; value?: string };
  conditions: { field: string; operator: string; value: any }[];
  actions: { type: string; params: any }[];
}

/* Added MarketReport interface */
export interface MarketReport {
  competitors: { name: string; strengths: string[]; weaknesses: string[] }[];
  fundingAngles: string[];
  digitalGap: string;
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
}

/* Added Investor interface */
export interface Investor {
  id: string;
  name: string;
  email: string;
  totalCommitted: number;
  totalDeployed: number;
  activeDeals: number;
  status: 'Active' | 'Inactive';
}

/* Added RiskAlert interface */
export interface RiskAlert {
  id: string;
  contactId: string;
  contactName: string;
  type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  date: string;
  status: 'Active' | 'Resolved';
  source: string;
}

/* Added LeadForm interface */
export interface LeadForm {
  id: string;
  name: string;
  industry: string;
  themeColor: string;
  headline: string;
  subhead: string;
  benefits: string[];
  fields: ('name' | 'email' | 'phone' | 'company' | 'revenue' | 'timeInBusiness')[];
  buttonText: string;
  totalSubmissions: number;
}

/* Added ActiveLoan interface */
export interface ActiveLoan {
  id: string;
  contactId: string;
  contactName: string;
  principal: number;
  paybackAmount: number;
  balance: number;
  termMonths: number;
  startDate: string;
  paymentFrequency: 'Daily' | 'Weekly' | 'Monthly';
  paymentAmount: number;
  status: 'Current' | 'Late' | 'Default';
  missedPayments: number;
  payments: any[];
}

/* Added ChatMessage interface */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/* Added AuditLog interface */
export interface AuditLog {
  id: string;
  action: string;
  target: string;
  user: string;
  timestamp: string;
  ipAddress: string;
}

/* Added Integration interface */
export interface Integration {
  id: string;
  name: string;
  status: 'Connected' | 'Disconnected';
}

/* Added CreditCardProduct interface */
export interface CreditCardProduct {
  id: string;
  name: string;
  issuer: string;
  network: string;
  minScore: number;
  bureauPulled: string;
  annualFee: number;
  introOffer: string;
  applicationLink: string;
  recommendedFor: string;
}

/* Added SalesSession interface */
export interface SalesSession {
  id: string;
  date: string;
  scenario: string;
  duration: string;
  score: number;
  feedback: string;
}

/* Added UnifiedMessage interface */
export interface UnifiedMessage {
  id: string;
  threadId: string;
  sender: 'me' | 'client' | 'system';
  senderName: string;
  content: string;
  timestamp: string;
  channel: string;
  direction: 'inbound' | 'outbound';
  read: boolean;
  isAutomated?: boolean;
}

/* Added InboxThread interface */
export interface InboxThread {
  id: string;
  contactId?: string;
  contactName: string;
  contactAvatar: string;
  subject?: string;
  unreadCount: number;
  channel: 'email' | 'instagram' | 'facebook' | 'sms';
  autoPilot: boolean;
  messages: UnifiedMessage[];
  lastMessage: UnifiedMessage;
}

/* Added VoiceAgentConfig interface */
export interface VoiceAgentConfig {
  id: string;
  name: string;
  voiceName: string;
  openingLine: string;
  systemInstruction: string;
  knowledgeBase: string;
  isActive: boolean;
}

/* Added CallLog interface */
export interface CallLog {
  id: string;
  caller: string;
  duration: string;
  date: string;
  status: 'Completed' | 'Missed';
  outcome: string;
  transcriptSummary: string;
}

/* Added DocumentTemplate interface */
export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  variables: string[];
  content: string;
}

/* Added Syndication interface */
export interface Syndication {
  id: string;
  investorId: string;
  dealId: string;
  amount: number;
  percentage: number;
}

/* Added Review interface */
export interface Review {
  id: string;
  contactName: string;
  company: string;
  rating: number;
  comment: string;
  date: string;
  source: string;
  status: 'Pending' | 'Replied';
  reply?: string;
}

/* Added Expense interface */
export interface Expense {
  id: string;
  vendor: string;
  amount: number;
  category: 'Software' | 'Marketing' | 'Personnel' | 'Office' | 'Legal' | 'Other';
  frequency: 'Monthly' | 'Yearly' | 'One-time';
  date: string;
  status: 'Paid' | 'Pending';
  description?: string;
}

/* Added FundingFlowStep interface */
export interface FundingFlowStep {
  id: number;
  title: string;
  desc: string;
}

/* Added CommissionProfile interface */
export interface CommissionProfile {
  id: string;
  agentName: string;
  splitPercentage: number;
  totalFunded: number;
  totalCommissionEarned: number;
  currentDrawBalance: number;
}

/* Added PayoutRecord interface */
export interface PayoutRecord {
  id: string;
  agentId: string;
  dealId: string;
  dealValue: number;
  grossCommission: number;
  splitAmount: number;
  drawDeduction: number;
  netPayout: number;
  status: 'Pending' | 'Paid';
  date: string;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  CRM = 'CRM',
  INBOX = 'INBOX',
  PORTAL = 'PORTAL',
  DOCUMENTS = 'DOCUMENTS',
  RESOURCES = 'RESOURCES',
  SETTINGS = 'SETTINGS',
  SIGNUP = 'SIGNUP',
  REVIEW_QUEUE = 'REVIEW_QUEUE',
  PARTNERS = 'PARTNERS',
  LOGIN = 'LOGIN',
  MARKETING = 'MARKETING',
  ADMIN_CMS = 'ADMIN_CMS',
  ADMIN_CLIENTS = 'ADMIN_CLIENTS',
  POWER_DIALER = 'POWER_DIALER',
  SALES_TRAINER = 'SALES_TRAINER',
  VOICE_RECEPTIONIST = 'VOICE_RECEPTIONIST',
  LEAD_MAP = 'LEAD_MAP',
  FORM_BUILDER = 'FORM_BUILDER',
  MARKET_INTEL = 'MARKET_INTEL',
  LENDERS = 'LENDERS',
  DOC_GENERATOR = 'DOC_GENERATOR',
  RENEWALS = 'RENEWALS',
  SYNDICATION = 'SYNDICATION',
  SUBMITTER = 'SUBMITTER',
  REPUTATION = 'REPUTATION',
  FUNDING_FLOW = 'FUNDING_FLOW',
  EXPENSES = 'EXPENSES',
  COMMISSIONS = 'COMMISSIONS',
  RISK_MONITOR = 'RISK_MONITOR',
  GRANTS = 'GRANTS',
  COURSE_BUILDER = 'COURSE_BUILDER',
  SERVICING = 'SERVICING',
  CREDIT_MEMO = 'CREDIT_MEMO',
  SITEMAP = 'SITEMAP',
  CLIENT_LANDING = 'CLIENT_LANDING',
  LANDING = 'LANDING',
  CALENDAR = 'CALENDAR',
  AUTOMATION = 'AUTOMATION',
  LEADERBOARD = 'LEADERBOARD'
}
