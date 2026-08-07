import React, { useState, useEffect, useMemo } from 'react';
import { Sale, Product, VoidedSaleRecord } from '../types';
import MonthlyPdfReportModal from './MonthlyPdfReportModal';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Box, 
  Award, 
  Calendar, 
  ArrowRight, 
  HeartHandshake, 
  Filter, 
  Search, 
  Receipt, 
  Printer, 
  ShieldCheck, 
  RefreshCw, 
  ShoppingBag,
  Eye,
  Edit,
  Trash2,
  X,
  Check,
  CheckCircle2,
  Plus,
  Minus,
  Save,
  Lock,
  RotateCcw,
  Undo,
  Archive,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Layers,
  History,
  FileText
} from 'lucide-react';

interface AnalyticsPanelProps {
  sales: Sale[];
  products: Product[];
  currency: string;
  onUpdateSale?: (updatedSale: Sale) => void;
  onDeleteSale?: (saleId: string, restock: boolean) => void;
  onDeleteBulkSales?: (saleIds: string[], restock: boolean) => void;
  voidedSales?: VoidedSaleRecord[];
  onRestoreSale?: (voidId: string) => void;
  onRestoreBulkSales?: (voidIds: string[]) => void;
  activeProfile?: { id: string; name: string; role: string } | null;
}

