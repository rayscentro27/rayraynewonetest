
import { Contact, Activity, Notification, FundingOffer, Invoice } from '../types';
import * as geminiService from './geminiService';

export interface AutomationResult {
  updatedContact: Contact;
  triggeredActions: string[];
}

// Internal Mock Lender Database for Matching
const SYSTEM_LENDERS = [
  { name: 'Bluevine', minScore: 625, minRevenue: 10000 },
  { name: 'Chase Ink', minScore: 700, minRevenue: 0 },
  { name: 'OnDeck', minScore: 600, minRevenue: 8500 }
];

/**
 * The Neural Automation Engine evaluates a contact's state 
 * and applies "Nexus Protocols" automatically.
 */
export const processAutomations = async (contact: Contact): Promise<AutomationResult> => {
  const actions: string[] = [];
  let updated = JSON.parse(JSON.stringify(contact)) as Contact; // Deep clone
  const now = new Date();

  // 1. PROTOCOL: Compliance -> Tier 1 Unlock
  const tier0Items = ['comp_addr', 'comp_phone', 'comp_411', 'comp_ein'];
  const isTier0Complete = tier0Items.every(id => updated.checklist[id]);
  
  if (isTier0Complete && updated.status === 'Lead') {
    updated.status = 'Active';
    updated.notifications = [
      ...(updated.notifications || []),
      {
        id: `auto_t1_${Date.now()}`,
        title: '🚀 Tier 1 Strategy Unlocked',
        message: 'Compliance verified. You are now eligible to start building Tier 1 Trade Lines.',
        date: 'Just now',
        read: false,
        type: 'success'
      }
    ];
    actions.push('Promoted to Tier 1');
  }

  // 2. PROTOCOL: Automated Lender Matching
  const score = updated.creditAnalysis?.score || 0;
  const revenue = updated.revenue || 0;
  
  SYSTEM_LENDERS.forEach(lender => {
      const matchKey = `match_${lender.name.toLowerCase().replace(' ', '_')}`;
      if (score >= lender.minScore && revenue >= lender.minRevenue && !updated.checklist[matchKey]) {
          updated.checklist[matchKey] = true; // Mark that we found this match
          updated.notifications = [
            ...(updated.notifications || []),
            {
              id: `match_notif_${Date.now()}_${lender.name}`,
              title: `🎯 New Lender Match: ${lender.name}`,
              message: `Your profile now qualifies for ${lender.name} funding programs. Check your Offers tab.`,
              date: 'Just now',
              read: false,
              type: 'info'
            }
          ];
          actions.push(`Matched with ${lender.name}`);
      }
  });

  // 3. PROTOCOL: Offer Acceptance -> Auto-Invoicing
  const acceptedOffer = updated.offers?.find(o => o.status === 'Accepted' && !updated.invoices?.some(inv => inv.description.includes(o.lenderName)));
  if (acceptedOffer) {
    const successFee = acceptedOffer.amount * 0.10; // 10% Success Fee
    const newInvoice: Invoice = {
        id: `auto_inv_${Date.now()}`,
        amount: successFee,
        date: now.toISOString().split('T')[0],
        dueDate: now.toISOString().split('T')[0],
        status: 'Pending',
        description: `Success Fee - ${acceptedOffer.lenderName} Funding`
    };
    updated.invoices = [...(updated.invoices || []), newInvoice];
    updated.status = 'Closed';
    actions.push(`Generated Success Fee Invoice for ${acceptedOffer.lenderName}`);
  }

  // 4. PROTOCOL: Automatic Battle Card Generation
  if (updated.status === 'Negotiation' && !updated.battleCard) {
    const card = await geminiService.generateSalesBattleCard(updated);
    if (card) {
      updated.battleCard = card;
      actions.push('Generated Sales Battle Card');
    }
  }

  // 5. PROTOCOL: Closing Readiness Detection
  const hasBankLink = updated.connectedBanks && updated.connectedBanks.length > 0;
  const hasTier1TradeLines = ['t1_uline', 't1_quill'].some(id => updated.checklist[id]);
  
  if (hasBankLink && hasTier1TradeLines && !updated.callReady) {
    updated.callReady = true;
    actions.push('Marked Call Ready');
  }

  // 6. PROTOCOL: Stale Lead Detection (AI Sourcing)
  const lastContactDate = new Date(updated.lastContact.includes('ago') ? Date.now() - 3600000 : updated.lastContact);
  const diffDays = Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 3600 * 24));
  
  if (diffDays >= 3 && updated.status !== 'Closed' && updated.aiPriority !== 'Hot') {
      updated.aiPriority = 'Hot';
      updated.aiReason = "Lead inactive for 72+ hours. Immediate re-engagement required.";
      actions.push('Escalated Stale Lead');
  }

  // 7. PROTOCOL: Data Freshness Audit
  if (updated.financialSpreading?.lastUpdated) {
      const lastSpread = new Date(updated.financialSpreading.lastUpdated);
      const spreadAge = Math.floor((now.getTime() - lastSpread.getTime()) / (1000 * 3600 * 24));
      if (spreadAge > 30) {
          updated.notifications = [
            ...(updated.notifications || []),
            {
              id: `stale_docs_${Date.now()}`,
              title: '⚠️ Financials Expired',
              message: 'Your bank data is over 30 days old. Please re-sync or upload new statements.',
              date: 'Just now',
              read: false,
              type: 'alert'
            }
          ];
          actions.push('Flagged Stale Financials');
      }
  }

  // Final Activity Log for combined actions
  if (actions.length > 0) {
      updated.activities = [
        ...(updated.activities || []),
        {
          id: `act_auto_${Date.now()}`,
          type: 'system',
          description: `Neural Engine Executed: ${actions.join(', ')}`,
          date: now.toLocaleString(),
          user: 'Nexus AI'
        }
      ];
  }

  return {
    updatedContact: updated,
    triggeredActions: actions
  };
};
