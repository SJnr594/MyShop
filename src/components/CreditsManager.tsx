import React, { useState } from 'react';
import { Sale, StoreSettings, CreditRecord, CreditPayment, UserProfile } from '../types';
import { 
  Search, User, Phone, Calendar, AlertTriangle, CheckCircle, Clock, DollarSign, 
  CreditCard, Sparkles, MessageSquare, Send, Check, Receipt, ChevronRight, Info, AlertCircle
} from 'lucide-react';

interface CreditsManagerProps {
  credits: CreditRecord[];
  sales: Sale[];
  settings: StoreSettings;
  activeProfile: UserProfile;
  onUpdateCredits: (updatedCredits: CreditRecord[]) => void;
}

export default function CreditsManager({ 
  credits = [], 
  sales, 
  settings, 
  activeProfile,
  onUpdateCredits 
}: CreditsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  
  // Selected credit record for recording installment or viewing history
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'payment' | 'history' | 'reminder' | null>(null);
  
  // New payment entry state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  
  // Reminder template state
  const [reminderType, setReminderType] = useState<'check_in' | 'due_soon' | 'overdue'>('check_in');
  const [reminderMessageDraft, setReminderMessageDraft] = useState('');

  // Helper to normalize credit record status and balance precision
  const normalizeCreditRecord = (r: CreditRecord): CreditRecord => {
    const roundedTotal = Math.round((r.totalAmount || 0) * 100) / 100;
    
    // Sum all installment payments if payments array exists, otherwise use amountPaid
    const totalPaymentsSum = (r.payments && r.payments.length > 0)
      ? r.payments.reduce((acc, p) => acc + (p.amount || 0), 0)
      : (r.amountPaid || 0);
      
    const roundedPaid = Math.round(totalPaymentsSum * 100) / 100;
    const rawBalance = roundedTotal - roundedPaid;
    
    const isFullyPaid = rawBalance <= 0.009 || roundedPaid >= (roundedTotal - 0.009);
    const balanceDue = isFullyPaid ? 0 : Math.max(0, Math.round(rawBalance * 100) / 100);
    const status: 'unpaid' | 'partial' | 'paid' = isFullyPaid 
      ? 'paid' 
      : (roundedPaid > 0 ? 'partial' : 'unpaid');
    const amountPaid = isFullyPaid ? roundedTotal : roundedPaid;

    if (r.balanceDue !== balanceDue || r.status !== status || r.amountPaid !== amountPaid) {
      return {
        ...r,
        amountPaid,
        balanceDue,
        status
      };
    }
    return r;
  };

  // Auto-normalize records across the component
  const normalizedCredits = credits.map(normalizeCreditRecord);

  // Sync back auto-healed records to state if any status/balance mismatch was detected
  React.useEffect(() => {
    let needsUpdate = false;
    const healed = credits.map(r => {
      const norm = normalizeCreditRecord(r);
      if (norm.status !== r.status || norm.balanceDue !== r.balanceDue || norm.amountPaid !== r.amountPaid) {
        needsUpdate = true;
      }
      return norm;
    });
    if (needsUpdate) {
      onUpdateCredits(healed);
    }
  }, [credits, onUpdateCredits]);

  const selectedRecord = normalizedCredits.find(r => r.id === selectedRecordId);

  // General calculations for outstanding summaries
  const unpaidRecords = normalizedCredits.filter(r => r.status !== 'paid');
  const totalOutstanding = unpaidRecords.reduce((sum, r) => sum + r.balanceDue, 0);
  const overdueCount = unpaidRecords.filter(r => Date.now() > r.dueDate).length;
  
  // Reminders triggers calculation
  const getRecordReminders = (r: CreditRecord) => {
    if (r.status === 'paid') return { showCheckIn: false, showDueSoon: false, isOverdue: false };
    
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const twoDays = 2 * 24 * 60 * 60 * 1000;
    
    const now = Date.now();
    // 1 week after purchase date, if not yet checked in / acknowledged
    const showCheckIn = now >= (r.purchaseDate + oneWeek) && !r.checkInAcknowledged;
    // 2 days before due date, up to due date
    const showDueSoon = now >= (r.dueDate - twoDays) && now <= r.dueDate;
    const isOverdue = now > r.dueDate;
    
    return { showCheckIn, showDueSoon, isOverdue };
  };

  const actionableRemindersCount = unpaidRecords.filter(r => {
    const alerts = getRecordReminders(r);
    return alerts.showCheckIn || alerts.showDueSoon || alerts.isOverdue;
  }).length;

  // Filtered credits list
  const filteredCredits = normalizedCredits.filter(r => {
    const matchesSearch = 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerPhone.includes(searchQuery) ||
      r.saleId.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = 
      statusFilter === 'all' || 
      r.status === statusFilter;
      
    return matchesSearch && matchesStatus;
  });

  // RECORD AN INSTALLMENT PAYMENT
  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive payment amount.");
      return;
    }
    
    if (amount > selectedRecord.balanceDue + 0.01) {
      alert(`The maximum payable balance is ${settings.currency}${selectedRecord.balanceDue.toFixed(2)}.`);
      return;
    }
    
    const newPayment: CreditPayment = {
      id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount,
      timestamp: Date.now(),
      paymentMethod,
      notes: paymentNotes.trim() || undefined
    };
    
    const updatedPayments = [...(selectedRecord.payments || []), newPayment];
    const rawTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const roundedTotal = Math.round(selectedRecord.totalAmount * 100) / 100;
    const roundedPaid = Math.round(rawTotalPaid * 100) / 100;
    const rawBalance = roundedTotal - roundedPaid;

    const isFullyPaid = rawBalance <= 0.009 || roundedPaid >= (roundedTotal - 0.009);
    const newBalanceDue = isFullyPaid ? 0 : Math.max(0, Math.round(rawBalance * 100) / 100);
    const newStatus: 'unpaid' | 'partial' | 'paid' = isFullyPaid ? 'paid' : (roundedPaid > 0 ? 'partial' : 'unpaid');
    
    const updatedRecord: CreditRecord = {
      ...selectedRecord,
      payments: updatedPayments,
      amountPaid: isFullyPaid ? roundedTotal : roundedPaid,
      balanceDue: newBalanceDue,
      status: newStatus
    };
    
    const newCreditsList = credits.map(r => r.id === selectedRecord.id ? updatedRecord : r);
    onUpdateCredits(newCreditsList);
    
    // Clear and close payment form
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentMethod('cash');
    setActiveModal(null);
    setSelectedRecordId(null);
    alert(isFullyPaid ? "Credit account fully settled and marked as paid!" : "Installment payment recorded and customer balance updated successfully.");
  };

  // ACKNOWLEDGE Friendly Check-in
  const handleAcknowledgeCheckIn = (recordId: string) => {
    const updatedCredits = credits.map(r => {
      if (r.id === recordId) {
        return { ...r, checkInAcknowledged: true };
      }
      return r;
    });
    onUpdateCredits(updatedCredits);
  };

  // INITIALIZE REMINDER TEXT MODAL DRAFT
  const openReminderModal = (record: CreditRecord, type: 'check_in' | 'due_soon' | 'overdue') => {
    setSelectedRecordId(record.id);
    setReminderType(type);
    
    const dateStr = new Date(record.purchaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const dueDateStr = new Date(record.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    
    let draft = '';
    if (type === 'check_in') {
      draft = `Hi ${record.customerName}, this is ${settings.storeName || 'the store'}. We hope you are doing well and enjoying your purchase from ${dateStr}! This is a friendly check-in on how everything is going, and to remind you that the store credit balance of ${settings.currency}${record.balanceDue.toFixed(2)} is scheduled for payment on ${dueDateStr}. Thank you and have a wonderful day!`;
    } else if (type === 'due_soon') {
      draft = `Hello ${record.customerName}, friendly reminder from ${settings.storeName || 'the store'}. Your store credit balance of ${settings.currency}${record.balanceDue.toFixed(2)} is due in 2 days (on ${dueDateStr}). Please stop by or send transfer to settle this outstanding balance. Thank you!`;
    } else {
      draft = `URGENT NOTICE: Hi ${record.customerName}, your store credit balance of ${settings.currency}${record.balanceDue.toFixed(2)} at ${settings.storeName || 'our store'} was due on ${dueDateStr} and is now OVERDUE. Please contact us immediately at ${settings.phone || 'our number'} to arrange immediate payment. Thank you.`;
    }
    
    setReminderMessageDraft(draft);
    setActiveModal('reminder');
  };

  // TRIGGER SMS WEDGE
  const triggerSMSSend = () => {
    if (!selectedRecord) return;
    const phone = selectedRecord.customerPhone.replace(/[^0-9+]/g, '');
    const encodedBody = encodeURIComponent(reminderMessageDraft);
    const smsUrl = `sms:${phone}?body=${encodedBody}`;
    window.open(smsUrl, '_blank');
    
    if (reminderType === 'check_in') {
      handleAcknowledgeCheckIn(selectedRecord.id);
    }
    setActiveModal(null);
  };

  // REPRINT CREDIT AGREEMENT AND SALES SLIP
  const originalSale = selectedRecord ? sales.find(s => s.id === selectedRecord.saleId) : null;

  return (
    <div className="space-y-6" id="credit-ledger-panel">
      
      {/* LEDGER OVERVIEW METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="credit-metrics-row">
        
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Outstanding Bookings</span>
            <span className="text-2xl font-black text-slate-900 block font-mono">
              {settings.currency}{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600 border border-rose-100/50">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Overdue Accounts</span>
            <span className="text-2xl font-black text-rose-600 block font-mono">
              {overdueCount} <span className="text-xs font-semibold text-slate-400 font-sans">profiles</span>
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${overdueCount > 0 ? 'bg-rose-100/40 text-rose-600 border-rose-200 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Unpaid / Partials</span>
            <span className="text-2xl font-black text-amber-500 block font-mono">
              {unpaidRecords.length} <span className="text-xs font-semibold text-slate-400 font-sans">debtors</span>
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl border border-amber-100/50">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Reminders</span>
            <span className="text-2xl font-black text-blue-600 block font-mono">
              {actionableRemindersCount} <span className="text-xs font-semibold text-slate-400 font-sans">alerts</span>
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${actionableRemindersCount > 0 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* ACTIONABLE ALERTS & REMINDERS (1-week & 2-day criteria) */}
      {unpaidRecords.some(r => {
        const alerts = getRecordReminders(r);
        return alerts.showCheckIn || alerts.showDueSoon || alerts.isOverdue;
      }) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">Credit Ledger Active Task Alerts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[220px] overflow-y-auto scrollbar-thin pr-2">
            {unpaidRecords.map(r => {
              const alerts = getRecordReminders(r);
              if (!alerts.showCheckIn && !alerts.showDueSoon && !alerts.isOverdue) return null;

              return (
                <div key={r.id} className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-xs">{r.customerName}</span>
                      <span className="font-mono text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                        {r.customerPhone}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 leading-normal space-y-1">
                      {alerts.isOverdue && (
                        <p className="flex items-center gap-1.5 text-rose-400 font-bold">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Account is OVERDUE by {Math.ceil((Date.now() - r.dueDate) / (24 * 3600 * 1000))} days!</span>
                        </p>
                      )}
                      {alerts.showCheckIn && (
                        <p className="flex items-center gap-1.5 text-blue-400 font-medium">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>1-Week purchase check-in milestone reached today.</span>
                        </p>
                      )}
                      {alerts.showDueSoon && (
                        <p className="flex items-center gap-1.5 text-amber-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Payment due in less than 48 hours ({new Date(r.dueDate).toLocaleDateString()}).</span>
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 font-mono">
                        Remaining Balance: {settings.currency}{r.balanceDue.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    {alerts.showCheckIn && (
                      <button
                        onClick={() => openReminderModal(r, 'check_in')}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                        type="button"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Send 1-Wk SMS</span>
                      </button>
                    )}
                    {alerts.showDueSoon && (
                      <button
                        onClick={() => openReminderModal(r, 'due_soon')}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                        type="button"
                      >
                        <Send className="w-3 h-3" />
                        <span>Due Reminder</span>
                      </button>
                    )}
                    {alerts.isOverdue && (
                      <button
                        onClick={() => openReminderModal(r, 'overdue')}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                        type="button"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Overdue Notice</span>
                      </button>
                    )}
                    {alerts.showCheckIn && (
                      <button
                        onClick={() => handleAcknowledgeCheckIn(r.id)}
                        className="border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-[9px] px-2 py-1 rounded"
                        type="button"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER BAR & TABLE SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 flex flex-col md:flex-row gap-3 items-center justify-between" id="credit-filter-panel">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, or sale..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none bg-slate-50/50"
            id="credit-search-bar"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto py-1">
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'unpaid', label: 'Fully Unpaid' },
            { id: 'partial', label: 'Partial Installment' },
            { id: 'paid', label: 'Fully Settled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* LEDGER DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="credit-ledger-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 select-none">
                <th className="p-4">Customer Details</th>
                <th className="p-4">Original Purchase</th>
                <th className="p-4 text-right">Credit Amount</th>
                <th className="p-4 text-right">Paid Installments</th>
                <th className="p-4 text-right">Balance Due</th>
                <th className="p-4">Due Date Milestone</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ledger Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCredits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <User className="w-10 h-10 text-slate-300 stroke-1" />
                      <p className="font-semibold text-slate-700">No matching credit agreements found</p>
                      <p className="text-[10px] max-w-sm text-slate-400">
                        When completing purchases in checkout, choose 'Store Credit' as payment method to automatically ledger customers who buy now and pay later.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCredits.map(record => {
                  const now = Date.now();
                  const isOverdue = now > record.dueDate && record.status !== 'paid';
                  const daysToDue = Math.ceil((record.dueDate - now) / (24 * 3600 * 1000));
                  
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/40">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{record.customerName}</div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{record.customerPhone}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-600 font-mono text-[11px] flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-blue-500" />
                          <span>{record.saleId}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Purchased: {new Date(record.purchaseDate).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-4 text-right font-mono font-semibold text-slate-700">
                        {settings.currency}{record.totalAmount.toFixed(2)}
                      </td>

                      <td className="p-4 text-right font-mono text-emerald-600 font-bold">
                        {settings.currency}{record.amountPaid.toFixed(2)}
                      </td>

                      <td className="p-4 text-right font-mono text-rose-600 font-black text-sm">
                        {settings.currency}{record.balanceDue.toFixed(2)}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-700 flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(record.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-1">
                          {record.status === 'paid' ? (
                            <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Settled</span>
                          ) : isOverdue ? (
                            <span className="text-[9px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-full animate-pulse">
                              Overdue by {Math.abs(daysToDue)} days
                            </span>
                          ) : daysToDue <= 2 ? (
                            <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                              Due in {daysToDue} days
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {daysToDue} days left
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          record.status === 'paid' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : record.status === 'partial' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {record.status !== 'paid' && (
                            <button
                              onClick={() => {
                                setSelectedRecordId(record.id);
                                setPaymentAmount(record.balanceDue.toString());
                                setActiveModal('payment');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center space-x-1 border border-emerald-500/20"
                              type="button"
                              id={`pay-btn-${record.id}`}
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Settle</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedRecordId(record.id);
                              setActiveModal('history');
                            }}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center space-x-1 shadow-2xs"
                            type="button"
                            id={`history-btn-${record.id}`}
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Agreement</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: RECORD PAYMENT INSTALLMENT */}
      {activeModal === 'payment' && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-100 animate-fadeIn" id="payment-modal">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative animate-scaleUp text-xs">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <span className="font-extrabold text-xs uppercase tracking-wider">Record Installment / Settlement</span>
              <button 
                onClick={() => { setActiveModal(null); setSelectedRecordId(null); }} 
                className="text-slate-400 hover:text-white font-bold p-1"
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPaymentSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Customer Profile:</span>
                  <span className="font-sans font-bold text-slate-800">{selectedRecord.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Original Bill Total:</span>
                  <span>{settings.currency}{selectedRecord.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total Already Paid:</span>
                  <span className="text-emerald-600 font-bold">{settings.currency}{selectedRecord.amountPaid.toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-200 my-1.5"></div>
                <div className="flex justify-between text-slate-900 font-sans font-bold text-xs">
                  <span>Remaining Balance Due:</span>
                  <span className="text-rose-600 font-mono font-black">{settings.currency}{selectedRecord.balanceDue.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Installment Amount Tendered</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono text-xs">{settings.currency}</div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedRecord.balanceDue}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none font-mono font-bold text-slate-800 text-xs"
                    required
                    id="payment-amount-field"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Accepting full or partial ledger payments.</p>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">Payment Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: 'cash',
                      label: 'Cash Tender',
                      icon: DollarSign,
                      activeClass: 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-md ring-2 ring-emerald-500/30 dark:bg-emerald-600 dark:border-emerald-500',
                      unactiveClass: 'bg-emerald-50/90 border-emerald-300 text-emerald-950 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-100 dark:hover:bg-emerald-900/60',
                      iconActive: 'text-white',
                      iconUnactive: 'text-emerald-700 dark:text-emerald-400'
                    },
                    {
                      id: 'card',
                      label: 'Card Device',
                      icon: CreditCard,
                      activeClass: 'bg-blue-600 border-blue-600 text-white font-bold shadow-md ring-2 ring-blue-500/30 dark:bg-blue-600 dark:border-blue-500',
                      unactiveClass: 'bg-blue-50/90 border-blue-300 text-blue-950 hover:bg-blue-100 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-100 dark:hover:bg-blue-900/60',
                      iconActive: 'text-white',
                      iconUnactive: 'text-blue-700 dark:text-blue-400'
                    },
                    {
                      id: 'mobile_money',
                      label: 'Mobile Transfer',
                      icon: Sparkles,
                      activeClass: 'bg-purple-600 border-purple-600 text-white font-bold shadow-md ring-2 ring-purple-500/30 dark:bg-purple-600 dark:border-purple-500',
                      unactiveClass: 'bg-purple-50/90 border-purple-300 text-purple-950 hover:bg-purple-100 dark:bg-purple-950/60 dark:border-purple-700 dark:text-purple-100 dark:hover:bg-purple-900/60',
                      iconActive: 'text-white',
                      iconUnactive: 'text-purple-700 dark:text-purple-400'
                    }
                  ].map(item => {
                    const IconComp = item.icon;
                    const isSelected = paymentMethod === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPaymentMethod(item.id as any)}
                        className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                          isSelected ? item.activeClass : item.unactiveClass
                        }`}
                      >
                        <IconComp className={`w-4 h-4 ${isSelected ? item.iconActive : item.iconUnactive}`} />
                        <span className="text-[9px] font-bold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Receipt Note / Memo (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Settle partial debt, paid cash in store"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  id="payment-notes-field"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-2">
                <button
                  type="button"
                  onClick={() => { setActiveModal(null); setSelectedRecordId(null); }}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl cursor-pointer flex items-center justify-center space-x-1 border border-emerald-500/20 shadow-sm"
                  id="submit-payment-btn"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AGREEMENT DETAILS & HISTORICAL LOGS */}
      {activeModal === 'history' && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-100 animate-fadeIn" id="history-modal">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative animate-scaleUp text-xs flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center shrink-0">
              <span className="font-extrabold text-xs uppercase tracking-wider">Credit Agreement & Payment Logs</span>
              <button 
                onClick={() => { setActiveModal(null); setSelectedRecordId(null); }} 
                className="text-slate-400 hover:text-white font-bold p-1"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
              
              {/* Account details */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Debtor Customer</span>
                  <span className="font-extrabold text-slate-800 block mt-0.5">{selectedRecord.customerName}</span>
                  <span className="font-mono text-[10px] text-slate-500 block">{selectedRecord.customerPhone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Credit Timeline</span>
                  <span className="text-slate-600 block text-[11px] mt-0.5">Purchased: {new Date(selectedRecord.purchaseDate).toLocaleDateString()}</span>
                  <span className="text-rose-600 font-bold block text-[11px]">Payment Due: {new Date(selectedRecord.dueDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50 text-center space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Agreement Total</span>
                  <span className="font-mono font-bold text-slate-800 text-sm block">{settings.currency}{selectedRecord.totalAmount.toFixed(2)}</span>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center space-y-0.5">
                  <span className="text-[9px] text-emerald-600 font-bold uppercase block">Paid To Date</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm block">{settings.currency}{selectedRecord.amountPaid.toFixed(2)}</span>
                </div>
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-center space-y-0.5">
                  <span className="text-[9px] text-rose-500 font-bold uppercase block">Remaining Balance</span>
                  <span className="font-mono font-black text-rose-600 text-sm block">{settings.currency}{selectedRecord.balanceDue.toFixed(2)}</span>
                </div>
              </div>

              {/* ORIGINAL BASKET RECEIPTS */}
              {originalSale ? (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Items Purchased on Credit</span>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[11px] font-mono bg-slate-50/50">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 text-[9px] uppercase tracking-wider select-none">
                          <th className="p-2.5">Item Name</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Unit Price</th>
                          <th className="p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60">
                        {originalSale.items.map(item => (
                          <tr key={item.productId} className="hover:bg-slate-100/30">
                            <td className="p-2.5 text-slate-700 font-sans font-semibold">{item.productName}</td>
                            <td className="p-2.5 text-center text-slate-500">{item.quantity}</td>
                            <td className="p-2.5 text-right text-slate-500">{settings.currency}{item.price.toFixed(2)}</td>
                            <td className="p-2.5 text-right text-slate-900 font-bold">{settings.currency}{(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start space-x-1.5 text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[11.5px]">Original Invoice Receipt Deleted</span>
                    <span className="text-[10.5px] block mt-0.5 opacity-85">The detailed checkout receipt records for sale {selectedRecord.saleId} are no longer found in the local database, but credit balances remain fully active.</span>
                  </div>
                </div>
              )}

              {/* HISTORICAL INSTALLMENT PAYMENTS LIST */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Historical Installment Payments</span>
                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-150 text-[9px] uppercase tracking-wider font-bold text-slate-500 select-none">
                        <th className="p-2.5">Date & Time</th>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5">Notes</th>
                        <th className="p-2.5 text-right">Amount Tendered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150/60 font-mono">
                      {!selectedRecord.payments || selectedRecord.payments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 font-sans">
                            No installment payments recorded yet for this credit booking.
                          </td>
                        </tr>
                      ) : (
                        selectedRecord.payments.map(payment => (
                          <tr key={payment.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 text-slate-600">
                              {new Date(payment.timestamp).toLocaleString()}
                            </td>
                            <td className="p-2.5">
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase text-[8px] font-sans">
                                {payment.paymentMethod.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500 font-sans text-[10.5px]">
                              {payment.notes || '—'}
                            </td>
                            <td className="p-2.5 text-right text-emerald-600 font-bold text-[11px]">
                              +{settings.currency}{payment.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setSelectedRecordId(null); }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Close Agreement Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW AND SEND REMINDER TEXT DRAFTS */}
      {activeModal === 'reminder' && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-100 animate-fadeIn" id="reminder-modal">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative animate-scaleUp text-xs">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>Format Payment Reminder Wedge</span>
              </span>
              <button 
                onClick={() => { setActiveModal(null); setSelectedRecordId(null); }} 
                className="text-slate-400 hover:text-white font-bold p-1"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-3 text-blue-800 leading-normal space-y-1">
                <span className="font-bold text-[11px] block">Reminder Targeting Meta</span>
                <span className="text-[10.5px] block text-slate-600">This wedge formats a standard text dispatch draft for customer **{selectedRecord.customerName}** ({selectedRecord.customerPhone}) containing active outstanding balance info.</span>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">Compose Broadcast Note</label>
                <textarea
                  value={reminderMessageDraft}
                  onChange={(e) => setReminderMessageDraft(e.target.value)}
                  className="w-full h-32 bg-slate-50/50 border border-slate-200 rounded-xl p-3 focus:outline-none leading-relaxed font-sans text-xs text-slate-800"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-2">
                <button
                  type="button"
                  onClick={() => { setActiveModal(null); setSelectedRecordId(null); }}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={triggerSMSSend}
                  className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 border border-blue-500/20 shadow-sm transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send SMS / WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