export default function AnalyticsPanel({ 
  sales, 
  products, 
  currency, 
  onUpdateSale, 
  onDeleteSale, 
  onDeleteBulkSales, 
  voidedSales = [], 
  onRestoreSale, 
  onRestoreBulkSales, 
  activeProfile 
}: AnalyticsPanelProps) {
  const isAdminOrManager = activeProfile?.role === 'admin' || activeProfile?.role === 'manager';

  const [activeSubTab, setActiveSubTab] = useState<'insights' | 'receipts'>(activeProfile?.role === 'cashier' ? 'receipts' : 'insights');
  const [timeframe, setTimeframe] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showMonthlyPdfModal, setShowMonthlyPdfModal] = useState(false);
  const [selectedMonthPdfKey, setSelectedMonthPdfKey] = useState<string | undefined>(undefined);
  
  // Receipt vault & Audit Batch state
  const [receiptVaultTab, setReceiptVaultTab] = useState<'active' | 'void_bin'>('active');
  const [vaultViewMode, setVaultViewMode] = useState<'hierarchy' | 'flat'>('hierarchy');
  const [auditSearch, setAuditSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [cashierFilter, setCashierFilter] = useState('all');
  const [receiptSortOrder, setReceiptSortOrder] = useState<'value_desc' | 'value_asc' | 'time_desc' | 'time_asc'>('value_desc');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Cross-check & finalization states
  const [checklistItemsMatch, setChecklistItemsMatch] = useState(false);
  const [checklistPaymentConfirmed, setChecklistPaymentConfirmed] = useState(false);
  const [crossCheckNotesInput, setCrossCheckNotesInput] = useState('');

  useEffect(() => {
    if (activeProfile?.role === 'cashier') {
      setActiveSubTab('receipts');
    }
  }, [activeProfile?.role]);

  useEffect(() => {
    if (selectedSale) {
      setChecklistItemsMatch(selectedSale.isFinalized || false);
      setChecklistPaymentConfirmed(selectedSale.isFinalized || false);
      setCrossCheckNotesInput(selectedSale.crossCheckNotes || '');
    } else {
      setChecklistItemsMatch(false);
      setChecklistPaymentConfirmed(false);
      setCrossCheckNotesInput('');
    }
  }, [selectedSale?.id]);

  const handleFinalizeReceipt = () => {
    if (!selectedSale || !onUpdateSale) return;
    const updated: Sale = {
      ...selectedSale,
      isFinalized: true,
      checkedBy: activeProfile?.name || 'Cashier',
      checkedTimestamp: Date.now(),
      crossCheckNotes: crossCheckNotesInput.trim() || undefined
    };
    onUpdateSale(updated);
    setSelectedSale(updated);
    alert(`Receipt #${selectedSale.id} has been cross-checked and stamped as Finalized by ${activeProfile?.name || 'Cashier'}.`);
  };

  // Hierarchy accordion state
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>([]);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Bulk deletion states
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const [bulkRestock, setBulkRestock] = useState(true);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);

  // Void Bin & Restoration states
  const [selectedVoidIds, setSelectedVoidIds] = useState<string[]>([]);
  const [showBulkRestoreConfirmModal, setShowBulkRestoreConfirmModal] = useState(false);
  const [selectedVoidRecord, setSelectedVoidRecord] = useState<VoidedSaleRecord | null>(null);

  // Edit sale states
  const [isEditing, setIsEditing] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'card' | 'mobile_money' | 'credit'>('cash');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<any[]>([]);

  useEffect(() => {
    if (selectedSale) {
      setIsEditing(false);
      setEditCustomerName(selectedSale.customerName);
      setEditCustomerPhone(selectedSale.customerPhone);
      setEditPaymentMethod(selectedSale.paymentMethod);
      setEditNotes(selectedSale.notes || '');
      setEditItems(selectedSale.items.map(item => ({ ...item })));
    }
  }, [selectedSale]);

  const updateItemQty = (productId: string, delta: number) => {
    setEditItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    setEditItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, price: Math.max(0, newPrice) };
      }
      return item;
    }));
  };

  const removeItemFromEdit = (productId: string) => {
    if (editItems.length <= 1) {
      alert("A transaction must have at least 1 item. If you want to void the whole sale, you can delete it or zero it out.");
      return;
    }
    setEditItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleSaveEdit = () => {
    if (!selectedSale || !onUpdateSale) return;

    const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = selectedSale.discount || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxRate = 16; // 16% standard tax
    const tax = taxableAmount * (taxRate / 100);
    const total = taxableAmount + tax;

    const updatedSale: Sale = {
      ...selectedSale,
      customerName: editCustomerName.trim() || 'Guest Customer',
      customerPhone: editCustomerPhone.trim() || 'N/A',
      paymentMethod: editPaymentMethod,
      notes: editNotes.trim(),
      items: editItems,
      subtotal,
      tax,
      total
    };

    onUpdateSale(updatedSale);
    setSelectedSale(updatedSale);
    setIsEditing(false);
    alert("Transaction logs updated successfully and physical inventory adjusted.");
  };

  const now = new Date();

  // Helper date comparisons for stats
  const isToday = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toDateString() === now.toDateString();
  };

  const isThisWeek = (timestamp: number) => {
    const oneWeekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    return timestamp >= oneWeekAgo;
  };

  const isThisMonth = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  // 1. Calculate Core Comparative Sales Statistics (Daily, Weekly, Monthly)
  const salesToday = sales.filter(s => isToday(s.timestamp));
  const salesWeek = sales.filter(s => isThisWeek(s.timestamp));
  const salesMonth = sales.filter(s => isThisMonth(s.timestamp));

  const revenueToday = salesToday.reduce((sum, s) => sum + s.total, 0);
  const revenueWeek = salesWeek.reduce((sum, s) => sum + s.total, 0);
  const revenueMonth = salesMonth.reduce((sum, s) => sum + s.total, 0);
  const revenueAll = sales.reduce((sum, s) => sum + s.total, 0);

  // Helper to calculate profit of a subset of sales
  const calculateProfit = (subset: Sale[]) => {
    return subset.reduce((sum, s) => {
      const cogs = s.items.reduce((itemSum, item) => itemSum + ((item.wholesaleCost || 0) * item.quantity), 0);
      return sum + (s.total - cogs);
    }, 0);
  };

  const profitToday = calculateProfit(salesToday);
  const profitWeek = calculateProfit(salesWeek);
  const profitMonth = calculateProfit(salesMonth);
  const profitAll = calculateProfit(sales);

  // Filter sales based on active timeframe selection
  const filteredSales = sales.filter(s => {
    if (timeframe === 'all') return true;
    if (timeframe === 'today') return isToday(s.timestamp);
    if (timeframe === 'week') return isThisWeek(s.timestamp);
    if (timeframe === 'month') return isThisMonth(s.timestamp);
    return true;
  });

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalCOGS = filteredSales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => itemSum + ((item.wholesaleCost || 0) * item.quantity), 0);
  }, 0);

  const netProfit = totalRevenue - totalCOGS;
  const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Aggregate Product Sales Volume
  const productSalesMap: { 
    [id: string]: { 
      name: string; 
      barcode: string; 
      quantity: number; 
      revenue: number; 
      profit: number;
    } 
  } = {};

  filteredSales.forEach(s => {
    s.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.productName,
          barcode: item.barcode,
          quantity: 0,
          revenue: 0,
          profit: 0
        };
      }
      const itemRev = item.price * item.quantity;
      const itemCost = (item.wholesaleCost || 0) * item.quantity;
      const itemProfit = itemRev - itemCost;

      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].revenue += itemRev;
      productSalesMap[item.productId].profit += itemProfit;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Aggregate Customer Leaderboard
  const customerSalesMap: {
    [phoneOrName: string]: {
      name: string;
      phone: string;
      totalSpent: number;
      ordersCount: number;
      lastVisit: number;
    }
  } = {};

  filteredSales.forEach(s => {
    if (s.customerName === 'Walk-in Customer' && s.customerPhone === 'N/A') {
      return; 
    }
    const key = s.customerPhone !== 'N/A' ? s.customerPhone : s.customerName;
    if (!customerSalesMap[key]) {
      customerSalesMap[key] = {
        name: s.customerName,
        phone: s.customerPhone,
        totalSpent: 0,
        ordersCount: 0,
        lastVisit: 0
      };
    }
    customerSalesMap[key].totalSpent += s.total;
    customerSalesMap[key].ordersCount += 1;
    if (s.timestamp > customerSalesMap[key].lastVisit) {
      customerSalesMap[key].lastVisit = s.timestamp;
    }
  });

  const topCustomers = Object.values(customerSalesMap)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  // Outreach simulation
  const handleCustomerCheckIn = (customerName: string, customerPhone: string) => {
    const messages = [
      `Hi ${customerName}, we really appreciate your support at MyShop! Here is a 10% discount coupon for your next purchase: LOYAL10.`,
      `Hello ${customerName}, thank you for shopping with us. We have received new stocks of your favorite categories! Pop in anytime.`,
      `Dear ${customerName}, thank you for being a valued customer. Let us know if you need any wholesale items delivered to your doorstep.`
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    alert(`📢 Customer Outreach Simulation:\n\nTo contact ${customerName} (${customerPhone}), you can send this appreciation message:\n\n"${randomMsg}"`);
  };

  // Extract unique cashier names from sales history for audit filtering
  const uniqueCashiers = Array.from(new Set(
    sales.map(s => s.cashierName).filter((name): name is string => Boolean(name && name.trim()))
  )).sort();

  // 2. Receipt Vault Search & Filtering
  const matchingReceipts = useMemo(() => {
    return sales.filter(s => {
      // Search query matches Receipt ID, Customer Name, Customer Phone, Cashier, or contains product names
      const q = auditSearch.toLowerCase().trim();
      const matchesQuery = !q ? true : (
        s.id.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.customerPhone.toLowerCase().includes(q) ||
        (s.cashierName && s.cashierName.toLowerCase().includes(q)) ||
        s.items.some(item => item.productName.toLowerCase().includes(q))
      );

      const matchesPayment = paymentFilter === 'all' ? true : s.paymentMethod === paymentFilter;
      const matchesCashier = cashierFilter === 'all' ? true : (s.cashierName === cashierFilter);

      return matchesQuery && matchesPayment && matchesCashier;
    }).sort((a, b) => {
      if (receiptSortOrder === 'value_desc') return b.total - a.total;
      if (receiptSortOrder === 'value_asc') return a.total - b.total;
      if (receiptSortOrder === 'time_desc') return b.timestamp - a.timestamp;
      if (receiptSortOrder === 'time_asc') return a.timestamp - b.timestamp;
      return b.total - a.total;
    });
  }, [sales, auditSearch, paymentFilter, cashierFilter, receiptSortOrder]);

  // Date Helpers for Month -> Week -> Day grouping
  const getMonthKey = (ts: number) => {
    const d = new Date(ts);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  };

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getWeekKey = (ts: number) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  };

  const getDayKey = (ts: number) => {
    const d = new Date(ts);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  };

  const getDayLabel = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Build hierarchical grouping tree (Month -> Week -> Day -> Sales)
  const groupedSalesTree = useMemo(() => {
    const monthMap = new Map<string, {
      monthKey: string;
      monthLabel: string;
      totalRevenue: number;
      salesCount: number;
      saleIds: string[];
      weeks: Map<string, {
        weekKey: string;
        weekLabel: string;
        totalRevenue: number;
        salesCount: number;
        saleIds: string[];
        days: Map<string, {
          dayKey: string;
          dayLabel: string;
          totalRevenue: number;
          salesCount: number;
          saleIds: string[];
          sales: Sale[];
        }>;
      }>;
    }>();

    matchingReceipts.forEach(s => {
      const mKey = getMonthKey(s.timestamp);
      const mLabel = getMonthLabel(mKey);
      const wKey = getWeekKey(s.timestamp);
      const dKey = getDayKey(s.timestamp);
      const dLabel = getDayLabel(s.timestamp);

      if (!monthMap.has(mKey)) {
        monthMap.set(mKey, {
          monthKey: mKey,
          monthLabel: mLabel,
          totalRevenue: 0,
          salesCount: 0,
          saleIds: [],
          weeks: new Map()
        });
      }
      const mGroup = monthMap.get(mKey)!;
      mGroup.totalRevenue += s.total;
      mGroup.salesCount += 1;
      mGroup.saleIds.push(s.id);

      if (!mGroup.weeks.has(wKey)) {
        const d = new Date(s.timestamp);
        const dayOfWeek = (d.getDay() + 6) % 7;
        const monday = new Date(d);
        monday.setDate(d.getDate() - dayOfWeek);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        const startStr = monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const endStr = sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const weekLabel = `${wKey.replace('-', ' ')} (${startStr} - ${endStr})`;

        mGroup.weeks.set(wKey, {
          weekKey: wKey,
          weekLabel,
          totalRevenue: 0,
          salesCount: 0,
          saleIds: [],
          days: new Map()
        });
      }
      const wGroup = mGroup.weeks.get(wKey)!;
      wGroup.totalRevenue += s.total;
      wGroup.salesCount += 1;
      wGroup.saleIds.push(s.id);

      if (!wGroup.days.has(dKey)) {
        wGroup.days.set(dKey, {
          dayKey: dKey,
          dayLabel: dLabel,
          totalRevenue: 0,
          salesCount: 0,
          saleIds: [],
          sales: []
        });
      }
      const dGroup = wGroup.days.get(dKey)!;
      dGroup.totalRevenue += s.total;
      dGroup.salesCount += 1;
      dGroup.saleIds.push(s.id);
      dGroup.sales.push(s);
    });

    return Array.from(monthMap.values()).map(m => ({
      ...m,
      weeks: Array.from(m.weeks.values()).map(w => ({
        ...w,
        days: Array.from(w.days.values()).map(d => ({
          ...d,
          sales: [...d.sales].sort((a, b) => {
            if (receiptSortOrder === 'value_desc') return b.total - a.total;
            if (receiptSortOrder === 'value_asc') return a.total - b.total;
            if (receiptSortOrder === 'time_desc') return b.timestamp - a.timestamp;
            if (receiptSortOrder === 'time_asc') return a.timestamp - b.timestamp;
            return b.total - a.total;
          })
        })).sort((a,b) => b.dayKey.localeCompare(a.dayKey))
      })).sort((a,b) => b.weekKey.localeCompare(a.weekKey))
    })).sort((a,b) => b.monthKey.localeCompare(a.monthKey));
  }, [matchingReceipts, receiptSortOrder]);

  useEffect(() => {
    if (groupedSalesTree.length > 0 && expandedMonths.length === 0) {
      setExpandedMonths([groupedSalesTree[0].monthKey]);
      if (groupedSalesTree[0].weeks.length > 0) {
        setExpandedWeeks([groupedSalesTree[0].weeks[0].weekKey]);
      }
    }
  }, [groupedSalesTree]);

  const toggleMonthExpand = (mKey: string) => {
    setExpandedMonths(prev => 
      prev.includes(mKey) ? prev.filter(k => k !== mKey) : [...prev, mKey]
    );
  };

  const toggleWeekExpand = (wKey: string) => {
    setExpandedWeeks(prev => 
      prev.includes(wKey) ? prev.filter(k => k !== wKey) : [...prev, wKey]
    );
  };

  const handleTriggerPeriodBulkVoid = (saleIds: string[], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdminOrManager) {
      alert("🔒 Access Denied: Only Store Managers and System Administrators are authorized to void sales receipts.");
      return;
    }
    if (!saleIds || saleIds.length === 0) return;
    setSelectedSaleIds(saleIds);
    setShowBulkConfirmModal(true);
  };

  // Void bin helpers
  const toggleSelectVoidId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedVoidIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVoided = () => {
    const allIds = voidedSales.map(v => v.id);
    const allSelected = allIds.length > 0 && allIds.every(id => selectedVoidIds.includes(id));
    if (allSelected) {
      setSelectedVoidIds([]);
    } else {
      setSelectedVoidIds(allIds);
    }
  };

  const handleConfirmBulkRestore = () => {
    if (selectedVoidIds.length === 0) return;
    if (onRestoreBulkSales) {
      onRestoreBulkSales(selectedVoidIds);
    } else if (onRestoreSale) {
      selectedVoidIds.forEach(id => onRestoreSale(id));
    }
    setSelectedVoidIds([]);
    setShowBulkRestoreConfirmModal(false);
  };

  // Helper toggle for bulk selection
  const toggleSelectSaleId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSaleIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllMatching = () => {
    const matchingIds = matchingReceipts.map(s => s.id);
    const allSelected = matchingIds.length > 0 && matchingIds.every(id => selectedSaleIds.includes(id));
    if (allSelected) {
      setSelectedSaleIds(prev => prev.filter(id => !matchingIds.includes(id)));
    } else {
      setSelectedSaleIds(prev => Array.from(new Set([...prev, ...matchingIds])));
    }
  };

  const handleConfirmBulkDelete = () => {
    if (!isAdminOrManager) {
      alert("🔒 Access Denied: Only Store Managers and System Administrators are authorized to void sales receipts.");
      return;
    }
    if (selectedSaleIds.length === 0) return;
    const count = selectedSaleIds.length;
    if (onDeleteBulkSales) {
      onDeleteBulkSales(selectedSaleIds, bulkRestock);
    } else if (onDeleteSale) {
      selectedSaleIds.forEach(id => onDeleteSale(id, bulkRestock));
    }
    setSelectedSale(null);
    setSelectedSaleIds([]);
    setShowBulkConfirmModal(false);
    alert(`Successfully voided and deleted ${count} cashier receipt entries from database.`);
  };

  const triggerReceiptPrint = () => {
    if (!selectedSale) return;
    
    // Create an elegant print-only style block
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-receipt-container, #print-receipt-container * {
          visibility: visible;
        }
        #print-receipt-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          max-width: 80mm;
          background: white;
          color: black;
          padding: 10px;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const handleExportReceiptVaultCsv = () => {
    if (matchingReceipts.length === 0) {
      alert("No active receipts found to export.");
      return;
    }

    const headers = ["Receipt ID", "Date", "Time", "Customer Name", "Customer Phone", "Cashier", "Payment Method", "Items Count", "Total Amount"];
    const rows = matchingReceipts.map(s => {
      const d = new Date(s.timestamp);
      const dateStr = d.toLocaleDateString();
      const timeStr = d.toLocaleTimeString();
      const totalItems = s.items.reduce((acc, i) => acc + i.quantity, 0);
      return [
        `"${s.id}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${(s.customerName || 'Walk-in Customer').replace(/"/g, '""')}"`,
        `"${(s.customerPhone || '').replace(/"/g, '""')}"`,
        `"${(s.cashierName || 'Store Operator').replace(/"/g, '""')}"`,
        `"${s.paymentMethod}"`,
        totalItems,
        s.total.toFixed(2)
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MyShop_Receipt_Vault_ActiveReceipts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="analytics-panel-view">
      
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/10">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">MyShop Security & Intelligence Center</h2>
            <p className="text-[11px] text-slate-500">Compare dynamic time periods and verify customer receipts to prevent loss.</p>
          </div>
        </div>

        {/* Primary Sub-tab Selectors & PDF Report Button */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => {
              setSelectedMonthPdfKey(undefined);
              setShowMonthlyPdfModal(true);
            }}
            className="flex items-center space-x-1.5 text-xs px-3.5 py-2 font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm transition-all cursor-pointer"
            type="button"
          >
            <FileText className="w-4 h-4" />
            <span>Export Monthly PDF Report</span>
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('insights')}
              className={`flex items-center space-x-1.5 text-xs px-4 py-2 font-bold rounded-lg transition-all ${
                activeSubTab === 'insights' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Store Performance</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('receipts');
                if (sales.length > 0 && !selectedSale) {
                  setSelectedSale(sales[sales.length - 1]); // default to newest
                }
              }}
              className={`flex items-center space-x-1.5 text-xs px-4 py-2 font-bold rounded-lg transition-all ${
                activeSubTab === 'receipts' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Receipt Vault & Audit</span>
              {sales.length > 0 && (
                <span className="bg-blue-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-black">
                  {sales.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* COMPARATIVE DAILY, WEEKLY, MONTHLY SALES STRIP (Always Visible for fast tracking) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="comparative-sales-dashboard">
        {/* Today */}
        <div className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800/90 dark:to-slate-900/90 border border-slate-200/60 dark:border-slate-700/80 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-blue-300/60 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">Today's Sales (Daily)</span>
              <h4 className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{currency}{revenueToday.toFixed(2)}</h4>
            </div>
            <span className="bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono border dark:border-blue-800/60">
              Today
            </span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
            <span className="text-slate-500 dark:text-slate-400">Profit Margin: <strong className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{currency}{profitToday.toFixed(2)}</strong></span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded font-mono border dark:border-slate-700/60">{salesToday.length} invoices</span>
          </div>
        </div>

        {/* This Week */}
        <div className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800/90 dark:to-slate-900/90 border border-slate-200/60 dark:border-slate-700/80 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-emerald-300/60 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">Last 7 Days (Weekly)</span>
              <h4 className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{currency}{revenueWeek.toFixed(2)}</h4>
            </div>
            <span className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono border dark:border-emerald-800/60">
              7 Days
            </span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
            <span className="text-slate-500 dark:text-slate-400">Profit Margin: <strong className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{currency}{profitWeek.toFixed(2)}</strong></span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded font-mono border dark:border-slate-700/60">{salesWeek.length} invoices</span>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800/90 dark:to-slate-900/90 border border-slate-200/60 dark:border-slate-700/80 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-amber-300/60 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">This Month (Monthly)</span>
              <h4 className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{currency}{revenueMonth.toFixed(2)}</h4>
            </div>
            <span className="bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono border dark:border-amber-800/60">
              Month
            </span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
            <span className="text-slate-500 dark:text-slate-400">Profit Margin: <strong className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{currency}{profitMonth.toFixed(2)}</strong></span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded font-mono border dark:border-slate-700/60">{salesMonth.length} invoices</span>
          </div>
        </div>

        {/* All-time */}
        <div className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800/90 dark:to-slate-900/90 border border-slate-200/60 dark:border-slate-700/80 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-purple-300/60 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">All-Time Cumulative</span>
              <h4 className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{currency}{revenueAll.toFixed(2)}</h4>
            </div>
            <span className="bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono border dark:border-purple-800/60">
              All-Time
            </span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
            <span className="text-slate-500 dark:text-slate-400">Profit Margin: <strong className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{currency}{profitAll.toFixed(2)}</strong></span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded font-mono border dark:border-slate-700/60">{sales.length} invoices</span>
          </div>
        </div>
      </div>


      {/* TAB CONTAINER 1: BUSINESS INSIGHTS */}
      {activeSubTab === 'insights' && (
        <div className="space-y-6">
          
          {/* Performance Filters & Secondary Metrics Grid */}
          <div className="bg-white rounded-xl border border-slate-200/65 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5">
              <span className="bg-slate-100 p-1.5 rounded-lg text-slate-600"><Filter className="w-4 h-4" /></span>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Time-Range Filtered Metrics</span>
                <span className="text-[10px] text-slate-400 block">Adjust timeframe below to focus rankings & margins.</span>
              </div>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
              {[
                { id: 'all', label: 'All-Time' },
                { id: 'month', label: 'This Month' },
                { id: 'week', label: 'Last 7 Days' },
                { id: 'today', label: 'Today Only' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTimeframe(t.id as any)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all ${
                    timeframe === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex items-center space-x-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">Store Revenue</span>
                <span className="text-sm font-bold font-mono text-slate-900">{currency}{totalRevenue.toFixed(2)}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">filtered period</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex items-center space-x-3.5">
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">Total Supplier Cost</span>
                <span className="text-sm font-bold font-mono text-slate-900">{currency}{totalCOGS.toFixed(2)}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">cogs wholesale value</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex items-center space-x-3.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">Gross Profits</span>
                <span className="text-sm font-bold font-mono text-blue-600">{currency}{netProfit.toFixed(2)}</span>
                <span className="text-[9px] text-emerald-600 font-semibold block mt-0.5">Margin: {profitMarginPercent.toFixed(1)}%</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex items-center space-x-3.5">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">Invoices Generated</span>
                <span className="text-sm font-bold font-mono text-slate-900">{filteredSales.length} checkouts</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">stored in database</span>
              </div>
            </div>
          </div>

          {/* Ranking & leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="analytics-ranking-boards">
            
            {/* TOP SELLING PRODUCTS */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-5 space-y-4" id="top-selling-products-card">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Award className="w-4.5 h-4.5 text-blue-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Top-Selling Products ({timeframe})</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">By units sold</span>
              </div>

              {topProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  No sales recorded for this period yet. Complete some sales in Checkout to populate stats!
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Visual mini bar distribution chart */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-3">Volume Distribution:</span>
                    <div className="space-y-3">
                      {topProducts.map((p, idx) => {
                        const maxQty = Math.max(...topProducts.map(item => item.quantity));
                        const barWidth = maxQty > 0 ? (p.quantity / maxQty) * 100 : 0;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-700 font-medium">
                              <span className="truncate max-w-[200px]">{p.name}</span>
                              <span className="font-mono font-bold">{p.quantity} sold</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed product profit metrics */}
                  <div className="space-y-2 text-xs">
                    {topProducts.map((p, index) => (
                      <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-lg hover:bg-slate-100/50 transition-all">
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                            index === 0 ? 'bg-amber-100 text-amber-800' :
                            index === 1 ? 'bg-slate-200 text-slate-800' :
                            index === 2 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 block truncate">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">UPC: {p.barcode}</span>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-bold text-slate-900 block">{currency}{p.revenue.toFixed(2)}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">+{currency}{p.profit.toFixed(2)} profit</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CUSTOMER LOYALTY LEADERBOARD */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-5 space-y-4" id="valued-customers-card">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-4.5 h-4.5 text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Valued Customers ({timeframe})</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">By cash spent</span>
              </div>

              {topCustomers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  No specific customer records registered. To track customer behavior, make sure to enter customer details during checkout!
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                    Identify your store's champion buyers. Reach out to them to check on them or send promotional loyalty vouchers:
                  </p>

                  {topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl hover:bg-slate-100/50 transition-all border border-slate-150">
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold font-mono text-xs">
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 block truncate">{customer.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Phone: {customer.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right font-mono">
                          <span className="font-extrabold text-slate-900 block">{currency}{customer.totalSpent.toFixed(2)}</span>
                          <span className="text-[10px] text-blue-600 font-medium block">{customer.ordersCount} checkouts</span>
                        </div>

                        <button
                          onClick={() => handleCustomerCheckIn(customer.name, customer.phone)}
                          className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all"
                          title="Outreach check-in"
                          type="button"
                        >
                          <HeartHandshake className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* TAB CONTAINER 2: SECURE RECEIPT VAULT & LOSS PREVENTION AUDIT */}
      {activeSubTab === 'receipts' && (
        <div className="space-y-4 animate-fadeIn" id="receipt-vault-workspace">
          
          {/* Top Vault Sub-Tab & View Controls Bar */}
          <div className="flex flex-wrap items-center justify-between bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => { setReceiptVaultTab('active'); setSelectedSale(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  receiptVaultTab === 'active'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Active Receipts Ledger</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${receiptVaultTab === 'active' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
                  {matchingReceipts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setReceiptVaultTab('void_bin'); setSelectedSale(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  receiptVaultTab === 'void_bin'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                }`}
              >
                <Undo className="w-3.5 h-3.5" />
                <span>Voided Receipts Trash & Audit Bin</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${receiptVaultTab === 'void_bin' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-800'}`}>
                  {voidedSales.length}
                </span>
              </button>
            </div>

            {receiptVaultTab === 'active' && (
              <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setVaultViewMode('hierarchy')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1.5 text-[11px] font-bold cursor-pointer ${
                    vaultViewMode === 'hierarchy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                  <span>Month → Week → Day Hierarchy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVaultViewMode('flat')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1.5 text-[11px] font-bold cursor-pointer ${
                    vaultViewMode === 'flat' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Flat List View</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportReceiptVaultCsv}
                  className="px-3 py-1 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white transition-all flex items-center space-x-1.5 text-[11px] font-extrabold cursor-pointer shadow-xs ml-auto"
                  title="Export Active Receipts as CSV (Voided Receipts Excluded)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export Active Ledger (CSV)</span>
                </button>
              </div>
            )}
          </div>

          {/* MAIN ACTIVE RECEIPTS LEDGER VIEW */}
          {receiptVaultTab === 'active' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Search & Hierarchy / Flat List (cols 5) */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                
                {/* Search & Audit Filters Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs space-y-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Loss Prevention & Cashier Audit Filter</span>
                  
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="Receipt #, customer, cashier, product..."
                      className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 bg-slate-50/50 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {/* Cashier Filter Select */}
                    <div>
                      <label className="text-slate-400 font-medium text-[10px] block mb-1">Filter Cashier:</label>
                      <select
                        value={cashierFilter}
                        onChange={(e) => setCashierFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 w-full focus:outline-none"
                      >
                        <option value="all">All Cashiers ({sales.length})</option>
                        {uniqueCashiers.map(cName => (
                          <option key={cName} value={cName}>
                            {cName} ({sales.filter(s => s.cashierName === cName).length})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Payment filter select */}
                    <div>
                      <label className="text-slate-400 font-medium text-[10px] block mb-1">Filter Payment:</label>
                      <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 w-full focus:outline-none"
                      >
                        <option value="all">All Methods</option>
                        <option value="cash">Cash Tendered</option>
                        <option value="card">Credit/Debit Card</option>
                        <option value="mobile_money">Mobile Transfer</option>
                        <option value="credit">Store Credit</option>
                      </select>
                    </div>

                    {/* Sort Receipts per Day Select */}
                    <div>
                      <label className="text-blue-700 font-extrabold text-[10px] block mb-1">Sort Daily Receipts:</label>
                      <select
                        value={receiptSortOrder}
                        onChange={(e) => setReceiptSortOrder(e.target.value as any)}
                        className="bg-blue-50/80 border border-blue-300 rounded-lg p-1.5 text-xs text-blue-900 font-bold w-full focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="value_desc">💎 Highest Value First</option>
                        <option value="value_asc">🪙 Lowest Value First</option>
                        <option value="time_desc">🕒 Time: Newest First</option>
                        <option value="time_asc">⏳ Time: Oldest First</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bulk Actions Banner when items are checked */}
                {selectedSaleIds.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl shadow-xs space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span className="font-bold text-rose-900">
                          {selectedSaleIds.length} receipt{selectedSaleIds.length > 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-rose-800">
                        Valued: {currency}{sales.filter(s => selectedSaleIds.includes(s.id)).reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between space-x-2 pt-1">
                      <button
                        onClick={() => setSelectedSaleIds([])}
                        className="text-[10px] text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
                        type="button"
                      >
                        Deselect All
                      </button>

                      <button
                        onClick={() => setShowBulkConfirmModal(true)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Void & Delete Selected ({selectedSaleIds.length})</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* HIERARCHY DRILLDOWN VIEW (Month -> Week -> Day) */}
                {vaultViewMode === 'hierarchy' ? (
                  <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden flex-1 min-h-[420px] max-h-[580px] overflow-y-auto flex flex-col p-3 space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider pb-2 border-b border-slate-100">
                      <span>Hierarchical Date Audit ({groupedSalesTree.length} Months)</span>
                      {selectedDayKey && (
                        <button
                          onClick={() => setSelectedDayKey(null)}
                          className="text-blue-600 hover:underline cursor-pointer font-bold lowercase"
                          type="button"
                        >
                          clear day filter
                        </button>
                      )}
                    </div>

                    {groupedSalesTree.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-semibold text-slate-600">No receipt periods found</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 overflow-y-auto pr-1">
                        {groupedSalesTree.map(mGroup => {
                          const isMonthExpanded = expandedMonths.includes(mGroup.monthKey);

                          return (
                            <div key={mGroup.monthKey} className="border border-slate-200/80 rounded-xl overflow-hidden shadow-xs bg-slate-50/40">
                              
                              {/* Month Header */}
                              <div
                                onClick={() => toggleMonthExpand(mGroup.monthKey)}
                                className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between cursor-pointer border-b border-slate-100 transition-all select-none"
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  {isMonthExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-blue-600 shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                  )}
                                  <span className="font-extrabold text-xs text-slate-900 font-mono">{mGroup.monthLabel}</span>
                                  <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                                    {mGroup.salesCount} sale{mGroup.salesCount > 1 ? 's' : ''}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-2 shrink-0">
                                  <span className="font-mono text-xs font-bold text-slate-900">
                                    {currency}{mGroup.totalRevenue.toFixed(2)}
                                  </span>

                                  {/* Export Month PDF Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMonthPdfKey(mGroup.monthKey);
                                      setShowMonthlyPdfModal(true);
                                    }}
                                    className="p-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[10px] font-bold flex items-center space-x-1 border border-blue-200 transition-all cursor-pointer"
                                    title={`Export ${mGroup.monthLabel} Sales PDF Report`}
                                    type="button"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span className="hidden sm:inline">Export PDF</span>
                                  </button>

                                  {/* Bulk Void Month Button */}
                                  {isAdminOrManager && (
                                    <button
                                      onClick={(e) => handleTriggerPeriodBulkVoid(mGroup.saleIds, e)}
                                      className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[10px] font-bold flex items-center space-x-1 border border-rose-200 transition-all cursor-pointer"
                                      title={`Bulk void all ${mGroup.salesCount} receipts for ${mGroup.monthLabel}`}
                                      type="button"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span className="hidden sm:inline">Void Month</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Month Weeks Content */}
                              {isMonthExpanded && (
                                <div className="p-2 space-y-2 bg-slate-50/60">
                                  {mGroup.weeks.map(wGroup => {
                                    const isWeekExpanded = expandedWeeks.includes(wGroup.weekKey);

                                    return (
                                      <div key={wGroup.weekKey} className="border border-slate-200/60 rounded-lg bg-white overflow-hidden shadow-2xs">
                                        
                                        {/* Week Header */}
                                        <div
                                          onClick={() => toggleWeekExpand(wGroup.weekKey)}
                                          className="p-2.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer select-none transition-all"
                                        >
                                          <div className="flex items-center space-x-2 min-w-0">
                                            {isWeekExpanded ? (
                                              <ChevronDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                            ) : (
                                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            )}
                                            <span className="font-bold text-[11px] text-slate-800 font-mono truncate">{wGroup.weekLabel}</span>
                                            <span className="text-[8px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-mono font-bold">
                                              {wGroup.salesCount}
                                            </span>
                                          </div>

                                          <div className="flex items-center space-x-2 shrink-0">
                                            <span className="font-mono text-[11px] font-bold text-slate-800">
                                              {currency}{wGroup.totalRevenue.toFixed(2)}
                                            </span>

                                            {/* Bulk Void Week Button */}
                                            {isAdminOrManager && (
                                              <button
                                                onClick={(e) => handleTriggerPeriodBulkVoid(wGroup.saleIds, e)}
                                                className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-[9px] font-bold flex items-center space-x-1 border border-rose-200 cursor-pointer"
                                                title={`Bulk void all ${wGroup.salesCount} receipts for ${wGroup.weekLabel}`}
                                                type="button"
                                              >
                                                <Trash2 className="w-2.5 h-2.5" />
                                                <span>Void Week</span>
                                              </button>
                                            )}
                                          </div>
                                        </div>

                                        {/* Week Days Content */}
                                        {isWeekExpanded && (
                                          <div className="p-2 divide-y divide-slate-100 bg-white">
                                            {wGroup.days.map(dGroup => {
                                              const isDayActive = selectedDayKey === dGroup.dayKey;

                                              return (
                                                <div key={dGroup.dayKey} className="py-2 first:pt-0 last:pb-0 space-y-1.5">
                                                  
                                                  {/* Day Row */}
                                                  <div className="flex items-center justify-between text-xs">
                                                    <button
                                                      onClick={() => setSelectedDayKey(isDayActive ? null : dGroup.dayKey)}
                                                      className={`font-bold font-mono text-[11px] flex items-center space-x-1.5 cursor-pointer hover:underline ${
                                                        isDayActive ? 'text-blue-700 underline' : 'text-slate-800'
                                                      }`}
                                                      type="button"
                                                    >
                                                      <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                                                      <span>{dGroup.dayLabel}</span>
                                                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-normal">
                                                        {dGroup.salesCount} receipts
                                                      </span>
                                                    </button>

                                                    <div className="flex items-center space-x-2">
                                                      <span className="font-mono text-[11px] font-extrabold text-slate-900">
                                                        {currency}{dGroup.totalRevenue.toFixed(2)}
                                                      </span>

                                                      {/* Bulk Void Day Button */}
                                                      {isAdminOrManager && (
                                                        <button
                                                          onClick={(e) => handleTriggerPeriodBulkVoid(dGroup.saleIds, e)}
                                                          className="px-1.5 py-0.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-[9px] font-bold flex items-center space-x-1 border border-rose-200 cursor-pointer"
                                                          title={`Bulk void all ${dGroup.salesCount} receipts for ${dGroup.dayLabel}`}
                                                          type="button"
                                                        >
                                                          <Trash2 className="w-2.5 h-2.5" />
                                                          <span>Void Day</span>
                                                        </button>
                                                      )}
                                                    </div>
                                                  </div>

                                                  {/* Display individual sales on this day if day is active */}
                                                  {isDayActive && (
                                                    <div className="pl-3 border-l-2 border-l-blue-500 space-y-1.5 my-1.5 animate-fadeIn">
                                                      <div className="flex items-center justify-between text-[9px] text-blue-700 font-extrabold uppercase tracking-wider pb-0.5 border-b border-slate-100">
                                                        <span>Sorted by {
                                                          receiptSortOrder === 'value_desc' ? 'Highest Purchase Value' :
                                                          receiptSortOrder === 'value_asc' ? 'Lowest Purchase Value' :
                                                          receiptSortOrder === 'time_desc' ? 'Newest Time' : 'Oldest Time'
                                                        }</span>
                                                        <span>{dGroup.sales.length} receipts</span>
                                                      </div>

                                                      {dGroup.sales.map(s => {
                                                        const isSelected = selectedSale?.id === s.id;
                                                        const isChecked = selectedSaleIds.includes(s.id);

                                                        return (
                                                          <div
                                                            key={s.id}
                                                            onClick={() => setSelectedSale(s)}
                                                            className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                                                              isSelected ? 'bg-blue-50 border-blue-400 font-bold' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                          >
                                                            <div className="flex items-center space-x-2 min-w-0 pr-1">
                                                              <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={(e) => toggleSelectSaleId(s.id, e as any)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer shrink-0"
                                                              />
                                                              <div className="min-w-0">
                                                                <div className="flex items-center space-x-1">
                                                                  <span className="font-mono font-extrabold text-[10px] truncate">{s.id}</span>
                                                                  <span className="text-[8px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-mono shrink-0">
                                                                    {s.paymentMethod.replace(/_/g, ' ')}
                                                                  </span>
                                                                </div>
                                                                <span className="text-[9px] text-slate-500 block truncate font-medium">
                                                                  {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {s.cashierName || 'Cashier'} {s.customerName ? `• ${s.customerName}` : ''}
                                                                </span>
                                                              </div>
                                                            </div>

                                                            <div className="flex items-center space-x-1.5 shrink-0">
                                                              <span className="font-mono font-extrabold text-slate-900 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                                                                {currency}{s.total.toFixed(2)}
                                                              </span>
                                                              {isAdminOrManager && (
                                                                <button
                                                                  onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedSaleIds([s.id]);
                                                                    setShowBulkConfirmModal(true);
                                                                  }}
                                                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                                                  title={`Void receipt ${s.id}`}
                                                                  type="button"
                                                                >
                                                                  <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                              )}
                                                            </div>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}

                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}

                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* FLAT LIST VIEW */
                  <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden flex-1 min-h-[400px] max-h-[550px] overflow-y-auto flex flex-col">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={matchingReceipts.length > 0 && matchingReceipts.every(s => selectedSaleIds.includes(s.id))}
                          onChange={toggleSelectAllMatching}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          title="Select / Deselect all matching receipts for bulk audit deletion"
                        />
                        <span>Select All ({matchingReceipts.length})</span>
                      </div>
                      <span>Sorted: {
                        receiptSortOrder === 'value_desc' ? 'Highest Value' :
                        receiptSortOrder === 'value_asc' ? 'Lowest Value' :
                        receiptSortOrder === 'time_desc' ? 'Newest Time' : 'Oldest Time'
                      }</span>
                    </div>

                    {matchingReceipts.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                        <Receipt className="w-10 h-10 text-slate-300 stroke-1" />
                        <p className="text-xs font-semibold text-slate-600">No matching receipts found</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                        {matchingReceipts.map((s) => {
                          const isSelected = selectedSale?.id === s.id;
                          const isChecked = selectedSaleIds.includes(s.id);
                          return (
                            <div
                              key={s.id}
                              onClick={() => setSelectedSale(s)}
                              className={`w-full text-left p-3.5 flex items-start space-x-3 transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-blue-50/70 border-l-4 border-l-blue-600' 
                                  : isChecked
                                  ? 'bg-rose-50/40 border-l-4 border-l-rose-400'
                                  : 'hover:bg-slate-50/50 border-l-4 border-l-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => toggleSelectSaleId(s.id, e as any)}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-1 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer shrink-0"
                              />

                              <div className="flex-1 flex justify-between items-start min-w-0">
                                <div className="space-y-1 min-w-0 pr-2">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-bold text-slate-900 font-mono text-[11px] block truncate">{s.id}</span>
                                    <span className="bg-slate-100 text-slate-600 text-[8px] font-bold px-1 py-0.2 rounded font-mono">
                                      {s.paymentMethod.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                  
                                  <div className="text-[10px] text-slate-500 space-y-0.5">
                                    <div className="truncate font-medium">Customer: {s.customerName}</div>
                                    <div className="text-slate-400 font-mono text-[9px]">
                                      {new Date(s.timestamp).toLocaleString()}
                                    </div>
                                    {s.cashierName && (
                                      <div className="text-slate-600 font-semibold text-[9px]">
                                        Cashier: {s.cashierName}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="font-bold text-slate-900 font-mono text-xs block">{currency}{s.total.toFixed(2)}</span>
                                  <span className="text-[9px] font-semibold text-slate-400 block">{s.items.length} unique items</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

          {/* Right Column: High-fidelity POS Receipt Viewer (cols 7) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {selectedSale ? (
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-5 flex flex-col">
                
                {/* Header Audit Tools */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4.5 h-4.5 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Audited Customer Receipt</span>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                        <span>● Verified Paid State</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {isAdminOrManager ? (
                      <>
                        {!isEditing && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all border border-amber-200 cursor-pointer"
                            title="Edit cashier's checkout details to ensure correct vouchers"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Entry</span>
                          </button>
                        )}
                        {!isEditing && onDeleteSale && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to void/delete receipt ${selectedSale.id}? This action will restock the items to retail shelf inventory.`)) {
                                onDeleteSale(selectedSale.id, true);
                                setSelectedSale(null);
                                alert("Receipt successfully voided and stock restocked.");
                              }
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all border border-rose-200 cursor-pointer"
                            title="Void receipt and restock physical inventory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Void Receipt</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="text-[10px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 font-bold flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Voiding Restricted to Managers & Admins</span>
                      </div>
                    )}
                    <button
                      onClick={triggerReceiptPrint}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                      title="Simulate paper thermal printing of this audited receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Hard Copy</span>
                    </button>
                  </div>
                </div>

                {/* THE HIGH FIDELITY THERMAL RECEIPT CANVAS OR EDIT INTERFACE */}
                {isEditing ? (
                  <div className="flex justify-center p-6 bg-amber-50/40 rounded-xl border border-amber-200" id="receipt-edit-wrapper">
                    <div 
                      className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full border border-amber-300 overflow-hidden text-xs text-slate-800 font-mono flex flex-col relative"
                      id="edit-receipt-container"
                    >
                      <div className="absolute top-[2%] right-[4%] bg-amber-100 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 text-[9px] rounded uppercase font-sans animate-pulse">
                        Editing Entry
                      </div>

                      {/* Header */}
                      <div className="text-center space-y-1 mb-4">
                        <h3 className="text-sm font-bold text-black uppercase tracking-wide">Edit Receipt</h3>
                        <p className="text-[10px] text-amber-600 font-sans font-semibold">
                          Modify parameters to match accurate sales vouchers
                        </p>
                        <div className="h-px border-t border-dashed border-slate-300 my-2.5"></div>
                        
                        <div className="text-[10px] text-left text-slate-600 space-y-2 font-mono">
                          <div><strong>RECEIPT ID:</strong> {selectedSale.id}</div>
                          <div><strong>TIMESTAMP:</strong> {new Date(selectedSale.timestamp).toLocaleString()}</div>
                          
                          <div>
                            <label className="block text-[9px] font-sans font-bold text-slate-500 uppercase">Customer Name *</label>
                            <input
                              type="text"
                              value={editCustomerName}
                              onChange={(e) => setEditCustomerName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-amber-500 mt-0.5"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-sans font-bold text-slate-500 uppercase">Customer Phone</label>
                              <input
                                type="text"
                                value={editCustomerPhone}
                                onChange={(e) => setEditCustomerPhone(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-amber-500 mt-0.5"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-sans font-bold text-slate-500 uppercase">Payment Method *</label>
                              <select
                                value={editPaymentMethod}
                                onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-amber-500 mt-0.5"
                              >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="mobile_money">Mobile Money</option>
                                <option value="credit">Store Credit</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="h-px border-t border-dashed border-slate-300 my-2.5"></div>
                      </div>

                      {/* Items table */}
                      <div className="space-y-2 mb-4">
                        <div className="grid grid-cols-12 gap-1 border-b border-dashed border-slate-300 text-[10px] text-slate-500 pb-1 uppercase font-bold">
                          <span className="col-span-5 text-left">Item Name</span>
                          <span className="col-span-3 text-center">Qty</span>
                          <span className="col-span-3 text-right">Price</span>
                          <span className="col-span-1 text-center"></span>
                        </div>
                        {editItems.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-1 items-center py-1 border-b border-slate-50">
                            <span className="col-span-5 truncate text-slate-800 font-sans" title={item.productName}>
                              {item.productName}
                            </span>
                            
                            <div className="col-span-3 flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => updateItemQty(item.productId, -1)}
                                className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold flex items-center justify-center text-[10px]"
                              >
                                -
                              </button>
                              <span className="text-center font-bold text-slate-900 w-5">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateItemQty(item.productId, 1)}
                                className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold flex items-center justify-center text-[10px]"
                              >
                                +
                              </button>
                            </div>

                            <div className="col-span-3 text-right relative">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.price}
                                onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 border border-slate-200 rounded p-0.5 text-right font-mono text-[10px] text-slate-800"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItemFromEdit(item.productId)}
                              className="col-span-1 text-red-500 hover:text-red-700 flex justify-center cursor-pointer"
                              title="Delete item from receipt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Totals Breakdown */}
                      <div className="font-mono text-[11px] space-y-1.5 border-t border-dashed border-slate-300 pt-2.5 mb-4 text-black">
                        {(() => {
                          const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                          const discount = selectedSale.discount || 0;
                          const taxableAmount = Math.max(0, subtotal - discount);
                          const taxRate = 16;
                          const tax = taxableAmount * (taxRate / 100);
                          const total = taxableAmount + tax;

                          return (
                            <>
                              <div className="flex justify-between text-slate-500">
                                <span>RECALCULATED SUB</span>
                                <span>{currency}{subtotal.toFixed(2)}</span>
                              </div>
                              {discount > 0 && (
                                <div className="flex justify-between text-rose-700 font-semibold">
                                  <span>DISCOUNT SAVINGS</span>
                                  <span>-{currency}{discount.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-slate-500">
                                <span>RECALCULATED VAT (16%)</span>
                                <span>{currency}{tax.toFixed(2)}</span>
                              </div>
                              <div className="h-px border-t border-dashed border-slate-300 my-1"></div>
                              <div className="flex justify-between text-xs font-bold text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200/50">
                                <span>ADJUSTED TOTAL</span>
                                <span>{currency}{total.toFixed(2)}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Notes / Reason for editing */}
                      <div className="space-y-1 mb-4 font-sans text-[10px]">
                        <label className="block font-bold text-slate-500 uppercase">Audit Adjustment Notes *</label>
                        <textarea
                          required
                          placeholder="e.g. Corrected cashier entry typo; updated physical payment mode to Card"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      {/* Action buttons inside the receipt */}
                      <div className="flex space-x-2 pt-2 border-t border-dashed border-slate-200">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-sans font-bold py-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center space-x-1 text-[11px]"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-sans font-bold py-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center space-x-1 text-[11px] shadow-sm shadow-amber-600/10"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center p-6 bg-slate-50 rounded-xl border border-slate-200/45" id="receipt-print-wrapper">
                    <div 
                      className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full border border-slate-200 overflow-hidden text-xs text-slate-800 font-mono flex flex-col relative"
                      id="print-receipt-container"
                    >
                      {/* Security Stamp overlay */}
                      <div className="absolute top-[35%] right-[5%] -rotate-12 pointer-events-none select-none opacity-15 border-[3px] border-emerald-600 text-emerald-600 font-black px-4 py-2 text-sm tracking-widest rounded-md">
                        PAID & VERIFIED
                      </div>

                      {/* Receipt Details and Header */}
                      <div className="text-center space-y-1 mb-4">
                        <h3 className="text-sm font-bold text-black uppercase tracking-wide">MyShop POS Receipt</h3>
                        <p className="text-[9px] text-slate-500 leading-normal">
                          100 Storefront Plaza, Suite A<br />
                          New York, NY 10001
                        </p>
                        <div className="h-px border-t border-dashed border-slate-300 my-2.5"></div>
                        
                        <div className="text-[10px] text-left text-slate-600 space-y-0.5 font-mono">
                          <div><strong>RECEIPT ID:</strong> {selectedSale.id}</div>
                          <div><strong>TIMESTAMP:</strong> {new Date(selectedSale.timestamp).toLocaleString()}</div>
                          <div><strong>CASHIER:</strong> {selectedSale.cashierName || 'System Admin'}</div>
                          <div><strong>CUSTOMER:</strong> {selectedSale.customerName}</div>
                          {selectedSale.customerPhone && selectedSale.customerPhone !== 'N/A' && (
                            <div><strong>PHONE:</strong> {selectedSale.customerPhone}</div>
                          )}
                        </div>
                        <div className="h-px border-t border-dashed border-slate-300 my-2.5"></div>
                      </div>

                      {/* Items table */}
                      <table className="w-full text-left text-[11px] font-mono mb-4">
                        <thead>
                          <tr className="border-b border-dashed border-slate-300 text-slate-500">
                            <th className="pb-1 text-left">Item Name</th>
                            <th className="pb-1 text-center">Qty</th>
                            <th className="pb-1 text-right">Unit</th>
                            <th className="pb-1 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSale.items.map((item, idx) => (
                            <tr key={idx} className="text-black hover:bg-slate-50/20">
                              <td className="py-1 max-w-[140px] truncate">{item.productName}</td>
                              <td className="py-1 text-center">{item.quantity}</td>
                              <td className="py-1 text-right">{currency}{item.price.toFixed(2)}</td>
                              <td className="py-1 text-right">{currency}{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Receipt totals breakdown */}
                      <div className="font-mono text-[11px] space-y-1.5 border-t border-dashed border-slate-300 pt-2.5 mb-4 text-black">
                        <div className="flex justify-between">
                          <span>SUBTOTAL</span>
                          <span>{currency}{selectedSale.subtotal.toFixed(2)}</span>
                        </div>
                        {selectedSale.discount > 0 && (
                          <div className="flex justify-between text-rose-700 font-semibold">
                            <span>DISCOUNT SAVINGS</span>
                            <span>-{currency}{selectedSale.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>TAX VAT RATE ({sales[0] ? '16%' : 'Tax'})</span>
                          <span>{currency}{selectedSale.tax.toFixed(2)}</span>
                        </div>
                        <div className="h-px border-t border-dashed border-slate-300 my-1"></div>
                        <div className="flex justify-between text-xs font-bold text-black">
                          <span>GRAND TOTAL</span>
                          <span>{currency}{selectedSale.total.toFixed(2)}</span>
                        </div>
                        <div className="h-px border-t border-dashed border-slate-300 my-1"></div>
                        <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase">
                          <span>METHOD OF PAYMENT</span>
                          <span>{selectedSale.paymentMethod.replace(/_/g, ' ')}</span>
                        </div>
                      </div>

                      {/* Notes if any */}
                      {selectedSale.notes && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/50 text-[10px] text-slate-600 mb-4 font-mono leading-relaxed">
                          <span className="font-bold text-[9px] text-slate-400 block uppercase mb-0.5">Audit Checkout Notes:</span>
                          "{selectedSale.notes}"
                        </div>
                      )}

                      {/* Authentic-looking barcode representation */}
                      <div className="flex flex-col items-center justify-center space-y-1 py-1 text-center">
                        <div className="flex h-10 items-stretch space-x-[1px] opacity-80" title={selectedSale.id}>
                          {selectedSale.id.split('').map((char, index) => {
                            const barClass = (char.charCodeAt(0) % 3 === 0) ? 'w-[3px]' : (char.charCodeAt(0) % 2 === 0) ? 'w-[1.5px]' : 'w-[0.5px]';
                            const colorClass = (index % 4 === 0) ? 'bg-transparent' : 'bg-slate-900';
                            return <div key={index} className={`${barClass} ${colorClass}`}></div>;
                          })}
                        </div>
                        <span className="text-[8px] text-slate-400 tracking-wider font-mono uppercase">{selectedSale.id}</span>
                      </div>

                      {/* Receipt footers */}
                      <div className="text-center font-mono text-[9px] text-slate-400 space-y-1.5 mt-3 pt-3 border-t border-dashed border-slate-200 leading-normal">
                        <p>THANK YOU FOR YOUR VALUED BUSINESS!</p>
                        <p className="text-[8px]">Please retain receipt for verification.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cashier Cross-Check & Finalize Verification Panel */}
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                        Cashier Receipt Cross-Check & Finalization
                      </span>
                    </div>
                    {selectedSale.isFinalized ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1 border border-emerald-200">
                        <Check className="w-3 h-3" />
                        <span>Verified & Finalized</span>
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        Pending Cashier Cross-Check
                      </span>
                    )}
                  </div>

                  {selectedSale.isFinalized ? (
                    <div className="bg-emerald-50/90 border border-emerald-200 rounded-lg p-3 space-y-1.5 text-xs text-emerald-900">
                      <div className="flex items-center space-x-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Transaction Confirmed & Verified</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Cross-checked by <strong>{selectedSale.checkedBy || 'Cashier'}</strong> on {selectedSale.checkedTimestamp ? new Date(selectedSale.checkedTimestamp).toLocaleString() : 'Recent'}.
                      </p>
                      {selectedSale.crossCheckNotes && (
                        <div className="bg-white p-2 rounded border border-emerald-200 text-[10px] text-slate-700 font-mono mt-1">
                          <span className="font-bold text-slate-400 block text-[9px] uppercase">Cashier Cross-Check Note:</span>
                          "{selectedSale.crossCheckNotes}"
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateSale) {
                            const updated = { ...selectedSale, isFinalized: false };
                            onUpdateSale(updated);
                            setSelectedSale(updated);
                          }
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 underline font-semibold mt-1 cursor-pointer block"
                      >
                        Re-open Cross-Check Checklist
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        Cashiers must inspect physical goods with the customer and confirm payment receipt before stamping as Finalized.
                      </p>

                      <div className="space-y-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                        <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checklistItemsMatch}
                            onChange={(e) => setChecklistItemsMatch(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                          />
                          <span className="text-slate-700 font-medium leading-tight">
                            Confirm <strong>{selectedSale.items.reduce((acc, i) => acc + i.quantity, 0)} items</strong> match customer bag & physical receipt
                          </span>
                        </label>

                        <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checklistPaymentConfirmed}
                            onChange={(e) => setChecklistPaymentConfirmed(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                          />
                          <span className="text-slate-700 font-medium leading-tight">
                            Confirm total payment <strong>{currency}{selectedSale.total.toFixed(2)}</strong> received via <strong className="uppercase">{selectedSale.paymentMethod.replace(/_/g, ' ')}</strong>
                          </span>
                        </label>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Cashier Cross-Check Remarks</label>
                        <input
                          type="text"
                          value={crossCheckNotesInput}
                          onChange={(e) => setCrossCheckNotesInput(e.target.value)}
                          placeholder="e.g. Verified items with customer present, change rendered..."
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleFinalizeReceipt}
                        disabled={!(checklistItemsMatch && checklistPaymentConfirmed)}
                        className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs ${
                          checklistItemsMatch && checklistPaymentConfirmed
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:shadow-md'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm Customer Purchase & Finalize Receipt</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Audit verification advice card */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-800 space-y-1.5">
                  <span className="font-bold block text-blue-900 uppercase tracking-wide text-[10px]">Anti-Theft Auditing Tip:</span>
                  <p className="leading-relaxed">
                    Verify the **Receipt ID** printed on the customer's paper slip or mobile wallet matches this electronic record. Check that the cashier is **{selectedSale.cashierName || 'an authorized account'}** to ensure no unauthorized items were self-tendering!
                  </p>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                <Receipt className="w-12 h-12 text-slate-300 stroke-1" />
                <h4 className="font-bold text-slate-700">No Receipt Selected</h4>
                <p className="text-xs max-w-sm text-slate-400 leading-normal">
                  Click on any transaction log in the left panel to inspect its high-fidelity thermal receipt, audit cashier records, and confirm verification statuses.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
          {/* VOIDED RECEIPTS TRASH & AUDIT BIN VIEW */}
          {receiptVaultTab === 'void_bin' && (
            !isAdminOrManager ? (
              <div className="bg-white rounded-2xl border border-rose-200 p-12 text-center max-w-lg mx-auto my-8 space-y-4 shadow-sm animate-fadeIn">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Void Bin Restricted</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The Voided Receipts Trash Bin and Restoration audit tools are strictly restricted to <strong>Store Managers</strong> and <strong>System Administrators</strong> to prevent unauthorized cashier overrides.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setReceiptVaultTab('active')}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-xs"
                  >
                    Return to Active Receipts Ledger
                  </button>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              
              {/* Left Column: Voided List & Bulk Restoration (cols 5) */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                
                {/* Header Banner */}
                <div className="bg-rose-900 text-white p-4 rounded-xl shadow-md space-y-2">
                  <div className="flex items-center space-x-2">
                    <Undo className="w-5 h-5 text-rose-300" />
                    <h3 className="font-bold text-sm">Voided Receipts Audit & Undo Vault</h3>
                  </div>
                  <p className="text-[11px] text-rose-200 leading-relaxed font-medium">
                    Restorable transaction archive. Any mistakenly deleted cashier logs can be restored back to active sales with 1-click inventory consistency adjustments.
                  </p>
                </div>

                {/* Bulk Actions Banner when voided items are checked */}
                {selectedVoidIds.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl shadow-xs space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <RotateCcw className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-emerald-900">
                          {selectedVoidIds.length} voided receipt{selectedVoidIds.length > 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-emerald-800">
                        Valued: {currency}{voidedSales.filter(v => selectedVoidIds.includes(v.id)).reduce((acc, curr) => acc + curr.sale.total, 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between space-x-2 pt-1">
                      <button
                        onClick={() => setSelectedVoidIds([])}
                        className="text-[10px] text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
                        type="button"
                      >
                        Deselect All
                      </button>

                      <button
                        onClick={() => setShowBulkRestoreConfirmModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                        type="button"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Undo Void & Restore Selected ({selectedVoidIds.length})</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Voided Receipts List */}
                <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden flex-1 min-h-[400px] max-h-[550px] overflow-y-auto flex flex-col">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={voidedSales.length > 0 && voidedSales.every(v => selectedVoidIds.includes(v.id))}
                        onChange={toggleSelectAllVoided}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Select all voided receipts for bulk restoration"
                      />
                      <span>Select All Voided ({voidedSales.length})</span>
                    </div>
                    <span>Void History Log</span>
                  </div>

                  {voidedSales.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                      <Archive className="w-10 h-10 text-slate-300 stroke-1" />
                      <p className="text-xs font-semibold text-slate-600">No voided receipts in vault</p>
                      <p className="text-[10px] max-w-xs text-slate-400">
                        When cashier entries are deleted or bulk voided from active logs, they will appear here and remain 100% restorable.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                      {voidedSales.map((vRecord) => {
                        const isSelected = selectedVoidRecord?.id === vRecord.id;
                        const isChecked = selectedVoidIds.includes(vRecord.id);

                        return (
                          <div
                            key={vRecord.id}
                            onClick={() => setSelectedVoidRecord(vRecord)}
                            className={`w-full text-left p-3.5 flex items-start space-x-3 transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-rose-50/80 border-l-4 border-l-rose-600' 
                                : isChecked
                                ? 'bg-emerald-50/40 border-l-4 border-l-emerald-400'
                                : 'hover:bg-slate-50/50 border-l-4 border-l-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => toggleSelectVoidId(vRecord.id, e as any)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                            />

                            <div className="flex-1 flex justify-between items-start min-w-0">
                              <div className="space-y-1 min-w-0 pr-2">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-slate-900 font-mono text-[11px] block truncate">{vRecord.sale.id}</span>
                                  <span className="bg-rose-100 text-rose-800 text-[8px] font-extrabold px-1.5 py-0.2 rounded font-mono uppercase">
                                    VOIDED
                                  </span>
                                  {vRecord.restocked && (
                                    <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.2 rounded font-mono">
                                      RESTOCKED
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-[10px] text-slate-500 space-y-0.5">
                                  <div className="truncate font-medium">Customer: {vRecord.sale.customerName}</div>
                                  <div className="text-slate-400 font-mono text-[9px]">
                                    Voided: {new Date(vRecord.voidTimestamp).toLocaleString()} by {vRecord.voidedBy || 'Operator'}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0 space-y-1">
                                <span className="font-bold text-slate-900 font-mono text-xs block">{currency}{vRecord.sale.total.toFixed(2)}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onRestoreSale) onRestoreSale(vRecord.id);
                                  }}
                                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
                                  title="Restore sale back to active ledger"
                                  type="button"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>Restore</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Voided Receipt Inspector & Restore Panel (cols 7) */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                {selectedVoidRecord ? (
                  <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-5 flex flex-col space-y-4">
                    
                    {/* Header Banner for Voided Inspector */}
                    <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-rose-900">
                        <Trash2 className="w-5 h-5 text-rose-600" />
                        <div>
                          <h4 className="font-bold text-xs">Voided Transaction Log #{selectedVoidRecord.sale.id}</h4>
                          <p className="text-[10px] text-rose-700">
                            Voided on {new Date(selectedVoidRecord.voidTimestamp).toLocaleString()} • Restock strategy: {selectedVoidRecord.restocked ? 'Items returned to shelf' : 'Inventory unchanged'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (onRestoreSale) onRestoreSale(selectedVoidRecord.id);
                          setSelectedVoidRecord(null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                        type="button"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Undo Void & Restore</span>
                      </button>
                    </div>

                    {/* Receipt Body */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 font-mono text-xs max-w-sm mx-auto w-full relative">
                      <div className="text-center space-y-1 mb-3 pb-3 border-b border-dashed border-slate-300">
                        <span className="text-rose-600 font-black text-sm uppercase tracking-widest block">[ VOIDED RECEIPT ]</span>
                        <h4 className="font-bold text-slate-800">MyShop POS Record</h4>
                        <p className="text-[10px] text-slate-500">ID: {selectedVoidRecord.sale.id}</p>
                        <p className="text-[10px] text-slate-400">Date: {new Date(selectedVoidRecord.sale.timestamp).toLocaleString()}</p>
                      </div>

                      <div className="space-y-1.5 mb-3 text-[11px]">
                        <div className="flex justify-between font-bold text-slate-700 border-b border-slate-200 pb-1">
                          <span>ITEM</span>
                          <span>QTY x PRICE</span>
                        </div>
                        {selectedVoidRecord.sale.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-slate-600 text-[10px]">
                            <span>{it.productName}</span>
                            <span>{it.quantity} x {currency}{it.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 font-bold text-slate-800">
                        <div className="flex justify-between text-xs text-rose-700">
                          <span>TOTAL VOIDED VALUE</span>
                          <span>{currency}{selectedVoidRecord.sale.total.toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          Customer: {selectedVoidRecord.sale.customerName} ({selectedVoidRecord.sale.customerPhone})
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          Cashier: {selectedVoidRecord.sale.cashierName || 'Cashier'}
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                    <Undo className="w-12 h-12 text-slate-300 stroke-1" />
                    <h4 className="font-bold text-slate-700">No Voided Record Selected</h4>
                    <p className="text-xs max-w-sm text-slate-400 leading-normal">
                      Click on any voided transaction log on the left to review its details and trigger 1-click restoration back into active store ledgers.
                    </p>
                  </div>
                )}
              </div>

            </div>
          ))}

        </div>
      )}
      {showBulkRestoreConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-800">
            <div className="flex items-center space-x-3 text-emerald-600 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Undo Void & Restore Receipts</h3>
                <p className="text-[11px] text-slate-500 font-medium">Re-instate Transaction Ledger Consistency</p>
              </div>
            </div>

            <div className="text-xs space-y-3">
              <p className="leading-relaxed font-medium">
                You are about to restore <strong className="text-emerald-600">{selectedVoidIds.length} voided receipt(s)</strong> back into active sales records.
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected Voided Records:</span>
                  <span className="font-bold text-slate-900">{selectedVoidIds.length} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Combined Value:</span>
                  <span className="font-bold text-emerald-600">
                    {currency}{voidedSales.filter(v => selectedVoidIds.includes(v.id)).reduce((acc, curr) => acc + curr.sale.total, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-900 text-[11px] space-y-1">
                <span className="font-bold block">Inventory Balance Note:</span>
                <p>
                  If any of these voided receipts were restocked upon deletion, restoring them will automatically deduct the item quantities back from shelf inventory.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowBulkRestoreConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkRestore}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                type="button"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Restore ({selectedVoidIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {showBulkConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-800">
            <div className="flex items-center space-x-3 text-rose-600 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Bulk Cashier Log Deletion</h3>
                <p className="text-[11px] text-slate-500 font-medium">Audit & Tax Filing Pre-Correction Tool</p>
              </div>
            </div>

            <div className="text-xs space-y-3">
              <p className="leading-relaxed font-medium">
                You are about to permanently void and delete <strong className="text-rose-600">{selectedSaleIds.length} cashier receipt entry errors</strong> from your store's sales database.
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected Receipts:</span>
                  <span className="font-bold text-slate-900">{selectedSaleIds.length} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Revenue Value:</span>
                  <span className="font-bold text-rose-600">
                    {currency}{sales.filter(s => selectedSaleIds.includes(s.id)).reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}
                  </span>
                </div>
                {cashierFilter !== 'all' && (
                  <div className="flex justify-between text-blue-700">
                    <span className="text-slate-500">Filtered Cashier:</span>
                    <span className="font-bold">{cashierFilter}</span>
                  </div>
                )}
              </div>

              {/* Restock Choice */}
              <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-amber-900 block uppercase tracking-wider">Inventory Adjustment Strategy:</span>
                
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkRestockChoice"
                    checked={bulkRestock === true}
                    onChange={() => setBulkRestock(true)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Void & Restock Items to Shelf</span>
                    <span className="text-[10px] text-slate-500 leading-tight block">
                      Recommended for mistakenly entered sales. Automatically returns item quantities to active retail stock levels.
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 cursor-pointer pt-1 border-t border-amber-200/50">
                  <input
                    type="radio"
                    name="bulkRestockChoice"
                    checked={bulkRestock === false}
                    onChange={() => setBulkRestock(false)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Void Without Restocking Inventory</span>
                    <span className="text-[10px] text-slate-500 leading-tight block">
                      Use if cashiers entered duplicate logs or test transactions for physical items that were never taken off shelves.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowBulkConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                type="button"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Bulk Delete ({selectedSaleIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY PDF SALES REPORT EXPORT MODAL */}
      <MonthlyPdfReportModal
        isOpen={showMonthlyPdfModal}
        onClose={() => setShowMonthlyPdfModal(false)}
        sales={sales}
        products={products}
        currency={currency}
        initialMonthKey={selectedMonthPdfKey}
      />

    </div>
  );
}
