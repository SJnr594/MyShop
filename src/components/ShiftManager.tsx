import React, { useState } from 'react';
import { CashierShift, CashDrawerMovement, StoreSettings, UserProfile } from '../types';
import { 
  Clock, DollarSign, ArrowDownRight, ArrowUpRight, CheckCircle2, AlertTriangle, 
  Printer, FileText, History, Lock, Unlock, Plus, RefreshCw, Calendar, User, 
  TrendingUp, Shield, HelpCircle, Eye, Check
} from 'lucide-react';

interface ShiftManagerProps {
  shifts: CashierShift[];
  activeShift: CashierShift | null;
  settings: StoreSettings;
  activeProfile: UserProfile | null;
  onOpenShift: (openingFloat: number, notes?: string) => void;
  onCloseShift: (closingActualCash: number, notes?: string) => void;
  onAddMovement: (type: 'cash_in' | 'cash_out', amount: number, reason: string) => void;
}

export default function ShiftManager({
  shifts,
  activeShift,
  settings,
  activeProfile,
  onOpenShift,
  onCloseShift,
  onAddMovement
}: ShiftManagerProps) {
  // Modal states
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState<'cash_in' | 'cash_out' | null>(null);
  const [selectedHistoricalShift, setSelectedHistoricalShift] = useState<CashierShift | null>(null);

  // Form input states
  const [openingFloatInput, setOpeningFloatInput] = useState('100.00');
  const [openNotesInput, setOpenNotesInput] = useState('');
  const [actualCashInput, setActualCashInput] = useState('');
  const [closeNotesInput, setCloseNotesInput] = useState('');
  const [movementAmountInput, setMovementAmountInput] = useState('');
  const [movementReasonInput, setMovementReasonInput] = useState('');

  // Denomination calculator for cash count
  const [denominations, setDenominations] = useState<{ [key: string]: number }>({
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    '5': 0,
    '2': 0,
    '1': 0
  });

  const calculateDenominationsTotal = () => {
    return Object.entries(denominations).reduce((sum, [denom, count]) => {
      return sum + parseFloat(denom) * (Number(count) || 0);
    }, 0);
  };

  const handleDenominationChange = (denom: string, val: number) => {
    const next = { ...denominations, [denom]: Math.max(0, val) };
    setDenominations(next);
    const total = Object.entries(next).reduce((sum, [d, c]) => sum + parseFloat(d) * (Number(c) || 0), 0);
    setActualCashInput(total.toFixed(2));
  };

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const floatVal = parseFloat(openingFloatInput) || 0;
    onOpenShift(floatVal, openNotesInput.trim() || undefined);
    setShowOpenModal(false);
    setOpenNotesInput('');
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actualVal = parseFloat(actualCashInput);
    if (isNaN(actualVal) || actualVal < 0) {
      alert("Please enter a valid actual cash amount.");
      return;
    }
    onCloseShift(actualVal, closeNotesInput.trim() || undefined);
    setShowCloseModal(false);
    setActualCashInput('');
    setCloseNotesInput('');
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(movementAmountInput);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }
    if (!movementReasonInput.trim()) {
      alert("Please provide a reason or expense reference.");
      return;
    }
    if (showMovementModal) {
      onAddMovement(showMovementModal, amt, movementReasonInput.trim());
    }
    setShowMovementModal(null);
    setMovementAmountInput('');
    setMovementReasonInput('');
  };

  // Calculations for active shift
  const runningExpectedCash = activeShift 
    ? activeShift.openingFloat + activeShift.cashInTotal + activeShift.totalCashSales - activeShift.cashOutTotal
    : 0;

  const handlePrintZReport = (shiftToPrint: CashierShift) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const expected = shiftToPrint.expectedCash ?? (
      shiftToPrint.openingFloat + shiftToPrint.cashInTotal + shiftToPrint.totalCashSales - shiftToPrint.cashOutTotal
    );
    const actual = shiftToPrint.closingActualCash ?? expected;
    const variance = shiftToPrint.variance ?? (actual - expected);

    const movementsHtml = shiftToPrint.movements && shiftToPrint.movements.length > 0
      ? shiftToPrint.movements.map(m => `
          <tr>
            <td style="padding: 2px 0;">${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${m.reason}</td>
            <td style="text-align: right; padding: 2px 0; font-family: monospace;">${m.type === 'cash_out' ? '-' : '+'}${settings.currency}${m.amount.toFixed(2)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="2" style="color: #666; font-style: italic; padding: 4px 0;">No cash adjustments during shift</td></tr>';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Z-Report - Shift #${shiftToPrint.id}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              color: black;
              background: white;
              padding: 20px;
              max-width: 80mm;
              margin: 0 auto;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .divider { border-top: 1px dashed black; margin: 8px 0; }
            .double-divider { border-top: 2px solid black; margin: 8px 0; }
            table { width: 100%; font-size: 11px; border-collapse: collapse; }
            th { text-align: left; border-bottom: 1px dashed black; padding-bottom: 4px; }
            .title { font-size: 16px; font-weight: bold; }
            .badge { font-size: 10px; font-weight: bold; border: 1px solid black; padding: 2px 4px; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="title">${settings.storeName.toUpperCase()}</div>
            <div>${settings.address}</div>
            <div>Tel: ${settings.phone}</div>
            <div class="divider"></div>
            <div style="font-weight: bold; font-size: 14px;">*** DAILY Z-REPORT ***</div>
            <div>SHIFT RECONCILIATION SLIP</div>
          </div>

          <div class="divider"></div>
          <div><strong>Shift ID:</strong> ${shiftToPrint.id}</div>
          <div><strong>Cashier:</strong> ${shiftToPrint.cashierName}</div>
          <div><strong>Start:</strong> ${new Date(shiftToPrint.startTime).toLocaleString()}</div>
          <div><strong>End:</strong> ${shiftToPrint.endTime ? new Date(shiftToPrint.endTime).toLocaleString() : 'STILL OPEN'}</div>
          <div><strong>Status:</strong> ${shiftToPrint.status.toUpperCase()}</div>

          <div class="divider"></div>
          <div style="font-weight: bold; margin-bottom: 4px;">1. SALES SUMMARY</div>
          <table>
            <tr>
              <td>Total Receipts Issued:</td>
              <td class="right"><strong>${shiftToPrint.totalSalesCount}</strong></td>
            </tr>
            <tr>
              <td>Cash Sales:</td>
              <td class="right">${settings.currency}${shiftToPrint.totalCashSales.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Card / POS Sales:</td>
              <td class="right">${settings.currency}${shiftToPrint.totalCardSales.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Mobile Money Sales:</td>
              <td class="right">${settings.currency}${shiftToPrint.totalMobileMoneySales.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Store Credit Issued:</td>
              <td class="right">${settings.currency}${shiftToPrint.totalCreditSales.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px dashed black;">
              <td><strong>GROSS SHIFT REVENUE:</strong></td>
              <td class="right"><strong>${settings.currency}${(shiftToPrint.totalCashSales + shiftToPrint.totalCardSales + shiftToPrint.totalMobileMoneySales + shiftToPrint.totalCreditSales).toFixed(2)}</strong></td>
            </tr>
          </table>

          <div class="divider"></div>
          <div style="font-weight: bold; margin-bottom: 4px;">2. CASH DRAWER AUDIT</div>
          <table>
            <tr>
              <td>(+) Opening Cash Float:</td>
              <td class="right">${settings.currency}${shiftToPrint.openingFloat.toFixed(2)}</td>
            </tr>
            <tr>
              <td>(+) Cash In (Additions):</td>
              <td class="right">${settings.currency}${shiftToPrint.cashInTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>(+) Cash Sales Collected:</td>
              <td class="right">${settings.currency}${shiftToPrint.totalCashSales.toFixed(2)}</td>
            </tr>
            <tr>
              <td>(-) Cash Out (Petty Expenses):</td>
              <td class="right">-${settings.currency}${shiftToPrint.cashOutTotal.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px dashed black;">
              <td><strong>EXPECTED DRAWER CASH:</strong></td>
              <td class="right"><strong>${settings.currency}${expected.toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td><strong>ACTUAL COUNTED CASH:</strong></td>
              <td class="right"><strong>${settings.currency}${actual.toFixed(2)}</strong></td>
            </tr>
            <tr style="border-top: 1px dashed black; font-weight: bold;">
              <td>DRAWER VARIANCE (DIFF):</td>
              <td class="right" style="color: ${variance < 0 ? 'red' : variance > 0 ? 'green' : 'black'}">
                ${variance > 0 ? '+' : ''}${settings.currency}${variance.toFixed(2)}
                (${variance === 0 ? 'BALANCED' : variance > 0 ? 'OVERAGE' : 'SHORTAGE'})
              </td>
            </tr>
          </table>

          <div class="divider"></div>
          <div style="font-weight: bold; margin-bottom: 4px;">3. CASH MOVEMENTS LOG</div>
          <table>
            ${movementsHtml}
          </table>

          <div class="divider"></div>
          <div style="margin-top: 25px; display: flex; justify-content: space-between;">
            <div>
              <div style="border-top: 1px solid black; width: 100px; padding-top: 3px; font-size: 10px;">Cashier Sign</div>
            </div>
            <div>
              <div style="border-top: 1px solid black; width: 100px; padding-top: 3px; font-size: 10px; text-align: right;">Manager Sign</div>
            </div>
          </div>

          <div class="double-divider"></div>
          <div class="center" style="font-size: 10px; color: #555;">
            * END OF Z-REPORT *<br />
            Audited & Saved in Permanent Registry
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="shift-manager-workspace">
      
      {/* Header & Active Shift Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Shift Management & Cash Drawer Reconciliation
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track opening floats, cash-in/out petty expenses, and generate compliant Z-Reports.
                </p>
              </div>
            </div>
          </div>

          {/* Active Shift Controls */}
          <div className="flex items-center space-x-2.5 flex-wrap">
            {activeShift ? (
              <>
                <button
                  onClick={() => setShowMovementModal('cash_in')}
                  className="bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
                  id="shift-cash-in-btn"
                  type="button"
                >
                  <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                  <span>+ Cash In</span>
                </button>

                <button
                  onClick={() => setShowMovementModal('cash_out')}
                  className="bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
                  id="shift-cash-out-btn"
                  type="button"
                >
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  <span>- Cash Out</span>
                </button>

                <button
                  onClick={() => setShowCloseModal(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                  id="close-shift-btn"
                  type="button"
                >
                  <Lock className="w-4 h-4" />
                  <span>End Shift & Z-Report</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowOpenModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
                id="open-shift-btn"
                type="button"
              >
                <Unlock className="w-4 h-4" />
                <span>Open New Register Shift</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Shift Dashboard Strip */}
        {activeShift ? (
          <div className="mt-6 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Live Shift Active: #{activeShift.id}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span>Cashier: <strong className="text-slate-800 dark:text-slate-200">{activeShift.cashierName}</strong></span>
                <span>Started: {new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Shift Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-slate-850">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Opening Float</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                  {settings.currency}{activeShift.openingFloat.toFixed(2)}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-slate-850">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cash Sales</span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  +{settings.currency}{activeShift.totalCashSales.toFixed(2)}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-slate-850">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Card / MoMo</span>
                <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {settings.currency}{(activeShift.totalCardSales + activeShift.totalMobileMoneySales).toFixed(2)}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-slate-850">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cash In / Additions</span>
                <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                  +{settings.currency}{activeShift.cashInTotal.toFixed(2)}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-slate-850">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cash Out / Drops</span>
                <span className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                  -{settings.currency}{activeShift.cashOutTotal.toFixed(2)}
                </span>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/60 p-3 rounded-lg border border-blue-200 dark:border-blue-900">
                <span className="text-[10px] text-blue-600 dark:text-blue-300 font-bold uppercase block">Expected In Drawer</span>
                <span className="text-sm font-black font-mono text-blue-700 dark:text-blue-200">
                  {settings.currency}{runningExpectedCash.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center space-y-3">
            <Lock className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Register Shift Open Currently</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Open a shift with your starting morning cash float to track cash drawer balance, log petty cash expenses, and generate an end-of-day Z-report.
            </p>
            <button
              onClick={() => setShowOpenModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center space-x-1.5 transition-all cursor-pointer"
              type="button"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Start Shift with Cash Float</span>
            </button>
          </div>
        )}
      </div>

      {/* Historical Shifts Archive Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Past Shift History & Z-Reports Archive</h2>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold">
            {shifts.length} Recorded Shifts
          </span>
        </div>

        {shifts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No closed shifts recorded in the registry yet. Completed shift Z-Reports will appear here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">Shift ID / Date</th>
                  <th className="p-3">Cashier</th>
                  <th className="p-3 text-right">Float</th>
                  <th className="p-3 text-right">Cash Sales</th>
                  <th className="p-3 text-right">Total Revenue</th>
                  <th className="p-3 text-right">Actual Count</th>
                  <th className="p-3 text-right">Variance</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {shifts.map(shift => {
                  const grossTotal = shift.totalCashSales + shift.totalCardSales + shift.totalMobileMoneySales + shift.totalCreditSales;
                  const variance = shift.variance ?? 0;

                  return (
                    <tr key={shift.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{shift.id}</div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {new Date(shift.startTime).toLocaleDateString()} • {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-3 font-sans font-medium text-slate-700 dark:text-slate-300">
                        {shift.cashierName}
                      </td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                        {settings.currency}{shift.openingFloat.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {settings.currency}{shift.totalCashSales.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">
                        {settings.currency}{grossTotal.toFixed(2)}
                      </td>
                      <td className="p-3 text-right text-slate-800 dark:text-slate-200">
                        {shift.closingActualCash !== undefined ? `${settings.currency}${shift.closingActualCash.toFixed(2)}` : '—'}
                      </td>
                      <td className="p-3 text-right">
                        {shift.status === 'closed' ? (
                          <span className={`font-bold ${variance === 0 ? 'text-emerald-600' : variance > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                            {variance > 0 ? '+' : ''}{settings.currency}{variance.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          shift.status === 'open' 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {shift.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handlePrintZReport(shift)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg transition-all inline-flex items-center gap-1 font-sans text-xs font-bold cursor-pointer"
                          title="Print / View Z-Report"
                          type="button"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Z-Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. MODAL: OPEN SHIFT */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Open Cashier Register Shift</h3>
                <p className="text-xs text-slate-500">Record your starting morning cash float</p>
              </div>
            </div>

            <form onSubmit={handleOpenSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Starting Cash Float ({settings.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={openingFloatInput}
                  onChange={(e) => setOpeningFloatInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Opening Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified 100 GHS in small denominations"
                  value={openNotesInput}
                  onChange={(e) => setOpenNotesInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Confirm & Open Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: CLOSE SHIFT / Z-REPORT RECONCILIATION */}
      {showCloseModal && activeShift && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">End Shift & Reconcile Z-Report</h3>
                <p className="text-xs text-slate-500">Count physical drawer cash and verify against expected receipts</p>
              </div>
            </div>

            {/* Expected Summary Banner */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Opening Float:</span>
                <span>{settings.currency}{activeShift.openingFloat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>(+) Cash Sales Collected:</span>
                <span>+{settings.currency}{activeShift.totalCashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-600 dark:text-blue-400">
                <span>(+) Cash In (Additions):</span>
                <span>+{settings.currency}{activeShift.cashInTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>(-) Cash Out (Petty Expenses):</span>
                <span>-{settings.currency}{activeShift.cashOutTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Expected Drawer Total:</span>
                <span className="text-blue-600 dark:text-blue-400">{settings.currency}{runningExpectedCash.toFixed(2)}</span>
              </div>
            </div>

            {/* Denominations Helper Accordion */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Cash Denomination Counter (Optional Helper)
              </span>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {Object.keys(denominations).map(denom => (
                  <div key={denom} className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[9.5px] font-bold text-slate-500 block">{settings.currency}{denom} notes</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations[denom] || ''}
                      placeholder="0"
                      onChange={(e) => handleDenominationChange(denom, parseInt(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-center font-mono font-bold mt-1 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleCloseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Actual Counted Cash In Drawer ({settings.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {actualCashInput && !isNaN(parseFloat(actualCashInput)) && (
                <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                  parseFloat(actualCashInput) - runningExpectedCash === 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : parseFloat(actualCashInput) - runningExpectedCash > 0
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}>
                  <span>Drawer Discrepancy:</span>
                  <span className="font-bold text-sm">
                    {parseFloat(actualCashInput) - runningExpectedCash >= 0 ? '+' : ''}
                    {settings.currency}{(parseFloat(actualCashInput) - runningExpectedCash).toFixed(2)}
                    {parseFloat(actualCashInput) - runningExpectedCash === 0 && ' (PERFECT MATCH)'}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Closing Notes & Explanations
                </label>
                <input
                  type="text"
                  placeholder="e.g. End of morning shift. Cash reconciled with manager."
                  value={closeNotesInput}
                  onChange={(e) => setCloseNotesInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  Finalize & Print Z-Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL: CASH IN / CASH OUT ADJUSTMENT */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${
                showMovementModal === 'cash_in'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-600'
              }`}>
                {showMovementModal === 'cash_in' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {showMovementModal === 'cash_in' ? 'Record Cash In (Add to Drawer)' : 'Record Cash Out (Petty Cash / Expense)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {showMovementModal === 'cash_in'
                    ? 'Add change float or cash injection'
                    : 'Expense for courier, lunch, packaging, or bank drop'}
                </p>
              </div>
            </div>

            <form onSubmit={handleMovementSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Amount ({settings.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={movementAmountInput}
                  onChange={(e) => setMovementAmountInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Reason / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder={showMovementModal === 'cash_in' ? 'e.g. Additional 50 GHS coins float' : 'e.g. Courier dispatch fee for bulk customer delivery'}
                  value={movementReasonInput}
                  onChange={(e) => setMovementReasonInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-white font-bold cursor-pointer ${
                    showMovementModal === 'cash_in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
