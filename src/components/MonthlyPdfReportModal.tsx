import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, Printer, Download, Edit3, X, Check, RefreshCw, 
  Building, Calendar, DollarSign, UserCheck, Plus, Trash2, 
  FileSpreadsheet, ShieldCheck, CheckCircle2, ChevronDown, Layers
} from 'lucide-react';
import { Sale, Product } from '../types';

interface MonthlyPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  products: Product[];
  currency: string;
  initialMonthKey?: string; // Format "YYYY-MM" e.g. "2026-08"
}

export default function MonthlyPdfReportModal({
  isOpen,
  onClose,
  sales,
  products,
  currency,
  initialMonthKey
}: MonthlyPdfReportModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Available months from sales history
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    sales.forEach(s => {
      const d = new Date(s.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthSet.add(key);
    });

    // Ensure current month is always an option even if no sales yet
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(currentKey);

    return Array.from(monthSet).sort().reverse();
  }, [sales]);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialMonthKey || availableMonths[0] || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );

  // Parse Year and Month Name
  const formattedMonthLabel = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Editable Header & Metadata Fields
  const [storeName, setStoreName] = useState('MyShop Store Management Desk');
  const [storeAddress, setStoreAddress] = useState('123 Commercial Avenue, Suite 400');
  const [taxId, setTaxId] = useState('PIN-98420119-X');
  const [reportTitle, setReportTitle] = useState(`Monthly Sales & Profit Reconciliation`);
  const [preparedBy, setPreparedBy] = useState('Operations Manager');
  const [approvedBy, setApprovedBy] = useState('General Manager / Owner');
  const [executiveNotes, setExecutiveNotes] = useState(
    'All registered cashier POS receipts and wholesale credit sales for this calendar month have been reconciled with physical bank deposits.'
  );

  // Custom Editable Adjustments (e.g. Tax Adjustments, Bad Debt Write-offs, Discounts)
  const [customAdjustments, setCustomAdjustments] = useState<
    { id: string; description: string; amount: number }[]
  >([
    { id: '1', description: 'Monthly Terminal Operating Discount Allowance', amount: 0 }
  ]);

  const [newAdjDesc, setNewAdjDesc] = useState('');
  const [newAdjAmount, setNewAdjAmount] = useState<number>(0);

  // Raw sales for selected month
  const rawMonthSales = useMemo(() => {
    return sales.filter(s => {
      const d = new Date(s.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [sales, selectedMonth]);

  // Editable Sales List State (allows overriding sale totals/notes specifically for report generation)
  const [editedSales, setEditedSales] = useState<Sale[]>([]);
  const [isEditingSales, setIsEditingSales] = useState(false);

  // Initialize editedSales whenever selectedMonth changes or modal opens
  React.useEffect(() => {
    setEditedSales(JSON.parse(JSON.stringify(rawMonthSales)));
  }, [rawMonthSales, selectedMonth]);

  // Calculations based on edited sales
  const reportTotals = useMemo(() => {
    const totalGrossRevenue = editedSales.reduce((sum, s) => sum + s.total, 0);
    const totalCOGS = editedSales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, i) => itemSum + ((i.wholesaleCost || 0) * i.quantity), 0);
    }, 0);

    const grossProfit = totalGrossRevenue - totalCOGS;
    const totalAdjustments = customAdjustments.reduce((sum, a) => sum + a.amount, 0);
    const netRevenueAfterAdjustments = totalGrossRevenue + totalAdjustments;
    const netProfitFinal = grossProfit + totalAdjustments;

    // Payment method breakdown
    const paymentBreakdown = {
      cash: editedSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0),
      card: editedSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0),
      mobile: editedSales.filter(s => s.paymentMethod === 'mobile_money').reduce((sum, s) => sum + s.total, 0),
      credit: editedSales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.total, 0),
    };

    return {
      totalGrossRevenue,
      totalCOGS,
      grossProfit,
      totalAdjustments,
      netRevenueAfterAdjustments,
      netProfitFinal,
      transactionCount: editedSales.length,
      paymentBreakdown
    };
  }, [editedSales, customAdjustments]);

  // Top products sold in this month
  const topProducts = useMemo(() => {
    const map: { [id: string]: { name: string; qty: number; revenue: number } } = {};
    editedSales.forEach(s => {
      s.items.forEach(i => {
        if (!map[i.productId]) {
          map[i.productId] = { name: i.productName, qty: 0, revenue: 0 };
        }
        map[i.productId].qty += i.quantity;
        map[i.productId].revenue += i.price * i.quantity;
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [editedSales]);

  // Helper to add adjustment
  const handleAddAdjustment = () => {
    if (!newAdjDesc.trim()) return;
    setCustomAdjustments(prev => [
      ...prev,
      { id: Date.now().toString(), description: newAdjDesc.trim(), amount: newAdjAmount }
    ]);
    setNewAdjDesc('');
    setNewAdjAmount(0);
  };

  const handleRemoveAdjustment = (id: string) => {
    setCustomAdjustments(prev => prev.filter(a => a.id !== id));
  };

  // Helper to edit sale inline in draft
  const handleUpdateDraftSaleTotal = (saleId: string, newTotal: number) => {
    setEditedSales(prev => prev.map(s => {
      if (s.id === saleId) {
        return { ...s, total: Math.max(0, newTotal) };
      }
      return s;
    }));
  };

  // Handle CSV Export for active monthly sales
  const handleExportCsv = () => {
    if (editedSales.length === 0) {
      alert("No active transactions to export for this month.");
      return;
    }

    const headers = ["Receipt ID", "Date & Time", "Customer Name", "Payment Method", "Items Purchased", "Gross Amount"];
    const rows = editedSales.map(s => {
      const itemsStr = s.items.map(i => `${i.productName} (x${i.quantity})`).join("; ");
      return [
        `"${s.id}"`,
        `"${new Date(s.timestamp).toLocaleString()}"`,
        `"${(s.customerName || 'Walk-in Customer').replace(/"/g, '""')}"`,
        `"${s.paymentMethod}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        s.total.toFixed(2)
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MyShop_Sales_Report_${selectedMonth}_ActiveOnly.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle PDF Export via browser native print engine formatted specifically for document saving
  const handlePrintPdf = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      
      {/* Printable Wrapper containing Modal UI + Print CSS target */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* NON-PRINTABLE TOP CONTROL BAR */}
        <div className="print:hidden bg-slate-900 text-white p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight">Monthly Sales PDF Export</h2>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Editable Draft Mode
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Edit header info, notes, or adjustment figures before generating your clean monthly PDF.
              </p>
            </div>
          </div>

          {/* Month Selector & Print / Export Buttons */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-lg px-3 py-2 cursor-pointer focus:ring-2 focus:ring-blue-500"
            >
              {availableMonths.map(mKey => {
                const [y, m] = mKey.split('-');
                const d = new Date(parseInt(y), parseInt(m) - 1, 1);
                const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                return (
                  <option key={mKey} value={mKey}>
                    {label} Sales Report
                  </option>
                );
              })}
            </select>

            <button
              onClick={handleExportCsv}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-3 py-2 rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="Export Active Monthly Sales as CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Export as PDF / Print</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN BODY: SPLIT INTO EDITORS (LEFT) + PDF DOCUMENT PREVIEW (RIGHT) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-100 dark:bg-slate-950">
          
          {/* NON-PRINTABLE EDITORS SIDEBAR (4 cols) */}
          <div className="print:hidden lg:col-span-4 space-y-4 text-xs">
            
            {/* Guarantee Callout Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 font-medium flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Voided Receipts Excluded:</strong>
                This export strictly records active, valid sales. Voided receipts are quarantined in the Void Bin and excluded from calculations.
              </div>
            </div>
            
            {/* 1. Report Metadata Configuration */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Edit3 className="w-3.5 h-3.5 text-blue-500" /> Report Header Settings
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Company / Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Tax ID / PIN</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Report Title</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* 2. Executive Manager Notes */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                <FileText className="w-3.5 h-3.5 text-blue-500" /> Manager Remarks & Reconciliation Notes
              </h3>
              <textarea
                rows={3}
                value={executiveNotes}
                onChange={(e) => setExecutiveNotes(e.target.value)}
                placeholder="Add custom notes regarding monthly variances, bank deposits, or cash float..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 3. Manual Revenue / Tax Adjustments */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Monthly Manual Adjustments
              </h3>

              {customAdjustments.length > 0 && (
                <div className="space-y-1.5">
                  {customAdjustments.map((adj) => (
                    <div key={adj.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[170px]">
                        {adj.description}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${adj.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {adj.amount >= 0 ? '+' : ''}{currency}{adj.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleRemoveAdjustment(adj.id)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Adjustment title (e.g. Tax rebate)"
                  value={newAdjDesc}
                  onChange={(e) => setNewAdjDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Amount (+ or -)"
                    value={newAdjAmount || ''}
                    onChange={(e) => setNewAdjAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs"
                  />
                  <button
                    onClick={handleAddAdjustment}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Signatures Configuration */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                <UserCheck className="w-3.5 h-3.5 text-blue-500" /> Signatures & Approvals
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Prepared By</label>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Approved By</label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* PRINTABLE PDF DOCUMENT PREVIEW (8 cols in screen, 12 cols in print) */}
          <div className="lg:col-span-8 print:col-span-12 print:p-0">
            
            {/* The Document Wrapper */}
            <div 
              ref={printRef}
              className="bg-white text-slate-900 p-8 sm:p-10 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xl print:shadow-none print:border-none print:p-0 print:m-0 space-y-6 text-xs"
              id="printable-monthly-pdf"
            >
              
              {/* PDF Header Section */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div>
                  <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {storeName}
                  </h1>
                  <p className="text-slate-600 text-xs mt-0.5">{storeAddress}</p>
                  <p className="text-slate-500 text-[11px] font-mono mt-0.5">Tax Registration PIN: {taxId}</p>
                </div>

                <div className="text-right">
                  <span className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded">
                    Official Financial Statement
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-2">{reportTitle}</h2>
                  <p className="text-blue-700 font-extrabold text-sm">{formattedMonthLabel}</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">Generated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Executive Summary Cards */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="border-r border-slate-200 pr-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gross Revenue</div>
                  <div className="text-sm font-black text-slate-900 mt-1">
                    {currency}{reportTotals.totalGrossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{reportTotals.transactionCount} Orders</div>
                </div>

                <div className="border-r border-slate-200 pr-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cost of Goods (COGS)</div>
                  <div className="text-sm font-black text-slate-700 mt-1">
                    {currency}{reportTotals.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Wholesale Basis</div>
                </div>

                <div className="border-r border-slate-200 pr-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gross Margin / Profit</div>
                  <div className="text-sm font-black text-emerald-700 mt-1">
                    {currency}{reportTotals.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                    {reportTotals.totalGrossRevenue > 0 
                      ? ((reportTotals.grossProfit / reportTotals.totalGrossRevenue) * 100).toFixed(1)
                      : '0'}% Margin
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Net Monthly Total</div>
                  <div className="text-sm font-black text-blue-900 mt-1">
                    {currency}{reportTotals.netProfitFinal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-blue-700 font-bold mt-0.5">Incl. Adjustments</div>
                </div>
              </div>

              {/* Payment Method Breakdown Table */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                  Payment Channels Summary
                </h3>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Cash Intake</span>
                    <strong className="text-slate-900">{currency}{reportTotals.paymentBreakdown.cash.toLocaleString()}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Credit Card POS</span>
                    <strong className="text-slate-900">{currency}{reportTotals.paymentBreakdown.card.toLocaleString()}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Mobile Money (M-Pesa)</span>
                    <strong className="text-slate-900">{currency}{reportTotals.paymentBreakdown.mobile.toLocaleString()}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Wholesale Credit</span>
                    <strong className="text-slate-900">{currency}{reportTotals.paymentBreakdown.credit.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Top Selling Products Summary Table */}
              {topProducts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                    Top Selling Products ({formattedMonthLabel})
                  </h3>
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                        <th className="p-2">Item Description</th>
                        <th className="p-2 text-center">Units Sold</th>
                        <th className="p-2 text-right">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2 font-medium">{p.name}</td>
                          <td className="p-2 text-center">{p.qty}</td>
                          <td className="p-2 text-right font-bold">{currency}{p.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Transactions Ledger Detail Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                  <h3 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider">
                    Detailed Sales Registry Ledger ({editedSales.length} Transactions)
                  </h3>
                  <span className="text-[10px] text-slate-400 print:hidden">
                    Click values in left sidebar to edit draft numbers
                  </span>
                </div>

                {editedSales.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                    No transactions recorded for {formattedMonthLabel}.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold">
                        <th className="p-2 rounded-tl">Receipt #</th>
                        <th className="p-2">Date & Time</th>
                        <th className="p-2">Customer / Notes</th>
                        <th className="p-2 text-center">Payment</th>
                        <th className="p-2 text-right rounded-tr">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editedSales.map((s, idx) => (
                        <tr key={s.id} className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
                          <td className="p-2 font-mono font-bold text-blue-900">{s.id.slice(-8).toUpperCase()}</td>
                          <td className="p-2 text-slate-600">{new Date(s.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="p-2">
                            <span className="font-semibold text-slate-800">{s.customerName}</span>
                            {s.notes && <span className="block text-[10px] text-slate-500 italic">{s.notes}</span>}
                          </td>
                          <td className="p-2 text-center uppercase font-bold text-[10px] text-slate-600">
                            {s.paymentMethod.replace('_', ' ')}
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            {currency}{s.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Reconciliation & Manager Notes Block */}
              {executiveNotes && (
                <div className="bg-amber-50/60 border border-amber-200/80 p-3.5 rounded-lg space-y-1">
                  <div className="font-extrabold text-amber-900 text-[10px] uppercase tracking-wider">
                    Reconciliation & Auditor Remarks:
                  </div>
                  <p className="text-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap">
                    {executiveNotes}
                  </p>
                </div>
              )}

              {/* Official Signatures Section */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-12 text-slate-800">
                <div className="space-y-8">
                  <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                    Prepared By: {preparedBy}
                  </div>
                  <div className="text-[10px] text-slate-400">Signature & Date Stamp</div>
                </div>

                <div className="space-y-8">
                  <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                    Approved By: {approvedBy}
                  </div>
                  <div className="text-[10px] text-slate-400">Signature & Date Stamp</div>
                </div>
              </div>

              {/* Watermark / Footer */}
              <div className="pt-4 text-center border-t border-slate-200 text-[9px] text-slate-400 font-mono">
                MyShop Store Management Desk • Generated as Official Document • Confidential Internal Record
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* PRINT STYLESHEET EMBED: Clean A4 PDF print output */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-monthly-pdf, #printable-monthly-pdf * {
            visibility: visible !important;
          }
          #printable-monthly-pdf {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

    </div>
  );
}
